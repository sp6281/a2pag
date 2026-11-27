import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Flame, CheckCircle2, Timer, Beaker } from 'lucide-react';
import { Run7a } from '../../types/workbook';

interface Lab7aProps {
  runs: Run7a[];
  onRecordRun: (runIndex: number, timeSeconds: number) => void;
  onMarkLabComplete: () => void;
}

// Realistic first-order kinetics in H2O2: t * [H2O2] = constant (~720 cm3·s at 20°C)
const TARGET_TIME_20C = (volB: number) => 720 / volB;

export const Lab7aIodineClock: React.FC<Lab7aProps> = ({
  runs,
  onRecordRun,
  onMarkLabComplete,
}) => {
  const [selectedRunIdx, setSelectedRunIdx] = useState<number>(0);
  const [temperature, setTemperature] = useState<20 | 35>(20);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 5 | 10>(5);
  const [phase, setPhase] = useState<'ready' | 'pouring' | 'timing' | 'flashed'>('ready');
  const [elapsed, setElapsed] = useState<number>(0);
  const [targetTime, setTargetTime] = useState<number>(18);
  const [swirlAngle, setSwirlAngle] = useState<number>(0);

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const currentRun = runs[selectedRunIdx];
  const completedCount = runs.filter((r) => r.timeSeconds !== null).length;

  useEffect(() => {
    if (completedCount === 4) {
      onMarkLabComplete();
    }
  }, [completedCount, onMarkLabComplete]);

  useEffect(() => {
    if (phase !== 'timing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastFrameRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - (lastFrameRef.current || now)) / 1000;
      lastFrameRef.current = now;

      setElapsed((prev) => {
        const next = prev + dt * speedMultiplier;
        setSwirlAngle((a) => (a + dt * 360) % 360);
        if (next >= targetTime) {
          setPhase('flashed');
          return targetTime;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, speedMultiplier, targetTime]);

  const startExperiment = () => {
    const baseTime = TARGET_TIME_20C(currentRun.volB);
    // Heating to 35 °C approximately doubles the rate (~halves time)
    const tempFactor = temperature === 35 ? 0.48 : 1.0;
    // Deterministic small experimental variation per run
    const jitter = ((selectedRunIdx * 17 + temperature) % 5 - 2) * 0.25;
    const computed = Math.max(4, Number((baseTime * tempFactor + jitter).toFixed(1)));
    setTargetTime(computed);
    setElapsed(0);
    setPhase('pouring');
    window.setTimeout(() => {
      setPhase('timing');
    }, 650);
  };

  const resetBeakers = () => {
    setPhase('ready');
    setElapsed(0);
  };

  const handleSelectRun = (idx: number) => {
    setSelectedRunIdx(idx);
    setPhase('ready');
    setElapsed(0);
  };

  const handleRecordCurrent = () => {
    if (phase === 'flashed' && temperature === 20) {
      onRecordRun(selectedRunIdx, Number(targetTime.toFixed(1)));
    }
  };

  // Liquid color transition: sudden sharp shift at 98.5% -> 100% of targetTime
  const progress = targetTime > 0 ? Math.min(1, elapsed / targetTime) : 0;
  const isBlueBlack = phase === 'flashed' || progress >= 0.99;

  // Graph data for Rate (1/t) vs Vol B
  const recordedRuns = runs.filter((r) => r.timeSeconds !== null && r.timeSeconds > 0);
  const maxRate = Math.max(0.07, ...recordedRuns.map((r) => 1 / (r.timeSeconds || 1)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Interactive Stage (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Iodine Clock Apparatus — Run {selectedRunIdx + 1} of 4
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Total volume constant at 80 cm³ · Solution A buffered with starch &amp; S₂O₃²⁻ · {temperature} °C
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums text-sm bg-slate-900 text-white px-3.5 py-2 rounded-lg">
            <Timer className="w-4 h-4 text-blue-400" />
            <span>{elapsed.toFixed(1)} s</span>
          </div>
        </div>

        {/* SVG Bench Visualization */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
          <svg viewBox="0 0 640 270" className="w-full h-auto">
            {/* Bench top */}
            <rect x="0" y="232" width="640" height="38" fill="#E2E8F0" />
            <line x1="0" y1="232" x2="640" y2="232" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Beaker 1: Solution A (40 cm3) */}
            <g transform={phase === 'pouring' ? 'translate(70, -35) rotate(28 110 150)' : 'translate(0, 0)'} className="transition-transform duration-500">
              <path d="M 65 95 L 65 224 Q 65 232 75 232 L 155 232 Q 165 232 165 224 L 165 95" fill="#FFFFFF" fillOpacity="0.65" stroke="#475569" strokeWidth="2" />
              <line x1="60" y1="95" x2="170" y2="95" stroke="#475569" strokeWidth="2" />
              {/* Liquid in A */}
              <rect
                x="68"
                y={phase === 'ready' ? 162 : 226}
                width="94"
                height={phase === 'ready' ? 68 : 4}
                rx="3"
                fill="#E0F2FE"
                fillOpacity="0.85"
                className="transition-all duration-500"
              />
              {/* Graduations */}
              {[130, 160, 190].map((y) => (
                <line key={y} x1="68" y1={y} x2="82" y2={y} stroke="#94A3B8" strokeWidth="1" />
              ))}
              <text x="115" y="252" textAnchor="middle" className="text-[11px] fill-slate-700 font-medium">
                Beaker 1: Solution A
              </text>
              <text x="115" y="264" textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">
                {currentRun.volA} cm³ (KI + S₂O₃²⁻ + starch)
              </text>
            </g>

            {/* Beaker 2: Solution B + Distilled Water (40 cm3 total) */}
            <g transform={phase === 'pouring' ? 'translate(-70, -35) rotate(-28 525 150)' : 'translate(0, 0)'} className="transition-transform duration-500">
              <path d="M 475 95 L 475 224 Q 475 232 485 232 L 565 232 Q 575 232 575 224 L 575 95" fill="#FFFFFF" fillOpacity="0.65" stroke="#475569" strokeWidth="2" />
              <line x1="470" y1="95" x2="580" y2="95" stroke="#475569" strokeWidth="2" />
              <rect
                x="478"
                y={phase === 'ready' ? 162 : 226}
                width="94"
                height={phase === 'ready' ? 68 : 4}
                rx="3"
                fill="#DBEAFE"
                fillOpacity="0.85"
                className="transition-all duration-500"
              />
              {[130, 160, 190].map((y) => (
                <line key={y} x1="478" y1={y} x2="492" y2={y} stroke="#94A3B8" strokeWidth="1" />
              ))}
              <text x="525" y="252" textAnchor="middle" className="text-[11px] fill-slate-700 font-medium">
                Beaker 2: H₂O₂ + H₂O
              </text>
              <text x="525" y="264" textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">
                {currentRun.volB} cm³ B + {currentRun.volWater} cm³ H₂O
              </text>
            </g>

            {/* Center Reaction Beaker (250 cm3) */}
            <g>
              {/* White tile beneath center beaker */}
              <rect x="235" y="227" width="170" height="8" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
              <path d="M 260 72 L 260 218 Q 260 227 272 227 L 368 227 Q 380 227 380 218 L 380 72" fill="#FFFFFF" fillOpacity="0.72" stroke="#334155" strokeWidth="2.2" />
              <line x1="254" y1="72" x2="386" y2="72" stroke="#334155" strokeWidth="2.2" />

              {/* Mixed liquid (80 cm3) */}
              {phase !== 'ready' && (
                <g>
                  <rect
                    x="263"
                    y={phase === 'pouring' ? 175 : 132}
                    width="114"
                    height={phase === 'pouring' ? 50 : 93}
                    rx="4"
                    fill={isBlueBlack ? '#17153B' : '#F0F9FF'}
                    fillOpacity={isBlueBlack ? 0.96 : 0.9}
                    className="transition-colors duration-150"
                  />
                  {/* Swirling meniscus wave during timing */}
                  {phase === 'timing' && (
                    <ellipse
                      cx="320"
                      cy={132 + Math.sin((swirlAngle * Math.PI) / 180) * 2.5}
                      rx="55"
                      ry="5"
                      fill="#BAE6FD"
                      fillOpacity="0.6"
                    />
                  )}
                  {isBlueBlack && (
                    <text x="320" y="182" textAnchor="middle" className="text-[11px] fill-indigo-100 font-mono font-semibold">
                      I₂–Starch Complex
                    </text>
                  )}
                </g>
              )}

              {phase === 'ready' && (
                <text x="320" y="160" textAnchor="middle" className="text-[11px] fill-slate-400">
                  Empty 250 cm³ beaker
                </text>
              )}

              {/* Warm water bath glow if 35°C selected */}
              {temperature === 35 && (
                <g>
                  <rect x="250" y="216" width="140" height="11" rx="2" fill="#FED7AA" fillOpacity="0.8" stroke="#EA580C" strokeWidth="1" />
                  <text x="320" y="224" textAnchor="middle" className="text-[8.5px] fill-orange-900 font-mono font-semibold">
                    HEATED 35 °C
                  </text>
                </g>
              )}

              <text x="320" y="252" textAnchor="middle" className="text-[11px] fill-slate-800 font-semibold">
                Reaction Beaker (80 cm³)
              </text>
              <text x="320" y="264" textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">
                {phase === 'ready' && 'Ready to mix'}
                {phase === 'pouring' && 'Mixing solutions...'}
                {phase === 'timing' && 'Colourless (S₂O₃²⁻ consuming I₂)'}
                {phase === 'flashed' && `Blue-black endpoint at ${targetTime.toFixed(1)} s`}
              </text>
            </g>
          </svg>
        </div>

        {/* Live Rate vs Volume of B Graph */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-700">
              Live Kinetics Plot: Average Rate (1/t) vs Volume of H₂O₂ (Solution B)
            </h4>
            <span className="text-xs font-mono text-slate-500">
              {recordedRuns.length}/4 runs recorded
            </span>
          </div>
          <svg viewBox="0 0 520 175" className="w-full h-auto bg-white border border-slate-200 rounded-lg">
            {/* Axes */}
            <line x1="60" y1="15" x2="60" y2="140" stroke="#0F172A" strokeWidth="1.2" />
            <line x1="60" y1="140" x2="495" y2="140" stroke="#0F172A" strokeWidth="1.2" />
            {[0, 10, 20, 30, 40].map((v) => {
              const x = 60 + (v / 45) * 430;
              return (
                <g key={v}>
                  <line x1={x} y1="15" x2={x} y2="140" stroke="#F1F5F9" strokeWidth="1" />
                  <text x={x} y="155" textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">
                    {v}
                  </text>
                </g>
              );
            })}
            {[0, 0.02, 0.04, 0.06].map((r) => {
              const y = 140 - (r / maxRate) * 120;
              return (
                <g key={r}>
                  <line x1="60" y1={y} x2="495" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                  <text x="53" y={y + 3} textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
                    {r.toFixed(2)}
                  </text>
                </g>
              );
            })}
            {/* Trend line if >= 2 points */}
            {recordedRuns.length >= 2 && (
              <line
                x1="60"
                y1="140"
                x2={60 + (40 / 45) * 430}
                y2={140 - ((1 / 18) / maxRate) * 120}
                stroke="#93C5FD"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            )}
            {/* Recorded points */}
            {recordedRuns.map((r) => {
              const rate = 1 / (r.timeSeconds || 1);
              const cx = 60 + (r.volB / 45) * 430;
              const cy = 140 - (rate / maxRate) * 120;
              return (
                <g key={r.runIndex}>
                  <circle cx={cx} cy={cy} r="4.5" fill="#1D4ED8" />
                  <text x={cx + 7} y={cy - 5} className="text-[9.5px] fill-slate-700 font-mono">
                    {rate.toFixed(4)}
                  </text>
                </g>
              );
            })}
            <text x="275" y="170" textAnchor="middle" className="text-[10.5px] fill-slate-600 font-medium">
              Volume of Solution B (H₂O₂) / cm³
            </text>
            <text x="16" y="78" textAnchor="middle" transform="rotate(-90 16 78)" className="text-[10.5px] fill-slate-600 font-medium">
              Rate (1/t) / s⁻¹
            </text>
          </svg>
        </div>
      </div>

      {/* Right Control Deck (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">1. Select Mixture Composition</h4>
          <div className="grid grid-cols-1 gap-2">
            {runs.map((r, idx) => {
              const active = idx === selectedRunIdx;
              const done = r.timeSeconds !== null;
              return (
                <button
                  key={r.runIndex}
                  type="button"
                  onClick={() => handleSelectRun(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left transition-colors ${
                    active
                      ? 'bg-blue-50 border-blue-600 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">
                      Run {idx + 1}: {r.volB} cm³ H₂O₂ + {r.volWater} cm³ H₂O
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Solution A: {r.volA} cm³ · Total: 80 cm³
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums text-xs">
                    {done ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {r.timeSeconds?.toFixed(1)} s
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Stopwatch Speed
            </label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {([1, 5, 10] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeedMultiplier(s)}
                  className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                    speedMultiplier === s
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Temperature (Q2 Test)
            </label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {([20, 35] as const).map((temp) => (
                <button
                  key={temp}
                  type="button"
                  onClick={() => {
                    setTemperature(temp);
                    resetBeakers();
                  }}
                  className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                    temperature === temp
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {temp === 35 && <Flame className="w-3 h-3 text-orange-600" />}
                  {temp}°C
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startExperiment}
              disabled={phase === 'pouring' || phase === 'timing'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              {phase === 'flashed' ? 'Repeat Mix' : 'Mix & Start Stopwatch'}
            </button>
            <button
              type="button"
              onClick={resetBeakers}
              className="px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              title="Wash and dry beakers"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {phase === 'flashed' && temperature === 20 && (
            <button
              type="button"
              onClick={handleRecordCurrent}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors"
            >
              <Beaker className="w-4 h-4" />
              Record {targetTime.toFixed(1)} s into Results Table (Run {selectedRunIdx + 1})
            </button>
          )}

          {phase === 'flashed' && temperature === 35 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Heated trial complete in <span className="font-mono font-semibold">{targetTime.toFixed(1)} s</span> (much faster than at 20 °C). Switch back to 20 °C to record controlled-temperature table runs.
            </div>
          )}
        </div>

        {/* Summary table preview */}
        <div className="border-t border-slate-100 pt-3">
          <div className="text-xs font-semibold text-slate-700 mb-2">Recorded Results Preview</div>
          <table className="w-full text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1 text-left font-medium">Vol B / cm³</th>
                <th className="py-1 text-right font-medium">Time / s</th>
                <th className="py-1 text-right font-medium">Rate (1/t) / s⁻¹</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.runIndex} className="border-b border-slate-100 text-slate-800">
                  <td className="py-1.5">{r.volB}</td>
                  <td className="py-1.5 text-right">{r.timeSeconds !== null ? r.timeSeconds.toFixed(1) : '—'}</td>
                  <td className="py-1.5 text-right">
                    {r.timeSeconds ? (1 / r.timeSeconds).toFixed(4) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
