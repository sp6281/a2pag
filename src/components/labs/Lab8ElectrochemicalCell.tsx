import React, { useEffect, useState } from 'react';
import { CheckCircle2, Zap, Sparkles, Droplets, ArrowRightLeft } from 'lucide-react';
import { Reading8 } from '../../types/workbook';

interface Lab8Props {
  readings: Reading8[];
  onRecordEmf: (solution: Reading8['solution'], emf: number) => void;
  onMarkLabComplete: () => void;
}

// Nernst Equation at 298 K:
// E(Cu2+/Cu) at 0.10 M = +0.34 + (0.05916 / 2) * log10(0.10) = +0.310 V
// E(Fe3+/Fe2+) = +0.77 + 0.05916 * log10([Fe3+] / [Fe2+])
// Ecell = E(Fe) - E(Cu)
function computeCellEmf(fe3ToFe2Ratio: number): number {
  const eCu = 0.34 + (0.05916 / 2) * Math.log10(0.1);
  const eFe = 0.77 + 0.05916 * Math.log10(fe3ToFe2Ratio);
  return Number((eFe - eCu).toFixed(3));
}

export const Lab8ElectrochemicalCell: React.FC<Lab8Props> = ({
  readings,
  onRecordEmf,
  onMarkLabComplete,
}) => {
  const [cuCleaned, setCuCleaned] = useState(false);
  const [saltBridgePlaced, setSaltBridgePlaced] = useState(false);
  const [wiresConnected, setWiresConnected] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showFlow, setShowFlow] = useState(true);
  const [rinsedStatus, setRinsedStatus] = useState(true);

  const current = readings[selectedIdx];
  const recordedCount = readings.filter((r) => r.emf !== null).length;

  useEffect(() => {
    if (recordedCount === readings.length) {
      onMarkLabComplete();
    }
  }, [recordedCount, readings.length, onMarkLabComplete]);

  const circuitComplete = saltBridgePlaced && wiresConnected;
  // Uncleaned oxide layer on Cu reduces reading slightly & causes instability
  const rawEmf = computeCellEmf(current.fe3ToFe2Ratio);
  const displayedEmf = !circuitComplete
    ? 0
    : cuCleaned
    ? rawEmf
    : Number((rawEmf - 0.045).toFixed(3));

  // Solution color shifts from pale yellow-green (low Fe3+, Solution A 1:5) to rich amber-gold (high Fe3+, Solution E 5:1)
  const feColorMap: Record<Reading8['solution'], string> = {
    A: '#FEF3C7',
    B: '#FDE68A',
    C: '#FCD34D',
    D: '#F59E0B',
    E: '#D97706',
  };

  const handleSelectSolution = (idx: number) => {
    setSelectedIdx(idx);
    setRinsedStatus(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Interactive Cell Bench */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Cu(s) | Cu²⁺(aq) || Fe³⁺(aq), Fe²⁺(aq) | C(s) Electrochemical Cell
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-resistance digital voltmeter · Solution {current.solution} (Fe³⁺:Fe²⁺ = {current.ratioLabel})
            </p>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showFlow}
              onChange={(e) => setShowFlow(e.target.checked)}
              className="rounded border-slate-300 text-blue-700"
            />
            Show e⁻ &amp; ion migration
          </label>
        </div>

        {/* SVG Electrochemical Cell */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <svg viewBox="0 0 640 310" className="w-full h-auto">
            {/* Lab bench */}
            <rect x="0" y="274" width="640" height="36" fill="#E2E8F0" />
            <line x1="0" y1="274" x2="640" y2="274" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* High-Resistance Digital Voltmeter */}
            <rect x="235" y="16" width="170" height="72" rx="8" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
            <rect x="251" y="28" width="138" height="36" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <text
              x="320"
              y="53"
              textAnchor="middle"
              className={`text-[21px] font-mono font-semibold ${
                circuitComplete ? 'fill-emerald-400' : 'fill-slate-500'
              }`}
            >
              {circuitComplete ? `+${displayedEmf.toFixed(3)} V` : '0.000 V'}
            </text>
            <text x="320" y="80" textAnchor="middle" className="text-[9.5px] fill-slate-300 font-mono">
              HIGH-RESISTANCE VOLTMETER
            </text>
            {/* Terminals */}
            <circle cx="255" cy="88" r="5" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
            <text x="242" y="92" textAnchor="end" className="text-[11px] fill-slate-700 font-bold">−</text>
            <circle cx="385" cy="88" r="5" fill="#DC2626" stroke="#94A3B8" strokeWidth="1.5" />
            <text x="398" y="92" textAnchor="start" className="text-[11px] fill-red-700 font-bold">+</text>

            {/* Connecting Wires */}
            {wiresConnected && (
              <g>
                {/* Negative black lead to Copper */}
                <path d="M 255 88 C 190 88, 130 92, 130 132" fill="none" stroke="#1E293B" strokeWidth="3" />
                {/* Positive red lead to Graphite */}
                <path d="M 385 88 C 450 88, 510 92, 510 132" fill="none" stroke="#DC2626" strokeWidth="3" />

                {/* Electron flow direction arrow (Cu -> Voltmeter -> Graphite) */}
                {circuitComplete && showFlow && (
                  <g>
                    <path d="M 162 96 L 210 85" stroke="#2563EB" strokeWidth="2" markerEnd="url(#arrowBlue)" />
                    <text x="180" y="80" textAnchor="middle" className="text-[10px] fill-blue-700 font-mono font-semibold">
                      e⁻ flow →
                    </text>
                    <path d="M 430 85 L 478 96" stroke="#2563EB" strokeWidth="2" markerEnd="url(#arrowBlue)" />
                    <text x="462" y="80" textAnchor="middle" className="text-[10px] fill-blue-700 font-mono font-semibold">
                      e⁻ flow →
                    </text>
                  </g>
                )}
              </g>
            )}

            <defs>
              <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#2563EB" />
              </marker>
            </defs>

            {/* Left Half-Cell: Copper / 0.1 M CuSO4 */}
            <g>
              <path d="M 76 154 L 76 266 Q 76 274 86 274 L 220 274 Q 230 274 230 266 L 230 154" fill="#FFFFFF" fillOpacity="0.7" stroke="#334155" strokeWidth="2" />
              <rect x="79" y="192" width="148" height="80" rx="3" fill="#38BDF8" fillOpacity="0.45" />
              {/* Copper electrode */}
              <rect
                x="118"
                y="130"
                width="24"
                height="128"
                rx="2"
                fill={cuCleaned ? '#D97706' : '#92400E'}
                stroke={cuCleaned ? '#B45309' : '#451A03'}
                strokeWidth="1.8"
              />
              {!cuCleaned && (
                <rect x="118" y="185" width="24" height="72" fill="#57534E" fillOpacity="0.45" />
              )}
              <text x="153" y="290" textAnchor="middle" className="text-[11px] fill-slate-800 font-semibold">
                Cu(s) | 0.1 mol dm⁻³ CuSO₄(aq)
              </text>
              <text x="153" y="303" textAnchor="middle" className="text-[9.5px] fill-slate-500 font-mono">
                Negative electrode (Oxidation: Cu → Cu²⁺ + 2e⁻)
              </text>
            </g>

            {/* Right Half-Cell: Graphite / Fe3+, Fe2+ */}
            <g>
              <path d="M 410 154 L 410 266 Q 410 274 420 274 L 554 274 Q 564 274 564 266 L 564 154" fill="#FFFFFF" fillOpacity="0.7" stroke="#334155" strokeWidth="2" />
              <rect x="413" y="192" width="148" height="80" rx="3" fill={feColorMap[current.solution]} fillOpacity="0.6" />
              {/* Graphite electrode */}
              <rect x="498" y="130" width="24" height="128" rx="2" fill="#334155" stroke="#0F172A" strokeWidth="1.8" />
              <text x="487" y="290" textAnchor="middle" className="text-[11px] fill-slate-800 font-semibold">
                Solution {current.solution} ({current.ratioLabel} Fe³⁺:Fe²⁺) | C(s)
              </text>
              <text x="487" y="303" textAnchor="middle" className="text-[9.5px] fill-slate-500 font-mono">
                Positive electrode (Reduction: Fe³⁺ + e⁻ → Fe²⁺)
              </text>
            </g>

            {/* Salt Bridge: Saturated KNO3 soaked filter paper */}
            {saltBridgePlaced ? (
              <g>
                <path
                  d="M 206 232 L 206 144 Q 206 122 232 122 L 408 122 Q 434 122 434 144 L 434 232"
                  fill="none"
                  stroke="#F8FAFC"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M 206 232 L 206 144 Q 206 122 232 122 L 408 122 Q 434 122 434 144 L 434 232"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text x="320" y="114" textAnchor="middle" className="text-[10px] fill-slate-700 font-medium">
                  Salt Bridge (saturated KNO₃ filter paper)
                </text>
                {showFlow && circuitComplete && (
                  <text x="320" y="142" textAnchor="middle" className="text-[9.5px] fill-indigo-700 font-mono font-medium">
                    ← NO₃⁻ ions | K⁺ ions →
                  </text>
                )}
              </g>
            ) : (
              <text x="320" y="160" textAnchor="middle" className="text-[11px] fill-amber-700 font-medium">
                Place KNO₃ salt bridge (with tweezers) to complete circuit
              </text>
            )}
          </svg>
        </div>

        {/* Live EMF vs Solution Trend Chart */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-700">
              Cell Potential Trend Across Solutions A → E
            </h4>
            <span className="text-xs font-mono text-slate-500">
              {recordedCount}/5 solutions recorded
            </span>
          </div>
          <svg viewBox="0 0 520 130" className="w-full h-auto bg-white border border-slate-200 rounded-lg">
            <line x1="55" y1="15" x2="55" y2="100" stroke="#0F172A" strokeWidth="1.2" />
            <line x1="55" y1="100" x2="495" y2="100" stroke="#0F172A" strokeWidth="1.2" />
            {[0.38, 0.44, 0.50, 0.54].map((v) => {
              const y = 100 - ((v - 0.36) / 0.18) * 80;
              return (
                <g key={v}>
                  <line x1="55" y1={y} x2="495" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                  <text x="48" y={y + 3} textAnchor="end" className="text-[9.5px] fill-slate-500 font-mono">
                    {v.toFixed(2)}
                  </text>
                </g>
              );
            })}
            {readings.map((r, i) => {
              const x = 100 + i * 90;
              const y = r.emf !== null ? 100 - ((r.emf - 0.36) / 0.18) * 80 : null;
              return (
                <g key={r.solution}>
                  <text x={x} y="116" textAnchor="middle" className="text-[10px] fill-slate-700 font-mono">
                    Sol {r.solution} ({r.ratioLabel})
                  </text>
                  {y !== null && (
                    <>
                      <circle cx={x} cy={y} r="4.5" fill="#1D4ED8" />
                      <text x={x} y={y - 8} textAnchor="middle" className="text-[9.5px] fill-blue-800 font-mono font-semibold">
                        +{r.emf?.toFixed(3)}V
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right Control Deck */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="space-y-2.5">
          <h4 className="text-sm font-semibold text-slate-900">1. Prepare Apparatus</h4>
          <button
            type="button"
            onClick={() => setCuCleaned(true)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
              cuCleaned
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Clean copper electrode with emery paper &amp; rinse
            </span>
            <span>{cuCleaned ? 'Clean' : 'Required'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSaltBridgePlaced((v) => !v)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
              saltBridgePlaced
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              {saltBridgePlaced ? 'Salt bridge placed (KNO₃)' : 'Soak & place KNO₃ salt bridge (tweezers)'}
            </span>
            <span>{saltBridgePlaced ? 'Active' : 'Insert'}</span>
          </button>

          <button
            type="button"
            onClick={() => setWiresConnected((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 hover:bg-slate-100"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-600" />
              Voltmeter leads &amp; crocodile clips
            </span>
            <span className="font-mono">{wiresConnected ? 'Connected' : 'Disconnected'}</span>
          </button>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">2. Select Fe³⁺ / Fe²⁺ Solution</h4>
            {!rinsedStatus && (
              <button
                type="button"
                onClick={() => setRinsedStatus(true)}
                className="text-xs text-blue-700 hover:underline flex items-center gap-1"
              >
                <Droplets className="w-3.5 h-3.5" />
                Rinse &amp; dry graphite electrode
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {readings.map((r, idx) => (
              <button
                key={r.solution}
                type="button"
                onClick={() => handleSelectSolution(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                  idx === selectedIdx
                    ? 'bg-blue-50 border-blue-600 text-slate-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>
                  Solution {r.solution} · Ratio Fe³⁺:Fe²⁺ = <span className="font-mono">{r.ratioLabel}</span>
                </span>
                <span className="font-mono tabular-nums">
                  {r.emf !== null ? (
                    <span className="text-emerald-700 font-semibold">+{r.emf.toFixed(3)} V</span>
                  ) : (
                    <span className="text-slate-400">Not recorded</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          {!cuCleaned && circuitComplete && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Notice: Oxide coating on the uncleaned copper strip lowers the reading. Clean with emery paper before recording!
            </div>
          )}
          <button
            type="button"
            disabled={!circuitComplete || !cuCleaned}
            onClick={() => onRecordEmf(current.solution, displayedEmf)}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-45 flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Record Solution {current.solution} EMF (+{displayedEmf.toFixed(3)} V)
          </button>
        </div>
      </div>
    </div>
  );
};
