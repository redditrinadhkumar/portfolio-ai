'use client';

import { useEffect, useRef } from 'react';

interface Node3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  glowColor: string;
  tag?: string;
  isClusterCenter?: boolean;
}

const CLUSTERS = [
  { name: 'RAG Pipeline', color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.4)', center: { x: -180, y: -90, z: 80 } },
  { name: 'LangGraph', color: '#818CF8', glow: 'rgba(129, 140, 248, 0.4)', center: { x: 190, y: -120, z: -50 } },
  { name: 'Vector DB', color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.4)', center: { x: -120, y: 140, z: -70 } },
  { name: 'Agentic AI', color: '#A855F7', glow: 'rgba(168, 85, 247, 0.4)', center: { x: 160, y: 110, z: 90 } },
  { name: 'PyTorch / ML', color: '#34D399', glow: 'rgba(52, 211, 153, 0.4)', center: { x: 0, y: 10, z: -120 } },
];

const TOTAL_NODES = 65;
const MAX_CONNECT_DIST_3D = 220;
const FOCAL_LENGTH = 550;
const CAMERA_DISTANCE = 500;

/**
 * FLOATING 3D EMBEDDING SPACE
 * ----------------------------
 * Projects a 3D vector space of neural embedding nodes with perspective depth,
 * semantic vector clusters, rotational drift, and interactive mouse parallax.
 */
export function EmbeddingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    }
    resize();

    // Check theme
    let isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Create 3D Nodes
    const nodes: Node3D[] = [];

    // 1. Cluster centroid nodes
    CLUSTERS.forEach((cluster) => {
      nodes.push({
        x: cluster.center.x,
        y: cluster.center.y,
        z: cluster.center.z,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        vz: (Math.random() - 0.5) * 0.15,
        radius: 4.5,
        color: cluster.color,
        glowColor: cluster.glow,
        tag: cluster.name,
        isClusterCenter: true,
      });

      // Orbiting points around cluster
      for (let i = 0; i < 7; i++) {
        const offset = 85;
        nodes.push({
          x: cluster.center.x + (Math.random() - 0.5) * offset * 2,
          y: cluster.center.y + (Math.random() - 0.5) * offset * 2,
          z: cluster.center.z + (Math.random() - 0.5) * offset * 2,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          vz: (Math.random() - 0.5) * 0.25,
          radius: Math.random() * 1.8 + 1.2,
          color: cluster.color,
          glowColor: cluster.glow,
        });
      }
    });

    // 2. Ambient background space nodes
    while (nodes.length < TOTAL_NODES) {
      nodes.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 500,
        z: (Math.random() - 0.5) * 500,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        vz: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.5 + 0.8,
        color: '#94A3B8',
        glowColor: 'rgba(148, 163, 184, 0.25)',
      });
    }

    // Camera angles
    let angleY = 0;
    let angleX = 0;
    let targetAngleY = 0;
    let targetAngleX = 0;

    function handleMouseMove(e: MouseEvent) {
      const normX = (e.clientX / width - 0.5) * 2;
      const normY = (e.clientY / height - 0.5) * 2;
      targetAngleY = normX * 0.45;
      targetAngleX = -normY * 0.35;
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let raf: number;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Smooth camera interpolation
      angleY += (targetAngleY - angleY) * 0.04 + 0.0018; // auto orbit drift
      angleX += (targetAngleX - angleX) * 0.04;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Bounding box limits for drifting
      const BOUND = 320;

      // Update positions
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;

        if (n.x < -BOUND || n.x > BOUND) n.vx *= -1;
        if (n.y < -BOUND || n.y > BOUND) n.vy *= -1;
        if (n.z < -BOUND || n.z > BOUND) n.vz *= -1;
      }

      // Projected points cache
      interface ProjectedNode {
        node: Node3D;
        px: number;
        py: number;
        pz: number;
        scale: number;
        alpha: number;
      }

      const projected: ProjectedNode[] = [];

      for (const n of nodes) {
        // Rotate Y
        const x1 = n.x * cosY + n.z * sinY;
        const z1 = -n.x * sinY + n.z * cosY;

        // Rotate X
        const y2 = n.y * cosX - z1 * sinX;
        const z2 = n.y * sinX + z1 * cosX;

        const pz = z2 + CAMERA_DISTANCE;
        if (pz <= 20) continue; // Behind camera

        const scale = FOCAL_LENGTH / pz;
        const px = width / 2 + x1 * scale;
        const py = height / 2 + y2 * scale;

        // Depth fogging
        const depthRatio = Math.max(0, Math.min(1, (pz - 150) / 700));
        const alpha = isDark
          ? (1 - depthRatio * 0.75) * 0.85
          : (1 - depthRatio * 0.75) * 0.55;

        projected.push({
          node: n,
          px,
          py,
          pz,
          scale,
          alpha,
        });
      }

      // Sort by depth (far to near)
      projected.sort((a, b) => b.pz - a.pz);

      // 1. Draw connecting 3D proximity lines
      for (let i = 0; i < projected.length; i++) {
        const a = projected[i]!;
        for (let j = i + 1; j < projected.length; j++) {
          const b = projected[j]!;

          // 3D Euclidean distance between original points
          const dx = a.node.x - b.node.x;
          const dy = a.node.y - b.node.y;
          const dz = a.node.z - b.node.z;
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist3D < MAX_CONNECT_DIST_3D) {
            const proximity = 1 - dist3D / MAX_CONNECT_DIST_3D;
            const lineAlpha = proximity * Math.min(a.alpha, b.alpha) * (isDark ? 0.35 : 0.2);

            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${lineAlpha})`
              : `rgba(2, 132, 199, ${lineAlpha * 0.75})`;
            ctx.lineWidth = Math.max(0.4, (a.scale + b.scale) * 0.5 * 1.1);
            ctx.stroke();
          }
        }
      }

      // 2. Draw 3D nodes & labels
      for (const p of projected) {
        const r = Math.max(1, p.node.radius * p.scale);

        // Glow ring for centroid nodes
        if (p.node.isClusterCenter) {
          ctx.beginPath();
          ctx.arc(p.px, p.py, r * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = p.node.glowColor;
          ctx.globalAlpha = p.alpha * (isDark ? 0.5 : 0.3);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fillStyle = p.node.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Node specular highlight
        ctx.beginPath();
        ctx.arc(p.px - r * 0.3, p.py - r * 0.3, Math.max(0.5, r * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = p.alpha * 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Centroid tag / label in 3D
        if (p.node.tag && p.scale > 0.7) {
          const fontSize = Math.max(9, Math.min(12, 11 * p.scale));
          ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, monospace`;
          ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B';
          ctx.globalAlpha = Math.min(1, p.alpha * 1.2);
          ctx.fillText(p.node.tag, p.px + r + 6, p.py + 3);

          // Faint 3D coordinate subtitle
          if (p.scale > 0.95 && isDark) {
            ctx.font = `400 ${fontSize * 0.8}px ui-monospace, monospace`;
            ctx.fillStyle = '#38BDF8';
            ctx.globalAlpha = p.alpha * 0.7;
            ctx.fillText(
              `[${(p.node.x / 100).toFixed(1)}, ${(p.node.y / 100).toFixed(1)}, ${(p.node.z / 100).toFixed(1)}]`,
              p.px + r + 6,
              p.py + fontSize + 4
            );
          }
          ctx.globalAlpha = 1;
        }
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      id="embedding-canvas"
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85,
        transition: 'opacity 0.4s ease',
      }}
    />
  );
}
