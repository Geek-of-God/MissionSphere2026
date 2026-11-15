import { StatusLevel } from '../../shared/types/mission.types';

export function getStatusStyles(status: StatusLevel) {
  switch (status) {
    case 'CRITICAL':
      return {
        border: 'border-red-500/80',
        bg: 'bg-red-500/12',
        text: 'text-red-400',
        badge: 'bg-red-500/20 text-red-300 border-red-500/50',
        barColor: '#EF4444',
        label: 'CRITICAL',
      };
    case 'WARNING':
      return {
        border: 'border-amber-500/75',
        bg: 'bg-amber-500/12',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        barColor: '#F59E0B',
        label: 'WARNING',
      };
    default:
      return {
        border: 'border-emerald-500/45',
        bg: 'bg-emerald-500/8',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        barColor: '#10B981',
        label: 'NOMINAL',
      };
  }
}

export function getBudgetStatus(used: number, max: number): StatusLevel {
  if (used > max) return 'CRITICAL';
  const marginPct = max > 0 ? ((max - used) / max) * 100 : 100;
  if (marginPct <= 15) return 'WARNING';
  return 'NOMINAL';
}

export function getMassStatus(total: number, max: number): StatusLevel {
  if (max <= 0) return 'NOMINAL';
  if (total > max) return 'CRITICAL';
  const marginPct = ((max - total) / max) * 100;
  if (marginPct <= 15) return 'WARNING';
  return 'NOMINAL';
}

export function getPowerStatus(balance: number): StatusLevel {
  if (balance < 0) return 'CRITICAL';
  if (balance < 45) return 'WARNING';
  return 'NOMINAL';
}

export function getDataStatus(generated: number, capacity: number): StatusLevel {
  if (generated === 0) return 'NOMINAL';
  if (capacity === 0 || generated > capacity) return 'CRITICAL';
  if (generated > capacity * 0.85) return 'WARNING';
  return 'NOMINAL';
}

export function getRiskStatus(riskPct: number, tolerancePct: number): StatusLevel {
  if (riskPct > tolerancePct + 10 || riskPct > 45) return 'CRITICAL';
  if (riskPct > tolerancePct) return 'WARNING';
  return 'NOMINAL';
}
