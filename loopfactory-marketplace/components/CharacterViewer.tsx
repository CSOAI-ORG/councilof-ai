"use client";

import { useEffect, useRef } from "react";
import { type ArchetypeType, ARCHETYPES } from "@/lib/mockData";

interface CharacterViewerProps {
  archetype: ArchetypeType;
  className?: string;
}

export function CharacterViewer({ archetype, className }: CharacterViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const archetypeInfo = ARCHETYPES[archetype];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.01;
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const gradient = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        Math.max(w, h) / 2
      );
      gradient.addColorStop(0, archetypeInfo.color + "22");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Main rotating shape
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.25;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.5);

      ctx.beginPath();
      const sides = 8;
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const r =
          baseRadius +
          Math.sin(time * 2 + i * 1.5) * baseRadius * 0.15;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.fillStyle = archetypeInfo.color + "44";
      ctx.strokeStyle = archetypeInfo.color;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Inner detail
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = archetypeInfo.color + "66";
      ctx.fill();
      ctx.strokeStyle = archetypeInfo.color + "AA";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Orbiting particles
      for (let i = 0; i < 6; i++) {
        const angle = time * 0.8 + (i / 6) * Math.PI * 2;
        const dist = baseRadius * 1.6;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = archetypeInfo.color + "BB";
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [archetypeInfo.color]);

  return (
    <div className={`relative rounded-xl border bg-muted/30 ${className || ""}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
        style={{ display: "block" }}
      />
      <div className="absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-1 text-xs backdrop-blur">
        <span
          className="mr-1 inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: archetypeInfo.color }}
        />
        {archetype} — {archetypeInfo.material}
      </div>
      <div className="absolute top-3 right-3 rounded-md bg-background/80 px-2 py-1 text-xs backdrop-blur text-muted-foreground">
        Three.js Preview (Canvas 2D placeholder)
      </div>
    </div>
  );
}
