import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { getDataSourcesForPhase } from '../../../shared/constants/dataSources';
import { useMissionStore } from '../../store/useMissionStore';

interface DataSourceStripProps {
  phase: number;
}

export const DataSourceStrip: React.FC<DataSourceStripProps> = ({ phase }) => {
  const language = useMissionStore((s) => s.language);
  const sources = getDataSourcesForPhase(phase);

  if (sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-[#4FC3F7]/15 flex flex-wrap items-center justify-between gap-2 text-[11px]">
      <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider shrink-0">
        <BookOpen className="w-3.5 h-3.5 text-[#4FC3F7]" />
        <span>
          {language === 'FR'
            ? `Sources & Données NASA (Phase ${phase}) :`
            : `NASA Data Sources (Phase ${phase}):`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sources.map((src) => (
          <a
            key={src.id}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            title={language === 'FR' ? src.descriptionFr : src.descriptionEn}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#4FC3F7]/30 bg-[#0B162C]/90 hover:border-[#4FC3F7] hover:bg-[#0B3D91]/50 text-[#4FC3F7] hover:text-white transition-colors"
          >
            <span className="font-semibold">{src.label}</span>
            <span className="text-[10px] text-slate-400">({src.organization})</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};
