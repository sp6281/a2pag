import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  AlertTriangle,
  FlaskConical,
  ClipboardList,
  Table2,
  HelpCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { PRACTICAL_ORDER, PRACTICALS } from '../data/practicalsData';
import { computePracticalStats } from '../hooks/useWorkbookStore';
import {
  PracticalId,
  PracticalProgressState,
  WorkbookState,
  WorkspaceTab,
} from '../types/workbook';
import { Lab7aIodineClock } from './labs/Lab7aIodineClock';
import { Lab7bGasSyringe } from './labs/Lab7bGasSyringe';
import { Lab8ElectrochemicalCell } from './labs/Lab8ElectrochemicalCell';
import { Lab9Titration } from './labs/Lab9Titration';
import { Lab10Aspirin } from './labs/Lab10Aspirin';
import { Lab11TransitionMetals } from './labs/Lab11TransitionMetals';
import { Lab12bDipeptide } from './labs/Lab12bDipeptide';
import { Lab12cMedicinesTLC } from './labs/Lab12cMedicinesTLC';
import { ExamGraphs } from './charts/ExamGraphs';

interface PracticalWorkspaceProps {
  practicalId: PracticalId;
  activeTab: WorkspaceTab;
  state: WorkbookState;
  onSelectPractical: (id: PracticalId) => void;
  onChangeTab: (tab: WorkspaceTab) => void;
  onUpdatePractical: (
    id: PracticalId,
    updater: (current: PracticalProgressState) => PracticalProgressState
  ) => void;
  onUpdateLabData: <K extends keyof WorkbookState['labData']>(
    key: K,
    updater: (current: WorkbookState['labData'][K]) => WorkbookState['labData'][K]
  ) => void;
}

export const PracticalWorkspace: React.FC<PracticalWorkspaceProps> = ({
  practicalId,
  activeTab,
  state,
  onSelectPractical,
  onChangeTab,
  onUpdatePractical,
  onUpdateLabData,
}) => {
  const [revealedGuidance, setRevealedGuidance] = useState<Record<string, boolean>>({});
  const [revealedMarkschemes, setRevealedMarkschemes] = useState<Record<string, boolean>>({});

  const def = PRACTICALS[practicalId];
  const progress = state.practicals[practicalId];
  const stats = computePracticalStats(state, practicalId);
  const currentIdx = PRACTICAL_ORDER.indexOf(practicalId);

  const toggleMethodStep = (idx: number) => {
    onUpdatePractical(practicalId, (cur) => {
      const exists = cur.methodStepsChecked.includes(idx);
      return {
        ...cur,
        methodStepsChecked: exists
          ? cur.methodStepsChecked.filter((i) => i !== idx)
          : [...cur.methodStepsChecked, idx],
      };
    });
  };

  const setAnswer = (qId: string, val: string) => {
    onUpdatePractical(practicalId, (cur) => ({
      ...cur,
      answers: { ...cur.answers, [qId]: val },
    }));
  };

  const setExamAnswer = (qId: string, val: string) => {
    onUpdatePractical(practicalId, (cur) => ({
      ...cur,
      examAnswers: { ...cur.examAnswers, [qId]: val },
    }));
  };

  const setSelfScore = (qId: string, score: number) => {
    onUpdatePractical(practicalId, (cur) => ({
      ...cur,
      selfMarkedScore: { ...cur.selfMarkedScore, [qId]: score },
    }));
  };

  const markLabComplete = () => {
    if (progress.labCompleted) return;
    onUpdatePractical(practicalId, (cur) => ({
      ...cur,
      labCompleted: true,
    }));
  };

  const tabs: { id: WorkspaceTab; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { id: 'lab', label: 'Virtual Lab', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'method', label: 'Method & Safety', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'results', label: 'Results & Tasks', icon: <Table2 className="w-4 h-4" /> },
    { id: 'questions', label: `Questions (${stats.questionsAnswered}/${stats.questionsTotal})`, icon: <HelpCircle className="w-4 h-4" /> },
    {
      id: 'exam',
      label: `Exam Practice (${stats.examAnswered}/${stats.examTotal})`,
      icon: <GraduationCap className="w-4 h-4" />,
      hidden: !def.examQuestions || def.examQuestions.length === 0,
    },
  ];

  const totalExamSelfScore = (def.examQuestions || []).reduce(
    (sum, q) => sum + (progress.selfMarkedScore[q.id] || 0),
    0
  );

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Compact Practical Selector Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-print">
        {PRACTICAL_ORDER.map((id) => {
          const item = PRACTICALS[id];
          const s = computePracticalStats(state, id);
          const isCurrent = id === practicalId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPractical(id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="font-mono font-semibold">{item.id}</span>
              <span className="hidden sm:inline">{item.shortTitle}</span>
              <span className={`font-mono text-[10.5px] ${isCurrent ? 'text-blue-300' : 'text-slate-400'}`}>
                {s.percent}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Practical Header Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-blue-700">{def.code}</span>
              <span aria-hidden="true">·</span>
              <span>{def.lessonReference}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">CPAC {def.cpacTags.join(', ')}</span>
              <span aria-hidden="true">·</span>
              <span>{def.pages}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {def.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-500">Practical Completion</div>
              <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
                {stats.percent}%
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdatePractical(practicalId, (cur) => ({
                  ...cur,
                  labCompleted: !cur.labCompleted,
                }))
              }
              className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                progress.labCompleted
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {progress.labCompleted ? 'Lab Completed' : 'Mark Lab Done'}
            </button>
          </div>
        </div>

        {/* Workspace Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto no-print">
          {tabs
            .filter((t) => !t.hidden)
            .map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
        </div>
      </section>

      {/* TAB 1: VIRTUAL LAB */}
      {activeTab === 'lab' && (
        <section>
          {practicalId === '7a' && (
            <Lab7aIodineClock
              runs={state.labData['7a'].runs}
              onRecordRun={(runIndex, timeSeconds) =>
                onUpdateLabData('7a', (cur) => ({
                  ...cur,
                  runs: cur.runs.map((r) =>
                    r.runIndex === runIndex ? { ...r, timeSeconds } : r
                  ),
                }))
              }
              onMarkLabComplete={markLabComplete}
            />
          )}

          {practicalId === '7b' && (
            <Lab7bGasSyringe
              readings={state.labData['7b'].readings}
              vFinal={state.labData['7b'].vFinal}
              onSaveReadings={(readings, vFinal) =>
                onUpdateLabData('7b', (cur) => ({
                  ...cur,
                  readings,
                  vFinal,
                }))
              }
              onMarkLabComplete={markLabComplete}
            />
          )}

          {practicalId === '8' && (
            <Lab8ElectrochemicalCell
              readings={state.labData['8'].readings}
              onRecordEmf={(solution, emf) =>
                onUpdateLabData('8', (cur) => ({
                  ...cur,
                  readings: cur.readings.map((r) =>
                    r.solution === solution ? { ...r, emf } : r
                  ),
                }))
              }
              onMarkLabComplete={markLabComplete}
            />
          )}

          {practicalId === '9' && (
            <Lab9Titration
              titrations={state.labData['9'].titrations}
              onUpdateTitration={(comboId, record) =>
                onUpdateLabData('9', (cur) => ({
                  ...cur,
                  titrations: {
                    ...cur.titrations,
                    [comboId]: record,
                  },
                }))
              }
              onMarkLabComplete={markLabComplete}
            />
          )}

          {practicalId === '10' && (
            <Lab10Aspirin
              data={state.labData['10']}
              onUpdate={(patch) =>
                onUpdateLabData('10', (cur) => ({ ...cur, ...patch }))
              }
              onMarkLabComplete={markLabComplete}
            />
          )}

          {practicalId === '11' && (
            <Lab11TransitionMetals
              observations={state.labData['11'].observations}
              onRecordWell={(wellId, obs) =>
                onUpdateLabData('11', (cur) => ({
                  ...cur,
                  observations: { ...cur.observations, [wellId]: obs },
                }))
              }
              onMarkLabComplete={markLabComplete}
            />
          )}

          {practicalId === '12b' && (
            <Lab12bDipeptide
              data={state.labData['12b']}
              onUpdate={(patch) =>
                onUpdateLabData('12b', (cur) => ({ ...cur, ...patch }))
              }
              onMarkLabComplete={markLabComplete}
            />
          )}

          {practicalId === '12c' && (
            <Lab12cMedicinesTLC
              data={state.labData['12c']}
              onUpdate={(patch) =>
                onUpdateLabData('12c', (cur) => ({ ...cur, ...patch }))
              }
              onMarkLabComplete={markLabComplete}
            />
          )}
        </section>
      )}

      {/* TAB 2: METHOD & SAFETY */}
      {activeTab === 'method' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900">Chemical Background</h2>
              {def.background.map((para, i) => (
                <p key={i} className="text-sm text-slate-700 leading-relaxed">
                  {para}
                </p>
              ))}
              {def.equations && def.equations.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5 mt-2">
                  <div className="text-xs font-semibold text-slate-500">Key Equations</div>
                  {def.equations.map((eq, i) => (
                    <div key={i} className="text-xs sm:text-sm font-mono text-slate-900">
                      {eq}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Interactive Method Checklist
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  {progress.methodStepsChecked.length}/{def.method.length} steps checked
                </span>
              </div>
              <div className="space-y-2">
                {def.method.map((step, i) => {
                  const checked = progress.methodStepsChecked.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleMethodStep(i)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                        checked
                          ? 'bg-emerald-50/60 border-emerald-200 text-slate-700'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      )}
                      <span className={`text-sm leading-relaxed ${checked ? 'line-through text-slate-500' : ''}`}>
                        <strong className="font-mono text-xs mr-1.5">{i + 1}.</strong>
                        {step}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-amber-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Safety &amp; Hazard Controls (CLEAPSS)
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-amber-950 list-disc pl-5">
                {def.safety.map((s, i) => (
                  <li key={i} className="leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">Equipment &amp; Materials</h2>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 list-disc pl-5">
                {def.equipment.map((eq, i) => (
                  <li key={i}>{eq}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: RESULTS & PRACTICAL TASKS */}
      {activeTab === 'results' && (
        <section className="space-y-6">
          {/* 7a Results & CPAC 2c Variables Task */}
          {practicalId === '7a' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Results Table (CPAC 4a &amp; 5a)</h2>
                  <span className="text-xs font-mono text-slate-500">Edit manually or record from Virtual Lab</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono tabular-nums border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                        <th className="py-2 px-3 text-left">Vol A / cm³</th>
                        <th className="py-2 px-3 text-left">Vol B / cm³</th>
                        <th className="py-2 px-3 text-left">Vol Water / cm³</th>
                        <th className="py-2 px-3 text-right">Time t / s</th>
                        <th className="py-2 px-3 text-right">Rate (1/t) / s⁻¹</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {state.labData['7a'].runs.map((r) => (
                        <tr key={r.runIndex}>
                          <td className="py-2 px-3">{r.volA}</td>
                          <td className="py-2 px-3 font-semibold">{r.volB}</td>
                          <td className="py-2 px-3">{r.volWater}</td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.1"
                              value={r.timeSeconds ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                onUpdateLabData('7a', (cur) => ({
                                  ...cur,
                                  runs: cur.runs.map((row) =>
                                    row.runIndex === r.runIndex ? { ...row, timeSeconds: val } : row
                                  ),
                                }));
                              }}
                              placeholder="—"
                              className="w-20 text-right border border-slate-200 rounded px-2 py-1 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-blue-800">
                            {r.timeSeconds && r.timeSeconds > 0 ? (1 / r.timeSeconds).toFixed(4) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Control Variables Task</h2>
                  <span className="text-xs font-mono text-blue-700 font-semibold">CPAC 2c</span>
                </div>
                <p className="text-xs text-slate-600">
                  What variables need to be controlled in your investigation? How will you control them?
                </p>
                <textarea
                  rows={6}
                  value={state.labData['7a'].variablesTask}
                  onChange={(e) =>
                    onUpdateLabData('7a', (cur) => ({ ...cur, variablesTask: e.target.value }))
                  }
                  placeholder="e.g. Temperature (thermostatted room/water bath), total reaction volume (80 cm³ using distilled water), pH (buffer in Solution A), concentrations of KI, starch & S₂O₃²⁻ (fixed 40 cm³ Solution A)..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {/* 7b Order Graph Task (Pages 7-8) + Results Table + Evaluation */}
          {practicalId === '7b' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Concentration–Time Graph Order Deduction (Manual Pages 7–8)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Graph A: Zero Order straight line (0, 0.40) -> (500, 0) */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <svg viewBox="0 0 320 180" className="w-full h-auto">
                      <line x1="45" y1="15" x2="45" y2="145" stroke="#0F172A" strokeWidth="1.2" />
                      <line x1="45" y1="145" x2="300" y2="145" stroke="#0F172A" strokeWidth="1.2" />
                      <line x1="45" y1="28" x2="255" y2="145" stroke="#1D4ED8" strokeWidth="2.2" />
                      <text x="172" y="170" textAnchor="middle" className="text-[10px] fill-slate-600">Time / s (0 → 600)</text>
                      <text x="14" y="80" textAnchor="middle" transform="rotate(-90 14 80)" className="text-[10px] fill-slate-600">Conc A / mol dm⁻³</text>
                      <text x="38" y="31" textAnchor="end" className="text-[9px] fill-slate-500 font-mono">0.40</text>
                      <text x="255" y="158" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">500</text>
                    </svg>
                    <label className="block text-xs font-medium text-slate-700">
                      Graph A shows the order is... (and explain why)
                    </label>
                    <input
                      type="text"
                      value={state.labData['7b'].graphOrderA}
                      onChange={(e) =>
                        onUpdateLabData('7b', (cur) => ({ ...cur, graphOrderA: e.target.value }))
                      }
                      placeholder="e.g. Zero order (rA = k) — constant negative gradient..."
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Graph B: First Order exponential decay (half-life = 125 s: 0.4 -> 0.2 -> 0.1 -> 0.05) */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <svg viewBox="0 0 320 180" className="w-full h-auto">
                      <line x1="45" y1="15" x2="45" y2="145" stroke="#0F172A" strokeWidth="1.2" />
                      <line x1="45" y1="145" x2="300" y2="145" stroke="#0F172A" strokeWidth="1.2" />
                      <path d="M 45 28 Q 95 100 150 116 T 265 138" fill="none" stroke="#1D4ED8" strokeWidth="2.2" />
                      <circle cx="45" cy="28" r="3" fill="#1D4ED8" />
                      <circle cx="98" cy="86" r="3" fill="#1D4ED8" />
                      <circle cx="150" cy="116" r="3" fill="#1D4ED8" />
                      <circle cx="203" cy="130" r="3" fill="#1D4ED8" />
                      <text x="172" y="170" textAnchor="middle" className="text-[10px] fill-slate-600">Time / s (t½ = 125 s constant)</text>
                      <text x="14" y="80" textAnchor="middle" transform="rotate(-90 14 80)" className="text-[10px] fill-slate-600">Conc B / mol dm⁻³</text>
                      <text x="38" y="31" textAnchor="end" className="text-[9px] fill-slate-500 font-mono">0.40</text>
                      <text x="98" y="158" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">125</text>
                      <text x="150" y="158" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">250</text>
                    </svg>
                    <label className="block text-xs font-medium text-slate-700">
                      Graph B shows the order is... (and explain why)
                    </label>
                    <input
                      type="text"
                      value={state.labData['7b'].graphOrderB}
                      onChange={(e) =>
                        onUpdateLabData('7b', (cur) => ({ ...cur, graphOrderB: e.target.value }))
                      }
                      placeholder="e.g. First order (rA = k[B]) — constant half-life of 125 s..."
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h2 className="text-base font-semibold text-slate-900">Evaluation (Manual Page 10)</h2>
                <p className="text-xs text-slate-600">
                  What were the sources of error in this practical? Is there anything you could have done to mitigate the error?
                </p>
                <textarea
                  rows={4}
                  value={state.labData['7b'].evaluation}
                  onChange={(e) =>
                    onUpdateLabData('7b', (cur) => ({ ...cur, evaluation: e.target.value }))
                  }
                  placeholder="Discuss gas escaping before stopper insertion, CO₂ dissolving in aqueous acid, friction in gas syringe plunger, and mitigation strategies..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-3"
                />
              </div>
            </div>
          )}

          {/* 8 Electrochemical Cell Results Table */}
          {practicalId === '8' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Recorded Cell Potential (EMF) Table</h2>
                <span className="text-xs font-mono text-slate-500">Cu(s) | 0.1 M CuSO₄(aq) || Fe³⁺(aq), Fe²⁺(aq) | C(s)</span>
              </div>
              <table className="w-full text-xs font-mono tabular-nums border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3 text-left">Solution</th>
                    <th className="py-2.5 px-3 text-left">Ratio [Fe³⁺] : [Fe²⁺]</th>
                    <th className="py-2.5 px-3 text-right">Measured Cell Potential Ecell / V</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {state.labData['8'].readings.map((r) => (
                    <tr key={r.solution}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Solution {r.solution}</td>
                      <td className="py-2.5 px-3 text-slate-700">{r.ratioLabel}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-blue-800">
                        {r.emf !== null ? `+${r.emf.toFixed(3)} V` : 'Not recorded (run Virtual Lab)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 9 Titration Curves Summary */}
          {practicalId === '9' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">
                Recorded Titration End Points (Black ×) &amp; Equivalence Points (Red ×)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono tabular-nums border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                      <th className="py-2.5 px-3 text-left">Acid–Base System</th>
                      <th className="py-2.5 px-3 text-left">Indicator Used</th>
                      <th className="py-2.5 px-3 text-right">Data Points</th>
                      <th className="py-2.5 px-3 text-right">End Point (Black ×)</th>
                      <th className="py-2.5 px-3 text-right">Equivalence (Red ×)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.values(state.labData['9'].titrations).map((t) => (
                      <tr key={t.comboId}>
                        <td className="py-2.5 px-3 font-semibold uppercase">{t.comboId.replace('-', ' + ')}</td>
                        <td className="py-2.5 px-3 capitalize">{t.indicator.replace('-', ' ')}</td>
                        <td className="py-2.5 px-3 text-right">{t.points.length}</td>
                        <td className="py-2.5 px-3 text-right">
                          {t.endPointMark ? `${t.endPointMark.volume} cm³ (pH ${t.endPointMark.pH})` : 'Unmarked'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-red-700">
                          {t.equivalenceMark ? `${t.equivalenceMark.volume} cm³ (pH ${t.equivalenceMark.pH})` : 'Unmarked'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10 Aspirin Yield & Purity Results */}
          {practicalId === '10' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">
                Aspirin Synthesis Yield, TLC &amp; Melting Point Record
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-slate-500 font-sans font-semibold">Masses &amp; Yields</div>
                  <div>Salicylic acid: <strong>{state.labData['10'].salicylicAcidMass?.toFixed(2) ?? '—'} g</strong></div>
                  <div>Crude aspirin: <strong>{state.labData['10'].crudeMass?.toFixed(2) ?? '—'} g</strong></div>
                  <div>Pure aspirin: <strong>{state.labData['10'].pureMass?.toFixed(2) ?? '—'} g</strong></div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-slate-500 font-sans font-semibold">TLC Rf Values</div>
                  <div>Salicylic acid: <strong>{state.labData['10'].rfSalicylic ?? '—'}</strong></div>
                  <div>Crude aspirin: <strong>{state.labData['10'].rfCrudeSpots.join(', ') || '—'}</strong></div>
                  <div>Purified aspirin: <strong>{state.labData['10'].rfPureAspirin ?? '—'}</strong></div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-slate-500 font-sans font-semibold">Melting Points (°C)</div>
                  <div>Salicylic acid (lit. 152): <strong>{state.labData['10'].mpSalicylic ?? '—'} °C</strong></div>
                  <div>Crude aspirin: <strong>{state.labData['10'].mpCrude ?? '—'} °C</strong></div>
                  <div>Purified aspirin (lit. 135): <strong>{state.labData['10'].mpPure ?? '—'} °C</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* 11 Transition Metal Observation Log */}
          {practicalId === '11' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Recorded Micro-Scale Observations Log</h2>
              {Object.values(state.labData['11'].observations).length === 0 ? (
                <p className="text-sm text-slate-500">
                  Run dropper tests on the laminated sheet in the Virtual Lab to automatically log observations here.
                </p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                      <th className="py-2 px-3 text-left">Ion</th>
                      <th className="py-2 px-3 text-left">Reagent / Condition</th>
                      <th className="py-2 px-3 text-left">Observation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.values(state.labData['11'].observations).map((o) => (
                      <tr key={o.wellId}>
                        <td className="py-2 px-3 font-mono font-semibold">{o.ion}</td>
                        <td className="py-2 px-3 font-mono">{o.reagent}</td>
                        <td className="py-2 px-3 text-slate-700">{o.studentObservation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* 12b Research Task (CPAC 5b) + Rf Table */}
          {practicalId === '12b' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Research Task: Aspartame Hydrolysis</h2>
                  <span className="text-xs font-mono font-semibold text-blue-700">CPAC 5b</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Functional groups present in aspartame (skeletal formula notes)
                    </label>
                    <textarea
                      rows={2}
                      value={state.labData['12b'].researchNotes.aspartameStructure}
                      onChange={(e) =>
                        onUpdateLabData('12b', (cur) => ({
                          ...cur,
                          researchNotes: { ...cur.researchNotes, aspartameStructure: e.target.value },
                        }))
                      }
                      placeholder="Primary amine (-NH2), carboxylic acid (-COOH), secondary amide/peptide link (-CONH-), methyl ester (-COOCH3), phenyl ring..."
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Hydrolysis products under acidic conditions (HCl reflux)
                    </label>
                    <textarea
                      rows={2}
                      value={state.labData['12b'].researchNotes.acidHydrolysis}
                      onChange={(e) =>
                        onUpdateLabData('12b', (cur) => ({
                          ...cur,
                          researchNotes: { ...cur.researchNotes, acidHydrolysis: e.target.value },
                        }))
                      }
                      placeholder="Protonated aspartic acid (-NH3+ & -COOH), protonated phenylalanine (-NH3+ & -COOH), and methanol (CH3OH)..."
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Hydrolysis products under alkaline conditions (NaOH reflux)
                    </label>
                    <textarea
                      rows={2}
                      value={state.labData['12b'].researchNotes.alkalineHydrolysis}
                      onChange={(e) =>
                        onUpdateLabData('12b', (cur) => ({
                          ...cur,
                          researchNotes: { ...cur.researchNotes, alkalineHydrolysis: e.target.value },
                        }))
                      }
                      placeholder="Sodium salts of aspartic acid (-NH2 & -COO- Na+) and phenylalanine (-NH2 & -COO- Na+) plus methanol..."
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full References (CPAC 5b — include specific URL + access date or textbook edition &amp; page)
                    </label>
                    <textarea
                      rows={2}
                      value={state.labData['12b'].researchNotes.references}
                      onChange={(e) =>
                        onUpdateLabData('12b', (cur) => ({
                          ...cur,
                          researchNotes: { ...cur.researchNotes, references: e.target.value },
                        }))
                      }
                      placeholder="e.g. Lister, T. & Renshaw, J., AQA Chemistry A Level (2nd Ed.), Oxford University Press, p. 490."
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h2 className="text-base font-semibold text-slate-900">Chromatogram Rf Summary</h2>
                <table className="w-full text-xs font-mono tabular-nums border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                      <th className="py-2 px-2 text-left">Spot</th>
                      <th className="py-2 px-2 text-right">x / mm</th>
                      <th className="py-2 px-2 text-right">y / mm</th>
                      <th className="py-2 px-2 text-right">Rf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { name: 'Aspartic acid std', x: state.labData['12b'].asparticAcidMm },
                      { name: 'Phenylalanine std', x: state.labData['12b'].phenylalanineMm },
                      { name: 'Sample spot 1', x: state.labData['12b'].sampleSpot1Mm },
                      { name: 'Sample spot 2', x: state.labData['12b'].sampleSpot2Mm },
                    ].map((row) => {
                      const y = state.labData['12b'].solventFrontMm;
                      return (
                        <tr key={row.name}>
                          <td className="py-2 px-2 font-sans">{row.name}</td>
                          <td className="py-2 px-2 text-right">{row.x ?? '—'}</td>
                          <td className="py-2 px-2 text-right">{y ?? '—'}</td>
                          <td className="py-2 px-2 text-right font-semibold text-blue-800">
                            {row.x && y ? (row.x / y).toFixed(2) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 12c Medicines Rf Calculation Table */}
          {practicalId === '12c' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">
                Retention Factors (Rf) Results Table (Manual Page 44)
              </h2>
              <table className="w-full text-xs font-mono tabular-nums border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3 text-left">Chemical Name</th>
                    <th className="py-2.5 px-3 text-right">Distance Travelled / mm</th>
                    <th className="py-2.5 px-3 text-right">Solvent Front / mm</th>
                    <th className="py-2.5 px-3 text-right">Rf Value (x / y)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[
                    { name: 'A — Aspirin', dist: state.labData['12c'].aspirinMm },
                    { name: 'B — Caffeine', dist: state.labData['12c'].caffeineMm },
                    { name: 'C — Paracetamol', dist: state.labData['12c'].paracetamolMm },
                    { name: 'D — Ibuprofen', dist: state.labData['12c'].ibuprofenMm },
                  ].map((row) => {
                    const front = state.labData['12c'].solventFrontMm;
                    return (
                      <tr key={row.name}>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{row.name}</td>
                        <td className="py-2.5 px-3 text-right">{row.dist ?? '—'}</td>
                        <td className="py-2.5 px-3 text-right">{front ?? '—'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-blue-800">
                          {row.dist && front ? (row.dist / front).toFixed(2) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-blue-50/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-blue-900">
                      E — Over-the-counter pain remedy spots
                    </td>
                    <td colSpan={3} className="py-2.5 px-3 text-right text-blue-900">
                      {state.labData['12c'].remedySpotsMm || 'Complete UV inspection in Virtual Lab'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Student Lab Notes box common to all practicals */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              Additional Lab Notes &amp; Teacher Feedback
            </label>
            <textarea
              rows={3}
              value={progress.notes}
              onChange={(e) =>
                onUpdatePractical(practicalId, (cur) => ({ ...cur, notes: e.target.value }))
              }
              placeholder="Record any observations, apparatus adjustments (CPAC 2b), or revision reminders..."
              className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </section>
      )}

      {/* TAB 4: WORKBOOK QUESTIONS */}
      {activeTab === 'questions' && (
        <section className="space-y-4">
          {def.questions.map((q) => {
            const revealed = !!revealedGuidance[q.id];
            return (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1 max-w-4xl">
                    <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-900">Question {q.number}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                      </span>
                      {q.cpac && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-blue-700 font-semibold">{q.cpac}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900 leading-relaxed">{q.prompt}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setRevealedGuidance((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium hover:bg-slate-100 flex items-center gap-1.5 shrink-0"
                  >
                    {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {revealed ? 'Hide Model Answer' : 'Check Model Answer'}
                  </button>
                </div>

                <textarea
                  rows={q.rows || 3}
                  value={progress.answers[q.id] || ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Write your full A-Level Chemistry answer here..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />

                {revealed && (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    <span className="font-semibold block text-emerald-800 mb-0.5">Model Answer / Marking Guidance:</span>
                    {q.guidance}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* TAB 5: OFFICIAL AQA EXAM PRACTICE & MARKSCHEME */}
      {activeTab === 'exam' && def.examQuestions && (
        <section className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">{def.examSectionTitle}</h2>
              {def.examIntro?.map((line, i) => (
                <p key={i} className="text-sm text-slate-600 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
            <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-right">
              <div className="text-xs text-slate-500">Self-Marked Score</div>
              <div className="text-xl font-mono font-bold tabular-nums text-blue-700">
                {totalExamSelfScore} / {def.examTotalMarks}
              </div>
            </div>
          </div>

          {def.examQuestions.map((eq) => {
            const msOpen = !!revealedMarkschemes[eq.id];
            const score = progress.selfMarkedScore[eq.id] ?? 0;

            return (
              <div key={eq.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1.5 max-w-4xl">
                    <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-900">Part {eq.part}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        [{eq.marks} {eq.marks === 1 ? 'mark' : 'marks'}]
                      </span>
                    </div>
                    {eq.stem && <p className="text-xs sm:text-sm text-slate-600">{eq.stem}</p>}
                    <p className="text-sm font-medium text-slate-900 leading-relaxed">{eq.prompt}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setRevealedMarkschemes((prev) => ({ ...prev, [eq.id]: !prev[eq.id] }))
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
                  >
                    {msOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {msOpen ? 'Hide AQA Markscheme' : 'Reveal AQA Markscheme'}
                  </button>
                </div>

                {eq.hasGraph && (
                  <ExamGraphs
                    type={eq.hasGraph}
                    plottedPoints={state.labData['7b'].examPlottedPoints}
                    onTogglePlotPoint={(pt) => {
                      onUpdateLabData('7b', (cur) => {
                        const exists = cur.examPlottedPoints.some(
                          (p) => Math.abs(p.t - pt.t) <= 30 && Math.abs(p.c - pt.c) <= 0.02
                        );
                        return {
                          ...cur,
                          examPlottedPoints: exists
                            ? cur.examPlottedPoints.filter(
                                (p) => !(Math.abs(p.t - pt.t) <= 30 && Math.abs(p.c - pt.c) <= 0.02)
                              )
                            : [...cur.examPlottedPoints, pt],
                        };
                      });
                    }}
                  />
                )}

                <textarea
                  rows={eq.rows || 4}
                  value={progress.examAnswers[eq.id] || ''}
                  onChange={(e) => setExamAnswer(eq.id, e.target.value)}
                  placeholder="Write your exam response and working before checking the official markscheme..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />

                {msOpen && (
                  <div className="bg-red-50/60 border border-red-200 rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-red-900">
                        Official AQA Markscheme
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-700 font-medium">Self-mark score:</span>
                        <select
                          value={score}
                          onChange={(e) => setSelfScore(eq.id, Number(e.target.value))}
                          className="border border-red-300 bg-white rounded px-2 py-1 font-mono text-xs text-slate-900"
                        >
                          {Array.from({ length: eq.marks + 1 }, (_, i) => i).map((m) => (
                            <option key={m} value={m}>
                              {m} / {eq.marks}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-red-950 list-disc pl-5">
                      {eq.markscheme.map((line, i) => (
                        <li key={i} className="leading-relaxed">{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Previous / Next Practical Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 no-print">
        <button
          type="button"
          disabled={currentIdx <= 0}
          onClick={() => onSelectPractical(PRACTICAL_ORDER[currentIdx - 1])}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Practical
        </button>

        <button
          type="button"
          disabled={currentIdx >= PRACTICAL_ORDER.length - 1}
          onClick={() => onSelectPractical(PRACTICAL_ORDER[currentIdx + 1])}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1.5"
        >
          Next Practical
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};
