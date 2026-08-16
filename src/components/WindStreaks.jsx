import { useEffect, useRef } from 'react';

const STREAK_RGB = '111,75,232';

function rand(min, max) { return min + Math.random() * (max - min); }

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
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = null;
    let running = false;
    let last = 0;

    function makeParticle(spreadAcrossWidth) {
      const len = rand(50, 150);
      return {
        x: spreadAcrossWidth ? rand(-len, width) : -len,
        y: rand(0, height),
        len,
        speed: rand(50, 130),
        thickness: rand(0.6, 2),
        opacity: rand(0.07, 0.26),
        wobble: rand(3, 10),
        wobbleSpeed: rand(0.6, 1.6),
        phase: rand(0, Math.PI * 2),
      };
    }

    function seed() {
      const count = Math.max(12, Math.round((width * height) / 11000));
      particles = Array.from({ length: count }, () => makeParticle(true));
    }

    function resize() {
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.speed * dt;
        p.phase += p.wobbleSpeed * dt;
        const y = p.y + Math.sin(p.phase) * p.wobble;
        const grad = ctx.createLinearGradient(p.x, y, p.x + p.len, y);
        grad.addColorStop(0, `rgba(${STREAK_RGB},0)`);
        grad.addColorStop(0.5, `rgba(${STREAK_RGB},${p.opacity})`);
        grad.addColorStop(1, `rgba(${STREAK_RGB},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + p.len, y);
        ctx.stroke();
        if (p.x > width) Object.assign(p, makeParticle(false));
      }
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      ctx.clearRect(0, 0, width, height);
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
