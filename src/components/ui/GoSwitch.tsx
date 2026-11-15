import React from 'react';

interface GoSwitchProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'emerald';
  className?: string;
}

export const GoSwitch: React.FC<GoSwitchProps> = ({
  label,
  onClick,
  disabled = false,
  icon,
  variant = 'primary',
  className = '',
}) => {
  const palette =
    variant === 'danger'
      ? 'border-red-500/70 text-red-200 bg-red-950/50 hover:bg-red-600 hover:text-white'
      : variant === 'emerald'
      ? 'border-emerald-400/70 text-emerald-100 bg-emerald-950/60 hover:bg-emerald-600 hover:text-white'
      : 'border-[#4FC3F7]/70 text-white bg-[#0B3D91]/80 hover:bg-[#1455C0]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded border-2 font-display text-xs font-bold tracking-wider uppercase whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${palette} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
};
