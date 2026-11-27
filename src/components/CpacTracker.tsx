import React from 'react';
import { CheckSquare, Square, ArrowUpRight } from 'lucide-react';
import { CPAC_CRITERIA, PRACTICALS } from '../data/practicalsData';
import { PracticalId, WorkbookState } from '../types/workbook';

interface CpacTrackerProps {
  state: WorkbookState;
  onUpdateCpac: (code: string, patch: Partial<{ achieved: boolean; evidenceNote: string }>) => void;
  onSelectPractical: (id: PracticalId) => void;
}

export const CpacTracker: React.FC<CpacTrackerProps> = ({
  state,
  onUpdateCpac,
  onSelectPractical,
}) => {
  const achievedCount = Object.values(state.cpacRecords).filter((c) => c.achieved).length;

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">
            AQA Common Practical Assessment Criteria · Manual Pages 2–3
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            CPAC Practical Mastery Tracker
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Track your evidence for each of the 11 AQA practical competencies across Year 2 practicals. Check off mastered criteria and record specific practical evidence notes for teacher review.
          </p>
        </div>
        <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-right">
          <div className="text-xs text-slate-500">Competencies Met</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-blue-700">
            {achievedCount} / {CPAC_CRITERIA.length}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-24">Code</th>
                <th className="py-3 px-4">Competency Descriptor &amp; AQA Assessment Guidance</th>
                <th className="py-3 px-4 w-48">Linked Practicals</th>
                <th className="py-3 px-4 w-80">Student Evidence Notes</th>
                <th className="py-3 px-4 w-28 text-center">Achieved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {CPAC_CRITERIA.map((item) => {
                const record = state.cpacRecords[item.code];
                const achieved = record?.achieved || false;
                return (
                  <tr key={item.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="font-mono font-bold text-slate-900">CPAC {item.code}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Group {item.groupNumber}</div>
                    </td>
                    <td className="py-4 px-4 align-top space-y-1.5">
                      <div className="text-xs font-semibold text-slate-500">{item.groupTitle}</div>
                      <div className="text-sm text-slate-900 leading-snug">{item.descriptor}</div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        Assessment focus: {item.teacherGuidance}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {(record?.linkedPracticals || []).map((pid) => (
                          <button
                            key={pid}
                            type="button"
                            onClick={() => onSelectPractical(pid)}
                            className="inline-flex items-center gap-0.5 text-xs font-mono text-blue-700 hover:underline mr-2"
                          >
                            {PRACTICALS[pid].id}
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <textarea
                        rows={2}
                        value={record?.evidenceNote || ''}
                        onChange={(e) => onUpdateCpac(item.code, { evidenceNote: e.target.value })}
                        placeholder="Log date, practical & evidence..."
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </td>
                    <td className="py-4 px-4 align-top text-center">
                      <button
                        type="button"
                        onClick={() => onUpdateCpac(item.code, { achieved: !achieved })}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          achieved
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {achieved ? (
                          <>
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                            Met
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-slate-400" />
                            Mark
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};
