import React from 'react';
import { StatusLevel } from '../../../shared/types/mission.types';

interface SegmentedBarProps {
  ratio: number; // 0 to 1
  status: StatusLevel;
  segments?: number;
}

export const SegmentedBar: React.FC<SegmentedBarProps> = ({
  ratio,
  status,
  segments = 10,
}) => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filledCount = Math.round(clamped * segments);

  const activeColor =
    status === 'CRITICAL'
      ? 'bg-red-500'
      : status === 'WARNING'
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  return (
    <div className="flex items-center gap-[2px] w-full mt-1" aria-hidden="true">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-[1px] transition-colors duration-150 ${
            i < filledCount ? activeColor : 'bg-slate-800/90'
          }`}
        />
      ))}
    </div>
  );
};
