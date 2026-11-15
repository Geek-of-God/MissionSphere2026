import React from 'react';
import { StatusLevel } from '../../../shared/types/mission.types';

interface FeasibilityGaugeProps {
  scorePct: number;
  status: StatusLevel;
}

export const FeasibilityGauge: React.FC<FeasibilityGaugeProps> = ({ scorePct, status }) => {
  const clamped = Math.max(0, Math.min(100, scorePct));
  const angleDeg = -90 + (clamped / 100) * 180;
  const cx = 110;
  const cy = 100;
  const r = 76;

  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const needleX = cx + Math.cos(rad) * (r - 10);
  const needleY = cy + Math.sin(rad) * (r - 10);

  const color =
    status === 'CRITICAL' ? '#EF4444' : status === 'WARNING' ? '#F59E0B' : '#10B981';

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="120" viewBox="0 0 220 120">
        {/* Background zones */}
        <path
          d="M 34 100 A 76 76 0 0 1 78 31"
          fill="none"
          stroke="rgba(239, 68, 68, 0.45)"
          strokeWidth="12"
          strokeLinecap="butt"
        />
        <path
          d="M 80 30 A 76 76 0 0 1 140 30"
          fill="none"
          stroke="rgba(245, 158, 11, 0.45)"
          strokeWidth="12"
          strokeLinecap="butt"
        />
        <path
          d="M 142 31 A 76 76 0 0 1 186 100"
          fill="none"
          stroke="rgba(16, 185, 129, 0.55)"
          strokeWidth="12"
          strokeLinecap="butt"
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />

        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="20"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
        >
          {clamped}%
        </text>
      </svg>
    </div>
  );
};
