'use client';

import { useRef, useEffect, useState } from 'react';
import { profile } from '@/lib/profile/data';

interface SkillNode {
  x: number;
  y: number;
  label: string;
  category: string;
  r: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Programming Languages': '#38BDF8',
  'Machine Learning': '#818CF8',
  'Generative AI / LLMs': '#A78BFA',
  'Data Analysis & Visualization': '#34D399',
  'Web Scraping & Data Collection': '#FBBF24',
  'Databases': '#F472B6',
  'Tools': '#94A3B8',
  'Soft Skills': '#64748B',
};

/**
 * SKILL GRAPH VISUALIZATION
 * --------------------------
 * SVG-based network graph in the Skills section. Each skill category is a
 * cluster with individual skill nodes. Gentle float animation via CSS.
 * Reduced-motion: renders as a plain labelled grid.
 */
export function SkillGraph() {
  const [reduced, setReduced] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Build node layout — place categories around a circle, skills around each
  const W = 700;
  const H = 520;
  const cx = W / 2;
  const cy = H / 2;
  const catRadius = 170;
  const skillRadius = 52;

  const categories = profile.skills;
  const nodes: SkillNode[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

  categories.forEach((cat, ci) => {
    const angle = (ci / categories.length) * Math.PI * 2 - Math.PI / 2;
    const catX = cx + Math.cos(angle) * catRadius;
    const catY = cy + Math.sin(angle) * catRadius;
    const color = CATEGORY_COLORS[cat.category] ?? '#94A3B8';

    // Category node
    nodes.push({ x: catX, y: catY, label: cat.category, category: cat.category, r: 10, color });

    // Edge from center to category
    edges.push({ x1: cx, y1: cy, x2: catX, y2: catY, color });

    // Skill nodes around category
    cat.items.slice(0, 4).forEach((item, si) => {
      const a = angle + (si - (Math.min(cat.items.length, 4) - 1) / 2) * 0.55;
      const sx = catX + Math.cos(a) * skillRadius;
      const sy = catY + Math.sin(a) * skillRadius;
      nodes.push({ x: sx, y: sy, label: item, category: cat.category, r: 5, color });
      edges.push({ x1: catX, y1: catY, x2: sx, y2: sy, color: color + '55' });
    });
  });

  if (reduced) {
    // Plain grid fallback
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {profile.skills.map((group) => {
          const color = CATEGORY_COLORS[group.category] ?? '#94A3B8';
          return (
            <div
              key={group.category}
              className="glass-card p-4"
              style={{ borderColor: color + '30' }}
            >
              <p className="text-xs font-medium mb-2" style={{ color }}>
                {group.category}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: color + '15', color }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: '520px' }}
        aria-label="Skill graph visualization showing technical skills as a network"
        role="img"
      >
        {/* Edges */}
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.color}
            strokeWidth="0.8"
            strokeOpacity="0.35"
          />
        ))}

        {/* Central hub */}
        <circle cx={cx} cy={cy} r={18} fill="rgba(56,189,248,0.1)" stroke="var(--color-neon)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={8} fill="var(--color-neon)" fillOpacity="0.7" />
        <text x={cx} y={cy + 32} textAnchor="middle" fill="var(--color-moon)" fontSize="11" fontFamily="var(--font-mono)">
          Skills
        </text>

        {/* Nodes */}
        {nodes.map((node, i) => {
          const isCat = node.r > 7;
          const isHovered = hovered === node.label;
          return (
            <g
              key={i}
              className={isCat ? 'skill-node' : ''}
              style={{ animationDelay: `${i * 0.2}s` }}
              onMouseEnter={() => setHovered(node.label)}
              onMouseLeave={() => setHovered(null)}
              role="img"
              aria-label={node.label}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? node.r + 3 : node.r}
                fill={node.color + (isCat ? '25' : '15')}
                stroke={node.color}
                strokeWidth={isCat ? '1.5' : '1'}
                style={{ transition: 'r 0.2s ease' }}
              />
              <text
                x={node.x}
                y={node.y + node.r + (isCat ? 14 : 12)}
                textAnchor="middle"
                fill={isHovered ? 'var(--color-starlight)' : node.color}
                fontSize={isCat ? 9 : 7.5}
                fontFamily="var(--font-mono)"
                style={{ transition: 'fill 0.2s ease', pointerEvents: 'none' }}
              >
                {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
