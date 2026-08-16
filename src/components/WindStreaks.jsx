import { useEffect, useRef } from 'react';

const GLOW_RGB = '124,109,240'; // soft violet-blue glow, on-brand
const CORE_RGB = '255,255,255'; // bright highlight down the ribbon's spine
const LEAF_RGB = '109,168,92';
const FRAME_INTERVAL = 1000 / 30; // decorative background: 30fps is plenty and cheaper
const SAMPLE_STEP = 22;

function rand(min, max) { return min + Math.random() * (max - min); }
function lerp(a, b, t) { return a + (b - a) * t; }

function makeRibbon(width, height, index, total) {
  const band = total > 1 ? index / (total - 1) : 0.4;
  return {
    baseY: height * lerp(0.24, 0.6, band) + rand(-14, 14),
    waveAmp: rand(26, 46),
    waveFreq: rand(0.006, 0.011),
    wavePhaseSpeed: rand(0.45, 0.75),
    phase: rand(0, Math.PI * 2),
    gustSpeed: rand(55, 95),
    gustOffsetA: rand(0, width),
    gustOffsetB: rand(0, width),
    gustSpread: rand(170, 260),
    pulseSpeed: rand(0.5, 0.85),
    pulsePhase: rand(0, Math.PI * 2),
    glowWidth: rand(16, 24),
    coreWidth: rand(2.5, 4),
  };
}

function makeLeaf(width, height) {
  return {
    x: rand(0, width),
    y: rand(height * 0.1, height * 0.85),
    size: rand(9, 16),
    speed: rand(26, 58),
    rot: rand(0, Math.PI * 2),
    spin: rand(-1.4, 1.4),
    bobPhase: rand(0, Math.PI * 2),
    bobAmp: rand(6, 16),
    opacity: rand(0.55, 0.9),
  };
}

export function WindStreaks() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const ctx = canvas.getContext('2d');
    let ribbons = [];
    let leaves = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = null;
    let running = false;
    let inView = true;
    let last = 0;
    let clock = 0;
    const pointer = { x: -9999, y: -9999, active: false, fade: 0 };

    function seed() {
      ribbons = [makeRibbon(width, height, 0, 2), makeRibbon(width, height, 1, 2)];
      leaves = Array.from({ length: 7 }, () => makeLeaf(width, height));
    }

    function resize() {
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      seed();
    }

    // Tracked on window (not the canvas) since the canvas is pointer-events:none
    // so it never sits behind the click target; events still bubble from
    // whatever's underneath, and getBoundingClientRect() here re-reads the
    // canvas's live position each time, so this also stays correct through scroll.
    function updatePointerFromClient(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const margin = 40;
      if (x < -margin || x > width + margin || y < -margin || y > height + margin) {
        pointer.active = false;
        return;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.fade = 1;
    }
    function onMouseMove(e) { updatePointerFromClient(e.clientX, e.clientY); }
    function onTouchMove(e) {
      const t = e.touches && e.touches[0];
      if (t) updatePointerFromClient(t.clientX, t.clientY);
    }
    function onTouchEnd() { pointer.active = false; }

    function ribbonY(r, x, t) {
      const wave = Math.sin(x * r.waveFreq + t * r.wavePhaseSpeed + r.phase) * r.waveAmp
        + Math.sin(x * r.waveFreq * 2.1 - t * r.wavePhaseSpeed * 0.55) * r.waveAmp * 0.3;
      let y = r.baseY + wave;
      if (pointer.fade > 0) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        const radius = 170;
        if (dist < radius) {
          const push = (1 - dist / radius) * pointer.fade * 46;
          y += (dy < 0 ? -push : push);
        }
      }
      return y;
    }

    function drawRibbon(r, t) {
      const span = width + r.gustSpread * 4;
      const centerA = ((t * r.gustSpeed + r.gustOffsetA) % span) - r.gustSpread * 2;
      const centerB = ((t * r.gustSpeed + r.gustOffsetB) % span) - r.gustSpread * 2;
      const pulse = 0.7 + 0.3 * Math.sin(t * r.pulseSpeed + r.pulsePhase);
      const steps = Math.ceil(width / SAMPLE_STEP) + 1;
      const pts = new Array(steps);
      const env = new Array(steps);
      for (let i = 0; i < steps; i++) {
        const x = i * SAMPLE_STEP;
        pts[i] = { x, y: ribbonY(r, x, t) };
        const envA = Math.exp(-((x - centerA) ** 2) / (2 * r.gustSpread ** 2));
        const envB = Math.exp(-((x - centerB) ** 2) / (2 * r.gustSpread ** 2));
        env[i] = Math.min(1, envA + envB) * pulse;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < steps - 1; i++) {
        const a = ((env[i] + env[i + 1]) / 2) * 0.34 + 0.06;
        ctx.strokeStyle = `rgba(${GLOW_RGB},${a})`;
        ctx.lineWidth = r.glowWidth;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();
      }
      for (let i = 0; i < steps - 1; i++) {
        const a = ((env[i] + env[i + 1]) / 2) * 0.75 + 0.1;
        ctx.strokeStyle = `rgba(${CORE_RGB},${a})`;
        ctx.lineWidth = r.coreWidth;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();
      }
    }

    function drawLeaf(l) {
      const y = l.y + Math.sin(clock * 1.4 + l.bobPhase) * l.bobAmp * 0.3;
      ctx.save();
      ctx.translate(l.x, y);
      ctx.rotate(l.rot);
      ctx.globalAlpha = l.opacity;
      const s = l.size;
      ctx.fillStyle = `rgb(${LEAF_RGB})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 0.5, -s * 0.5, s, 0);
      ctx.quadraticCurveTo(s * 0.5, s * 0.5, 0, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s, 0);
      ctx.stroke();
      ctx.restore();
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - last < FRAME_INTERVAL) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock += dt;
      if (!pointer.active) pointer.fade = Math.max(0, pointer.fade - dt * 0.5);

      ctx.clearRect(0, 0, width, height);

      for (const r of ribbons) drawRibbon(r, clock);

      for (const l of leaves) {
        l.x += l.speed * dt;
        l.rot += l.spin * dt;
        if (l.x > width + 20) {
          Object.assign(l, makeLeaf(width, height));
          l.x = -20;
        }
        drawLeaf(l);
      }
      ctx.globalAlpha = 1;
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      last = performance.now();
      raf = requestAnimationFrame(frame);
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      ctx.clearRect(0, 0, width, height);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    }

    function syncToViewport() {
      if (!document.hidden && inView) start();
      else stop();
    }

    syncToViewport();
    document.addEventListener('visibilitychange', syncToViewport);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncToViewport();
    }, { threshold: 0.05 });
    io.observe(parent);

    const ro = new ResizeObserver(() => { if (running) resize(); });
    ro.observe(parent);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', syncToViewport);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-breeze" aria-hidden="true" />;
}
