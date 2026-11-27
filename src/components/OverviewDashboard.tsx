import React, { useState } from 'react';
import { ArrowRight, FlaskConical, BookOpen, CheckCircle2, FileDown } from 'lucide-react';
import { CPAC_CRITERIA, PRACTICAL_ORDER, PRACTICALS } from '../data/practicalsData';
import { computePracticalStats } from '../hooks/useWorkbookStore';
import { PracticalId, WorkbookState, WorkspaceTab } from '../types/workbook';

interface OverviewDashboardProps {
  state: WorkbookState;
  overallPercent: number;
  completedLabsCount: number;
  achievedCpacCount: number;
  onSelectPractical: (id: PracticalId, initialTab?: WorkspaceTab) => void;
  onOpenSaveModal: () => void;
  onOpenCpac: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  state,
  overallPercent,
  completedLabsCount,
  achievedCpacCount,
  onSelectPractical,
  onOpenSaveModal,
  onOpenCpac,
}) => {
  const [filter, setFilter] = useState<'all' | 'core' | 'optional' | 'incomplete'>('all');

  const filteredIds = PRACTICAL_ORDER.filter((id) => {
    const def = PRACTICALS[id];
    const stats = computePracticalStats(state, id);
    if (filter === 'core') return def.category === 'Core Practical';
    if (filter === 'optional') return def.category === 'Optional Practical';
    if (filter === 'incomplete') return stats.percent < 100;
    return true;
  });

  const lastSavedDisplay = state.lastSavedAt
    ? new Date(state.lastSavedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Auto-saving locally';

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero / Workbook Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="text-xs font-medium text-slate-500 flex flex-wrap items-center gap-2">
            <span>AQA A-Level Chemistry (Year 2 / A2)</span>
            <span aria-hidden="true">·</span>
            <span>The Cotswold School Laboratory Manual</span>
            <span aria-hidden="true">·</span>
            <span>{state.studentName ? `${state.studentName}${state.classGroup ? ` (${state.classGroup})` : ''}` : 'Student profile unset'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            Electronic Laboratory Workbook &amp; Virtual Practical Suite
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Simulate all Year 2 required and optional practicals interactively, record primary readings, construct kinetics and titration graphs, check answers against official AQA markschemes, and track your CPAC competencies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSelectPractical('7a', 'lab')}
            className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <FlaskConical className="w-4 h-4" />
            Launch Virtual Lab
          </button>
          <button
            type="button"
            onClick={onOpenSaveModal}
            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            Export / Load Save
          </button>
        </div>
      </section>

      {/* 4-Column Quantitative Progress Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Overall Workbook Progress</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">{overallPercent}%</span>
            <span className="text-xs text-slate-500">across 8 practicals</span>
          </div>
          <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-700 transition-all duration-300"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Virtual Labs Completed</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
              {completedLabsCount} / {PRACTICAL_ORDER.length}
            </span>
            <span className="text-xs text-slate-500">simulations</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Data logged automatically into your results tables.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCpac}
          className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-blue-400 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500">CPAC Practical Mastery</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
              {achievedCpacCount} / {CPAC_CRITERIA.length}
            </span>
            <span className="text-xs text-blue-700 font-medium">Review matrix →</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Competencies 1a through 5b from manual pages 2–3.
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenSaveModal}
          className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-blue-400 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500">Save Status</div>
          <div className="mt-2 text-lg font-semibold text-slate-900 truncate">
            {lastSavedDisplay}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Click to edit student details or download a JSON backup.
          </p>
        </button>
      </section>

      {/* Practicals Catalogue */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">A2 Practicals Index</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any practical to open its interactive lab simulation, results tables, workbook questions, and AQA exam practice.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {[
              { id: 'all' as const, label: 'All (8)' },
              { id: 'core' as const, label: 'Core (7)' },
              { id: 'optional' as const, label: 'Optional (1)' },
              { id: 'incomplete' as const, label: 'In Progress' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIds.map((id) => {
            const p = PRACTICALS[id];
            const stats = computePracticalStats(state, id);

            return (
              <article
                key={id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  {/* Quiet unboxed metadata line */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-semibold text-blue-700">{p.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{p.pages}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">CPAC {p.cpacTags.join(', ')}</span>
                    </div>
                    <span className="font-mono font-semibold tabular-nums text-slate-800 shrink-0">
                      {stats.percent}%
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.summary}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Slim progress bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        stats.percent === 100 ? 'bg-emerald-600' : 'bg-blue-700'
                      }`}
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>

                  {/* Clean inline completion metrics */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                      <span className={stats.labDone ? 'text-emerald-700 font-medium flex items-center gap-1' : ''}>
                        {stats.labDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        Lab {stats.labDone ? 'Done' : 'Pending'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Qs {stats.questionsAnswered}/{stats.questionsTotal}
                      </span>
                      {stats.examTotal > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            Exam {stats.examAnswered}/{stats.examTotal}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectPractical(id, 'questions')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Workbook
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPractical(id, 'lab')}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        Open Lab
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};
