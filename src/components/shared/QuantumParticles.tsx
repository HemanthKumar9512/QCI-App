import React, { useRef, useEffect, useCallback } from 'react';

const PARTICLE_COLORS = ['#0891B2', '#7C3AED', '#10B981'];

interface Particle {
  x: number; y: number; vx: number; vy: number; color: string; size: number;
}

const QuantumParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: PARTICLE_COLORS[Math.floor(Math.random() * 3)],
      size: Math.random() * 2 + 1,
    }));
  }, []);

  useEffect(() => {
    init();
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    };
    window.addEventListener('resize', handleResize);

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
      }

      // Lines between close particles
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', handleResize); };
  }, [init]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
};

export default QuantumParticles;
