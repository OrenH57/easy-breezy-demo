import { useEffect, useRef } from 'react';

const BASE_RGB = '111,75,232';
const HIGHLIGHT_RGB = '163,138,245';

function rand(min, max) { return min + Math.random() * (max - min); }
function lerp(a, b, t) { return a + (b - a) * t; }

// A cheap, smooth pseudo-noise flow field: mostly rightward ("wind"),
// with layered sine turbulence for organic curl/swirl instead of straight lines.
function flowAngle(x, y, t) {
  return (
    Math.sin(x * 0.006 + t * 0.5) * 0.7 +
    Math.cos(y * 0.01 - t * 0.35) * 0.5 +
    Math.sin((x - y) * 0.004 + t * 0.22) * 0.4
  );
}

export function WindStreaks() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const ctx = canvas.getContext('2d');
    const mobileQuery = window.matchMedia('(max-width: 650px)');
    let particles = [];
    let motes = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = null;
    let running = false;
    let last = 0;
    let clock = 0;
    const pointer = { x: -9999, y: -9999, active: false, fade: 0 };

    function makeParticle() {
      const depth = Math.random();
      return {
        x: rand(0, width),
        y: rand(0, height),
        depth,
        speed: lerp(40, 130, depth),
        size: lerp(0.8, 2.2, depth),
        opacity: lerp(0.1, 0.4, depth),
        tail: lerp(26, 70, depth),
      };
    }

    function makeMote() {
      return {
        x: rand(0, width),
        y: rand(0, height),
        r: rand(14, 40),
        speed: rand(6, 16),
        opacity: rand(0.025, 0.07),
        phase: rand(0, Math.PI * 2),
      };
    }

    function seed() {
      const count = Math.max(50, Math.round((width * height) / 3200));
      particles = Array.from({ length: count }, makeParticle);
      motes = Array.from({ length: Math.max(3, Math.round(count / 24)) }, makeMote);
    }

    function resize() {
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      seed();
    }

    function pointerPosFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    function onPointerMove(e) {
      const p = pointerPosFromEvent(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
      pointer.fade = 1;
    }
    function onPointerEnd() { pointer.active = false; }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock += dt;
      if (!pointer.active) pointer.fade = Math.max(0, pointer.fade - dt * 0.5);

      // Repaint a translucent wash of the page's own background color so old
      // strokes fade into a trail instead of vanishing instantly.
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, 0, width, height);

      for (const m of motes) {
        m.phase += dt * 0.35;
        const mx = ((m.x + clock * m.speed) % (width + 80)) - 40;
        const my = m.y + Math.sin(m.phase) * 12;
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, m.r);
        grad.addColorStop(0, `rgba(${HIGHLIGHT_RGB},${m.opacity})`);
        grad.addColorStop(1, `rgba(${HIGHLIGHT_RGB},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of particles) {
        let angle = flowAngle(p.x, p.y, clock);
        if (pointer.fade > 0) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy) || 1;
          const radius = 150;
          if (dist < radius) {
            const swirl = Math.atan2(dy, dx) + Math.PI / 2;
            const strength = Math.min(1, ((1 - dist / radius) * pointer.fade) * 2.6);
            angle = lerp(angle, swirl, strength);
          }
        }
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle) * 0.55;
        const mag = Math.hypot(dirX, dirY) || 1;
        const ux = dirX / mag;
        const uy = dirY / mag;
        const tailX = p.x - ux * p.tail;
        const tailY = p.y - uy * p.tail;

        const rgb = p.depth > 0.72 ? HIGHLIGHT_RGB : BASE_RGB;
        const grad = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
        grad.addColorStop(0, `rgba(${rgb},0)`);
        grad.addColorStop(1, `rgba(${rgb},${p.opacity})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        p.x += dirX * p.speed * dt;
        p.y += dirY * p.speed * dt;
        if (p.x < -15 || p.x > width + 15 || p.y < -15 || p.y > height + 15) {
          Object.assign(p, makeParticle());
          p.x = -10;
        }
      }

      if (running) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      last = performance.now();
      raf = requestAnimationFrame(frame);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('touchmove', onPointerMove, { passive: true });
      canvas.addEventListener('pointerleave', onPointerEnd);
      canvas.addEventListener('touchend', onPointerEnd);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      ctx.clearRect(0, 0, width, height);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('touchmove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerEnd);
      canvas.removeEventListener('touchend', onPointerEnd);
    }

    function syncToViewport() {
      if (mobileQuery.matches && !document.hidden) start();
      else stop();
    }

    syncToViewport();
    mobileQuery.addEventListener('change', syncToViewport);
    document.addEventListener('visibilitychange', syncToViewport);

    const ro = new ResizeObserver(() => { if (running) resize(); });
    ro.observe(parent);

    return () => {
      stop();
      mobileQuery.removeEventListener('change', syncToViewport);
      document.removeEventListener('visibilitychange', syncToViewport);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-breeze" aria-hidden="true" />;
}
