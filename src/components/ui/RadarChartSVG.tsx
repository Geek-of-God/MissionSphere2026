import React from 'react';

interface RadarChartProps {
  metrics: {
    science: number;
    budgetEfficiency: number;
    massEfficiency: number;
    powerMargin: number;
    reliability: number;
  };
  baseline?: {
    science: number;
    budgetEfficiency: number;
    massEfficiency: number;
    powerMargin: number;
    reliability: number;
  };
  size?: number;
}

const AXES = [
  { key: 'science', label: 'SCIENCE' },
  { key: 'budgetEfficiency', label: 'BUDGET' },
  { key: 'massEfficiency', label: 'MASSE' },
  { key: 'powerMargin', label: 'ÉNERGIE' },
  { key: 'reliability', label: 'FIABILITÉ' },
] as const;

export const RadarChartSVG: React.FC<RadarChartProps> = ({
  metrics,
  baseline = { science: 70, budgetEfficiency: 60, massEfficiency: 60, powerMargin: 60, reliability: 70 },
  size = 196,
}) => {
  const cx = size / 2;
  const cy = size / 2 + 4;
  const maxR = size * 0.34;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getPoint = (idx: number, val: number) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / AXES.length;
    const r = (Math.max(0, Math.min(100, val)) / 100) * maxR;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  const toPolygonPoints = (vals: Record<string, number>) =>
    AXES.map((a, i) => {
      const p = getPoint(i, vals[a.key] ?? 50);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto overflow-visible">
      {/* Concentric pentagon grid */}
      {levels.map((lvl) => (
        <polygon
          key={lvl}
          points={AXES.map((_, i) => {
            const p = getPoint(i, lvl * 100);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(79, 195, 247, 0.16)"
          strokeWidth={1}
        />
      ))}

      {/* Axis spokes */}
      {AXES.map((axis, i) => {
        const end = getPoint(i, 100);
        const labelPos = getPoint(i, 124);
        return (
          <g key={axis.key}>
            <line
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="rgba(79, 195, 247, 0.18)"
              strokeWidth={1}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94A3B8"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fontWeight={600}
            >
              {axis.label}
            </text>
          </g>
        );
      })}

      {/* Baseline requirement polygon (dashed white) */}
      <polygon
        points={toPolygonPoints(baseline)}
        fill="rgba(255, 255, 255, 0.04)"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth={1.25}
        strokeDasharray="3 3"
      />

      {/* Option polygon (#4FC3F7) */}
      <polygon
        points={toPolygonPoints(metrics)}
        fill="rgba(79, 195, 247, 0.24)"
        stroke="#4FC3F7"
        strokeWidth={2}
      />

      {/* Vertex dots */}
      {AXES.map((axis, i) => {
        const p = getPoint(i, metrics[axis.key]);
        return <circle key={axis.key} cx={p.x} cy={p.y} r={3} fill="#4FC3F7" />;
      })}
    </svg>
  );
};
