import { useEffect, useRef } from 'react';

interface ConfettiOverlayProps {
  burstKey: number;
  intensity?: 'normal' | 'milestone';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  shape: 'rect' | 'circle' | 'star';
  alpha: number;
  life: number;
  maxLife: number;
}

const COLORS = ['#FFC93C', '#FF6B2B', '#34F58C', '#6A52A8', '#3B9BFF', '#FF4D79', '#FFF8EB'];

export function ConfettiOverlay({ burstKey, intensity = 'normal' }: ConfettiOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (burstKey === 0) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = intensity === 'milestone' ? 76 : 42;
    const originX = w * 0.5;
    const originY = h * 0.58;

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const speed = (intensity === 'milestone' ? 6.5 : 5) + Math.random() * 8.5;
      particlesRef.current.push({
        x: originX + (Math.random() - 0.5) * 90,
        y: originY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
        vy: Math.sin(angle) * speed - Math.random() * 2.5,
        size: 5 + Math.random() * 5.5,
        color: COLORS[i % COLORS.length],
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.28,
        shape: i % 5 === 0 ? 'star' : i % 3 === 0 ? 'circle' : 'rect',
        alpha: 1,
        life: 0,
        maxLife: 56 + Math.random() * 34,
      });
    }

    if (rafRef.current !== null) return;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      const next: Particle[] = [];

      for (const p of particlesRef.current) {
        p.life += 1;
        if (p.life >= p.maxLife) continue;
        p.vy += 0.24; // gravity
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        p.alpha = Math.max(0, 1 - Math.pow(p.life / p.maxLife, 1.8));

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Crisp 4-point carnival sparkle star
          ctx.beginPath();
          const r = p.size * 0.65;
          for (let j = 0; j < 8; j++) {
            const rad = j % 2 === 0 ? r : r * 0.38;
            const a = (j * Math.PI) / 4;
            if (j === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
            else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        next.push(p);
      }

      particlesRef.current = next;
      if (next.length > 0) {
        rafRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, w, h);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(render);
  }, [burstKey, intensity]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="confetti-canvas"
    />
  );
}
