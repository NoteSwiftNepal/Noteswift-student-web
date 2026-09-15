"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  size: number;
  color: string;
  life: number;
}

// A lightweight, dependency-free canvas-confetti-style burst — no
// react-native-fast-confetti equivalent exists for web, and pulling in a
// new npm package for one effect isn't worth it when a burst is ~40 lines
// of canvas particles. Fires once from the center on mount, fades out, and
// cleans up its own animation frame/canvas on unmount.
export function CelebrationConfetti({ colors }: { colors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2 - 80;

    const particles: Particle[] = Array.from({ length: 120 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 20,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      };
    });

    let rafId: number;
    const gravity = 0.15;
    const drag = 0.98;

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let anyAlive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        p.life -= 0.008;
        if (p.life <= 0) continue;
        anyAlive = true;

        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (anyAlive) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [colors]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[100]" />;
}
