import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Point7b } from '../../types/workbook';

interface Lab7bProps {
  readings: Point7b[];
  vFinal: number | null;
  onSaveReadings: (readings: Point7b[], vFinal: number) => void;
  onMarkLabComplete: () => void;
}

// First-order decay kinetics: V(t) = V_final * (1 - exp(-k * t))
// 10 cm3 of 1.0 M HCl + excess marble chips; after saturation delay V_final = 96.0 cm3, k = 0.024 s^-1
const V_FINAL_THEORETICAL = 96.0;
const K_RATE = 0.024;

function volumeAtTime(t: number): number {
  const v = V_FINAL_THEORETICAL * (1 - Math.exp(-K_RATE * t));
  return Math.min(V_FINAL_THEORETICAL, Number(v.toFixed(1)));
}

export const Lab7bGasSyringe: React.FC<Lab7bProps> = ({
  readings,
  vFinal,
  onSaveReadings,
  onMarkLabComplete,
}) => {
  const [stage, setStage] = useState<'setup' | 'saturating' | 'running' | 'paused' | 'finished'>('setup');
  const [time, setTime] = useState<number>(0);
  const [speed, setSpeed] = useState<1 | 5 | 10>(5);
  const [autoLog, setAutoLog] = useState<boolean>(true);
  const [localReadings, setLocalReadings] = useState<Point7b[]>(readings);
  const [tangentTime, setTangentTime] = useState<number>(30);

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastLoggedRef = useRef<number>(-10);

  const currentVolume = stage === 'setup' ? 0 : stage === 'saturating' ? 0 : volumeAtTime(time);
  const activeVFinal = vFinal || (localReadings.length > 0 ? Math.max(V_FINAL_THEORETICAL, ...localReadings.map((p) => p.volume)) : V_FINAL_THEORETICAL);

  useEffect(() => {
    if (stage !== 'running') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastFrameRef.current = performance.now();
    const step = (now: number) => {
      const dt = (now - (lastFrameRef.current || now)) / 1000;
      lastFrameRef.current = now;

      setTime((prev) => {
        const next = prev + dt * speed;
        const nextRoundedTen = Math.floor(next / 10) * 10;
        if (autoLog && nextRoundedTen > lastLoggedRef.current && nextRoundedTen <= 160) {
          lastLoggedRef.current = nextRoundedTen;
          const pt = { time: nextRoundedTen, volume: volumeAtTime(nextRoundedTen) };
          setLocalReadings((curr) => {
            if (curr.some((x) => x.time === pt.time)) return curr;
            return [...curr, pt].sort((a, b) => a.time - b.time);
          });
        }
        if (next >= 160) {
          setStage('finished');
          return 160;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stage, speed, autoLog]);

  const handleAddAcid = () => {
    setStage('saturating');
    setTime(0);
    setLocalReadings([{ time: 0, volume: 0 }]);
    lastLoggedRef.current = 0;
  };

  const handleInsertBungAndStart = () => {
    setStage('running');
  };

  const handleManualLog = () => {
    const tSnap = Math.round(time);
    const vSnap = volumeAtTime(tSnap);
    setLocalReadings((curr) => {
      const filtered = curr.filter((x) => x.time !== tSnap);
      return [...filtered, { time: tSnap, volume: vSnap }].sort((a, b) => a.time - b.time);
    });
  };

  const handleSaveToWorkbook = () => {
    const finalVol = Number(Math.max(V_FINAL_THEORETICAL, ...localReadings.map((p) => p.volume)).toFixed(1));
    onSaveReadings(localReadings, finalVol);
    onMarkLabComplete();
  };

  const handleReset = () => {
    setStage('setup');
    setTime(0);
    setLocalReadings([]);
    lastLoggedRef.current = -10;
  };

  // Tangent calculations on (Vfinal - Vt) vs t
  const concAtT = activeVFinal * Math.exp(-K_RATE * tangentTime);
  const rateAtT = K_RATE * concAtT; // |d(Vfinal - Vt)/dt|
  // Sample 5 regular tangent intervals for Rate vs Conc graph
  const fiveTangents = [10, 30, 50, 80, 110].map((t) => {
    const rem = activeVFinal * Math.exp(-K_RATE * t);
    const grad = K_RATE * rem;
    return { t, rem, grad };
  });

  // Plunger position in SVG (0 cm3 -> x=340, 100 cm3 -> x=510)
  const plungerX = 340 + (currentVolume / 100) * 170;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Interactive Stage */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Gas Syringe Continuous Monitoring Apparatus
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              10 g excess marble chips (CaCO₃) + 10 cm³ of 1.0 mol dm⁻³ HCl
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md">
              t = {time.toFixed(1)} s
            </div>
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-md font-semibold">
              V(CO₂) = {currentVolume.toFixed(1)} cm³
            </div>
          </div>
        </div>

        {/* SVG Gas Syringe Apparatus */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <svg viewBox="0 0 640 250" className="w-full h-auto">
            {/* Bench */}
            <rect x="0" y="220" width="640" height="30" fill="#E2E8F0" />
            <line x1="0" y1="220" x2="640" y2="220" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Retort Stand for Gas Syringe */}
            <rect x="405" y="208" width="110" height="12" fill="#475569" rx="2" />
            <rect x="455" y="38" width="8" height="172" fill="#64748B" />
            {/* Clamp around syringe barrel */}
            <rect x="444" y="88" width="30" height="46" rx="4" fill="#334155" />

            {/* Conical Flask / Reaction Vessel */}
            <path d="M 118 98 L 118 122 L 75 210 Q 72 218 82 218 L 188 218 Q 198 218 195 210 L 152 122 L 152 98 Z" fill="#FFFFFF" fillOpacity="0.8" stroke="#334155" strokeWidth="2.2" />

            {/* Acid inside flask */}
            {stage !== 'setup' && (
              <path d="M 94 174 L 176 174 L 193 210 Q 195 216 186 216 L 84 216 Q 75 216 77 210 Z" fill="#DBEAFE" fillOpacity="0.85" />
            )}

            {/* Marble chips (6-7 lumps) */}
            <g fill="#CBD5E1" stroke="#64748B" strokeWidth="1">
              <polygon points="95,213 105,204 116,209 112,215" />
              <polygon points="115,214 124,202 135,208 131,215" />
              <polygon points="135,214 146,205 156,211 151,215" />
              <polygon points="154,214 166,204 176,210 171,215" />
              <polygon points="107,205 117,197 126,203 120,209" />
              <polygon points="140,206 150,198 160,204 153,210" />
            </g>

            {/* Effervescence CO2 bubbles when reacting */}
            {(stage === 'saturating' || stage === 'running') && currentVolume < 94.5 && (
              <g>
                {[108, 124, 138, 152, 165].map((bx, i) => (
                  <circle
                    key={bx}
                    cx={bx}
                    cy={205}
                    r={2.2 + (i % 2)}
                    fill="#FFFFFF"
                    stroke="#3B82F6"
                    strokeWidth="0.9"
                    className="animate-bubble"
                    style={{ animationDelay: `${i * 0.24}s` }}
                  />
                ))}
              </g>
            )}

            {/* Rubber Stopper (inserted once running/paused/finished) */}
            <polygon
              points={stage === 'setup' || stage === 'saturating' ? '116,64 154,64 150,86 120,86' : '116,84 154,84 150,106 120,106'}
              fill="#475569"
              className="transition-all duration-300"
            />

            {/* Rubber Delivery Tubing */}
            <path
              d={
                stage === 'setup' || stage === 'saturating'
                  ? 'M 135 64 C 135 30, 250 40, 315 111'
                  : 'M 135 84 C 135 42, 250 48, 315 111'
              }
              fill="none"
              stroke="#64748B"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={
                stage === 'setup' || stage === 'saturating'
                  ? 'M 135 64 C 135 30, 250 40, 315 111'
                  : 'M 135 84 C 135 42, 250 48, 315 111'
              }
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* 100 cm3 Gas Syringe Barrel */}
            <rect x="315" y="106" width="14" height="10" fill="#94A3B8" />
            <rect x="329" y="92" width="205" height="38" rx="3" fill="#FFFFFF" fillOpacity="0.88" stroke="#334155" strokeWidth="2" />
            {/* Collected CO2 subtle tint */}
            <rect x="331" y="94" width={Math.max(0, plungerX - 331)} height="34" fill="#EFF6FF" />

            {/* Syringe Scale (0 to 100 cm3) */}
            {[0, 20, 40, 60, 80, 100].map((vol) => {
              const x = 340 + (vol / 100) * 170;
              return (
                <g key={vol}>
                  <line x1={x} y1="92" x2={x} y2="102" stroke="#475569" strokeWidth="1" />
                  <text x={x} y="85" textAnchor="middle" className="text-[9px] fill-slate-600 font-mono">
                    {vol}
                  </text>
                </g>
              );
            })}

            {/* Moving Plunger Head & Rod */}
            <rect x={plungerX} y="95" width="14" height="32" rx="2" fill="#1E293B" />
            <rect x={plungerX + 14} y="107" width={Math.max(24, 605 - (plungerX + 14))} height="8" fill="#94A3B8" stroke="#475569" strokeWidth="1" />
            <rect x="605" y="98" width="7" height="26" rx="2" fill="#475569" />

            <text x="135" y="238" textAnchor="middle" className="text-[11px] fill-slate-700 font-medium">
              Marble chips + 1.0 M HCl
            </text>
            <text x="430" y="148" textAnchor="middle" className="text-[11px] fill-slate-700 font-medium">
              100 cm³ Gas Syringe
            </text>
          </svg>
        </div>

        {/* Dual Live Kinetics Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Graph 1: (Vfinal - Vt) vs t with interactive tangent */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-800">(Vfinal − Vt) vs Time</span>
              <span className="text-[11px] font-mono text-amber-700">
                Tangent @ {tangentTime}s: {rateAtT.toFixed(2)} cm³/s
              </span>
            </div>
            <svg viewBox="0 0 280 170" className="w-full h-auto">
              <line x1="40" y1="12" x2="40" y2="138" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="40" y1="138" x2="266" y2="138" stroke="#0F172A" strokeWidth="1.2" />
              {[0, 40, 80, 120, 160].map((t) => {
                const x = 40 + (t / 160) * 222;
                return (
                  <text key={t} x={x} y="152" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">
                    {t}
                  </text>
                );
              })}
              {[0, 50, 100].map((v) => {
                const y = 138 - (v / 100) * 122;
                return (
                  <text key={v} x="34" y={y + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                    {v}
                  </text>
                );
              })}
              {/* Curve from recorded points */}
              {localReadings.length > 1 && (
                <path
                  d={localReadings
                    .map((pt, i) => {
                      const rem = Math.max(0, activeVFinal - pt.volume);
                      const x = 40 + (pt.time / 160) * 222;
                      const y = 138 - (rem / 100) * 122;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="2"
                />
              )}
              {localReadings.map((pt) => {
                const rem = Math.max(0, activeVFinal - pt.volume);
                const x = 40 + (pt.time / 160) * 222;
                const y = 138 - (rem / 100) * 122;
                return <circle key={pt.time} cx={x} cy={y} r="2.5" fill="#1D4ED8" />;
              })}
              {/* Interactive tangent line */}
              {localReadings.length >= 4 && (() => {
                const t1 = Math.max(0, tangentTime - 25);
                const t2 = Math.min(160, tangentTime + 25);
                const y1 = Math.min(100, Math.max(0, concAtT - rateAtT * (t1 - tangentTime)));
                const y2 = Math.min(100, Math.max(0, concAtT - rateAtT * (t2 - tangentTime)));
                return (
                  <g>
                    <line
                      x1={40 + (t1 / 160) * 222}
                      y1={138 - (y1 / 100) * 122}
                      x2={40 + (t2 / 160) * 222}
                      y2={138 - (y2 / 100) * 122}
                      stroke="#D97706"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx={40 + (tangentTime / 160) * 222}
                      cy={138 - (concAtT / 100) * 122}
                      r="3.5"
                      fill="#D97706"
                    />
                  </g>
                );
              })()}
              <text x="153" y="165" textAnchor="middle" className="text-[9.5px] fill-slate-600">
                Time t / s
              </text>
            </svg>
            <div className="mt-1">
              <label className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                <span>Move Tangent Position</span>
                <span className="font-mono">t = {tangentTime} s</span>
              </label>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={tangentTime}
                onChange={(e) => setTangentTime(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
          </div>

          {/* Graph 2: Rate (Gradient) vs (Vfinal - Vt) */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-800">Gradient (Rate) vs (Vfinal − Vt)</span>
              <span className="text-[11px] font-mono text-emerald-700">1st Order Proof</span>
            </div>
            <svg viewBox="0 0 280 170" className="w-full h-auto">
              <line x1="42" y1="12" x2="42" y2="138" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="42" y1="138" x2="266" y2="138" stroke="#0F172A" strokeWidth="1.2" />
              {[0, 25, 50, 75, 100].map((v) => {
                const x = 42 + (v / 100) * 220;
                return (
                  <text key={v} x={x} y="152" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">
                    {v}
                  </text>
                );
              })}
              {[0, 1.0, 2.0].map((g) => {
                const y = 138 - (g / 2.5) * 122;
                return (
                  <text key={g} x="36" y={y + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                    {g.toFixed(1)}
                  </text>
                );
              })}
              {localReadings.length >= 6 ? (
                <g>
                  <line
                    x1="42"
                    y1="138"
                    x2={42 + (95 / 100) * 220}
                    y2={138 - ((95 * K_RATE) / 2.5) * 122}
                    stroke="#059669"
                    strokeWidth="1.8"
                  />
                  {fiveTangents.map((pt) => (
                    <circle
                      key={pt.t}
                      cx={42 + (pt.rem / 100) * 220}
                      cy={138 - (pt.grad / 2.5) * 122}
                      r="3.5"
                      fill="#059669"
                    />
                  ))}
                </g>
              ) : (
                <text x="155" y="82" textAnchor="middle" className="text-[10px] fill-slate-400">
                  Run reaction to generate 5 tangents
                </text>
              )}
              <text x="154" y="165" textAnchor="middle" className="text-[9.5px] fill-slate-600">
                (Vfinal − Vt) / cm³ (∝ [HCl])
              </text>
            </svg>
            <p className="text-[11px] text-slate-500 mt-1">
              Straight line through origin confirms rate ∝ [HCl]¹ (first order).
            </p>
          </div>
        </div>
      </div>

      {/* Right Control Deck */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Procedure Controls</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 4: Allow a few seconds for CO₂ saturation before inserting the bung and starting the timer.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <span className="text-xs font-medium text-slate-700">Simulation Speed</span>
          <div className="flex gap-1">
            {([1, 5, 10] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  speed === s ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={autoLog}
            onChange={(e) => setAutoLog(e.target.checked)}
            className="rounded border-slate-300 text-blue-700"
          />
          Auto-record gas syringe reading every 10 s
        </label>

        <div className="space-y-2">
          {stage === 'setup' && (
            <button
              type="button"
              onClick={handleAddAcid}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              1. Pour 10 cm³ of 1.0 M HCl onto Marble Chips
            </button>
          )}

          {stage === 'saturating' && (
            <button
              type="button"
              onClick={handleInsertBungAndStart}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              2. Insert Stopper &amp; Start Timing
            </button>
          )}

          {(stage === 'running' || stage === 'paused') && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStage(stage === 'running' ? 'paused' : 'running')}
                className="flex-1 py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                {stage === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {stage === 'running' ? 'Pause' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={handleManualLog}
                className="py-2.5 px-3.5 rounded-lg border border-blue-600 text-blue-700 bg-blue-50 text-sm font-medium hover:bg-blue-100 flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Log Reading
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveToWorkbook}
              disabled={localReadings.length < 5}
              className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Table to Workbook ({localReadings.length} pts)
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              title="Reset apparatus"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Data Table */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">Live Readings (Vfinal = {activeVFinal.toFixed(1)} cm³)</span>
            <span className="font-mono text-slate-500">Every 10 s</span>
          </div>
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs font-mono tabular-nums">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-1.5 px-2.5 text-left font-medium">t / s</th>
                  <th className="py-1.5 px-2.5 text-right font-medium">Vt / cm³</th>
                  <th className="py-1.5 px-2.5 text-right font-medium">Vfinal − Vt / cm³</th>
                </tr>
              </thead>
              <tbody>
                {localReadings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 font-sans">
                      No readings logged yet.
                    </td>
                  </tr>
                ) : (
                  localReadings.map((pt) => (
                    <tr key={pt.time} className="border-b border-slate-100 text-slate-800">
                      <td className="py-1 px-2.5">{pt.time}</td>
                      <td className="py-1 px-2.5 text-right">{pt.volume.toFixed(1)}</td>
                      <td className="py-1 px-2.5 text-right font-semibold text-blue-800">
                        {Math.max(0, activeVFinal - pt.volume).toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
