import React, { useEffect, useRef, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import {
  getBudgetStatus,
  getDataStatus,
  getMassStatus,
  getPowerStatus,
  getRiskStatus,
  getStatusStyles,
} from '../../utils/statusColors';
import { SegmentedBar } from '../ui/SegmentedBar';
import { ResourceTelemetry, StatusLevel } from '../../../shared/types/mission.types';

export const TelemetryRibbon: React.FC = () => {
  const telemetry = useMissionStore((s) => s.mission?.telemetry);
  const design = useMissionStore((s) => s.mission?.design);
  const sendChat = useMissionStore((s) => s.sendChat);
  const prevRef = useRef<ResourceTelemetry | null>(null);
  const [trends, setTrends] = useState<Record<string, 'UP' | 'DOWN' | null>>({});

  useEffect(() => {
    if (!telemetry) return;
    const prev = prevRef.current;
    if (prev) {
      setTrends({
        budget:
          telemetry.budgetUsed > prev.budgetUsed
            ? 'UP'
            : telemetry.budgetUsed < prev.budgetUsed
            ? 'DOWN'
            : null,
        mass:
          telemetry.massTotal > prev.massTotal
            ? 'UP'
            : telemetry.massTotal < prev.massTotal
            ? 'DOWN'
            : null,
        power:
          telemetry.powerBalance > prev.powerBalance
            ? 'UP'
            : telemetry.powerBalance < prev.powerBalance
            ? 'DOWN'
            : null,
        data:
          telemetry.dataGeneratedMbps > prev.dataGeneratedMbps
            ? 'UP'
            : telemetry.dataGeneratedMbps < prev.dataGeneratedMbps
            ? 'DOWN'
            : null,
        risk:
          telemetry.riskPercentage > prev.riskPercentage
            ? 'UP'
            : telemetry.riskPercentage < prev.riskPercentage
            ? 'DOWN'
            : null,
      });
    }
    prevRef.current = telemetry;
  }, [telemetry]);

  if (!telemetry || !design) return null;

  const budgetStatus = getBudgetStatus(telemetry.budgetUsed, telemetry.budgetMax);
  const massStatus = getMassStatus(telemetry.massTotal, telemetry.massMax);
  const powerStatus = getPowerStatus(telemetry.powerBalance);
  const dataStatus = getDataStatus(telemetry.dataGeneratedMbps, telemetry.dataCapacityMbps);
  const linkStatus: StatusLevel =
    telemetry.commQualityDb < 0 ? 'CRITICAL' : telemetry.commQualityDb < 8 ? 'WARNING' : 'NOMINAL';
  const durationStatus: StatusLevel =
    telemetry.missionDurationYears < design.requirements.targetDurationYears * 0.7
      ? 'WARNING'
      : 'NOMINAL';
  const riskStatus = getRiskStatus(
    telemetry.riskPercentage,
    design.requirements.maxRiskTolerance
  );

  const cards = [
    {
      id: 'budget',
      label: 'BUDGET',
      value: `$${telemetry.budgetUsed}M / $${telemetry.budgetMax}M`,
      ratio: telemetry.budgetMax > 0 ? telemetry.budgetUsed / telemetry.budgetMax : 0,
      status: budgetStatus,
      trend: trends.budget,
      pingText: `Mission Manager : Alerte Budget ($${telemetry.budgetUsed}M / $${telemetry.budgetMax}M)`,
    },
    {
      id: 'mass',
      label: 'MASSE',
      value: `${telemetry.massTotal} / ${telemetry.massMax || '---'} kg`,
      ratio: telemetry.massMax > 0 ? telemetry.massTotal / telemetry.massMax : 0.4,
      status: massStatus,
      trend: trends.mass,
      pingText: `Systems Engineer : Ping Masse (${telemetry.massTotal} / ${telemetry.massMax || '---'} kg)`,
    },
    {
      id: 'power',
      label: 'PUISSANCE',
      value: `${telemetry.powerBalance >= 0 ? '+' : ''}${telemetry.powerBalance} W`,
      ratio:
        telemetry.powerGenerated > 0
          ? Math.max(0, Math.min(1, telemetry.powerBalance / telemetry.powerGenerated + 0.3))
          : 0,
      status: powerStatus,
      trend: trends.power,
      pingText: `Systems Engineer : Alerte Puissance (${telemetry.powerBalance}W)`,
    },
    {
      id: 'data',
      label: 'DATA RATE',
      value: `${telemetry.dataGeneratedMbps} / ${telemetry.dataCapacityMbps} Mbps`,
      ratio:
        telemetry.dataCapacityMbps > 0
          ? telemetry.dataGeneratedMbps / telemetry.dataCapacityMbps
          : telemetry.dataGeneratedMbps > 0
          ? 1
          : 0,
      status: dataStatus,
      trend: trends.data,
      pingText: `Operations Lead : Saturation Data (${telemetry.dataGeneratedMbps}/${telemetry.dataCapacityMbps} Mbps)`,
    },
    {
      id: 'link',
      label: 'LIAISON DSN',
      value: `${telemetry.commQualityDb >= 0 ? '+' : ''}${telemetry.commQualityDb} dB`,
      ratio: Math.max(0.1, Math.min(1, (telemetry.commQualityDb + 15) / 40)),
      status: linkStatus,
      trend: null,
      pingText: `Operations Lead : Vérifier bilan de liaison (${telemetry.commQualityDb} dB)`,
    },
    {
      id: 'duration',
      label: 'DURÉE VIE',
      value: `${telemetry.missionDurationYears} Ans`,
      ratio: Math.min(1, telemetry.missionDurationYears / 10),
      status: durationStatus,
      trend: null,
      pingText: `Systems Engineer : Durée estimée ${telemetry.missionDurationYears} ans`,
    },
    {
      id: 'risk',
      label: 'RISQUE',
      value: `${telemetry.riskPercentage}%`,
      ratio: telemetry.riskPercentage / 100,
      status: riskStatus,
      trend: trends.risk,
      pingText: `Équipe : Indice de risque à ${telemetry.riskPercentage}% (seuil ${design.requirements.maxRiskTolerance}%)`,
    },
  ];

  return (
    <section
      aria-label="Télémétrie vitale de la mission"
      className="min-h-[64px] lg:h-[64px] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 px-3 py-1.5 bg-[#050A17] border-b border-[#4FC3F7]/20 shrink-0 items-center"
    >
      {cards.map((c) => {
        const st = getStatusStyles(c.status);
        return (
          <button
            key={c.id}
            type="button"
            title="Cliquer pour envoyer un Ping d'alerte sur cette jauge"
            onClick={() => sendChat(c.pingText, true)}
            className={`group text-left px-2.5 py-1.5 rounded border transition-all cursor-pointer hover:brightness-110 ${st.border} ${st.bg}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400">
                {c.label}
              </span>
              <span className="flex items-center gap-1">
                {c.trend === 'UP' && <span className="text-[9px] text-amber-300">▲</span>}
                {c.trend === 'DOWN' && <span className="text-[9px] text-cyan-300">▼</span>}
                <BellRing className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
            <div className={`telemetry-value text-xs xl:text-sm font-bold truncate mt-0.5 ${st.text}`}>
              {c.value}
            </div>
            <SegmentedBar ratio={c.ratio} status={c.status} />
          </button>
        );
      })}
    </section>
  );
};
