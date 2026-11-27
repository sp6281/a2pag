import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Crosshair, CheckCircle2 } from 'lucide-react';
import { TitrationComboId, TitrationRecord } from '../../types/workbook';

interface Lab9Props {
  titrations: Record<TitrationComboId, TitrationRecord>;
  onUpdateTitration: (comboId: TitrationComboId, record: TitrationRecord) => void;
  onMarkLabComplete: () => void;
}

const COMBOS: {
  id: TitrationComboId;
  label: string;
  acidName: string;
  baseName: string;
  strongAcid: boolean;
  strongBase: boolean;
}[] = [
  { id: 'hcl-naoh', label: 'HCl + NaOH', acidName: '1.0 M HCl (strong)', baseName: '1.0 M NaOH (strong)', strongAcid: true, strongBase: true },
  { id: 'hcl-nh3', label: 'HCl + NH₃', acidName: '1.0 M HCl (strong)', baseName: '1.0 M NH₃ (weak)', strongAcid: true, strongBase: false },
  { id: 'ch3cooh-naoh', label: 'CH₃COOH + NaOH', acidName: '1.0 M CH₃COOH (weak)', baseName: '1.0 M NaOH (strong)', strongAcid: false, strongBase: true },
  { id: 'ch3cooh-nh3', label: 'CH₃COOH + NH₃', acidName: '1.0 M CH₃COOH (weak)', baseName: '1.0 M NH₃ (weak)', strongAcid: false, strongBase: false },
];

// Analytical acid-base titration pH solver for 25.0 cm3 of 1.0 M base + V cm3 of 1.0 M acid
function calculateTitrationPH(comboId: TitrationComboId, volAcid: number): number {
  const Va = Math.max(0, volAcid);
  const Vb = 25.0;
  const Vtot = Va + Vb;
  const Ca = 1.0;
  const Cb = 1.0;
  const Kw = 1e-14;
  const Ka = 1.75e-5; // CH3COOH, pKa = 4.76
  const Kb = 1.78e-5; // NH3, pKb = 4.75

  // Solve charge balance using bisection on pH in [0, 14]
  const f = (pH: number): number => {
    const H = Math.pow(10, -pH);
    const OH = Kw / H;
    const cAcid = (Ca * Va) / Vtot;
    const cBase = (Cb * Vb) / Vtot;

    // Positive charges - Negative charges = 0
    let pos = H;
    let neg = OH;

    if (comboId === 'hcl-naoh') {
      pos += cBase; // Na+
      neg += cAcid; // Cl-
    } else if (comboId === 'hcl-nh3') {
      // NH4+ fraction = H / (H + Kw/Kb)
      const KaNH4 = Kw / Kb;
      pos += cBase * (H / (H + KaNH4));
      neg += cAcid; // Cl-
    } else if (comboId === 'ch3cooh-naoh') {
      pos += cBase; // Na+
      neg += cAcid * (Ka / (H + Ka)); // CH3COO-
    } else {
      // Weak acid + weak base
      const KaNH4 = Kw / Kb;
      pos += cBase * (H / (H + KaNH4));
      neg += cAcid * (Ka / (H + Ka));
    }
    return pos - neg;
  };

  let lo = 0.0;
  let hi = 14.0;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Number(((lo + hi) / 2).toFixed(2));
}

function getIndicatorColor(indicator: 'phenolphthalein' | 'methyl-orange', pH: number): { fill: string; label: string } {
  if (indicator === 'phenolphthalein') {
    if (pH >= 10.0) return { fill: '#DB2777', label: 'Deep pink (alkaline)' };
    if (pH >= 8.2) return { fill: '#F472B6', label: 'Pale pink (end point transition)' };
    return { fill: '#F8FAFC', label: 'Colourless (acidic/neutral)' };
  }
  // methyl orange: 3.2 - 4.4
  if (pH >= 4.4) return { fill: '#FACC15', label: 'Yellow (alkaline/neutral)' };
  if (pH >= 3.2) return { fill: '#FB923C', label: 'Orange (end point transition)' };
  return { fill: '#EF4444', label: 'Red (acidic)' };
}

export const Lab9Titration: React.FC<Lab9Props> = ({
  titrations,
  onUpdateTitration,
  onMarkLabComplete,
}) => {
  const [selectedCombo, setSelectedCombo] = useState<TitrationComboId>('hcl-naoh');
  const [volume, setVolume] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [markMode, setMarkMode] = useState<'none' | 'endpoint' | 'equivalence'>('none');

  const record = titrations[selectedCombo];
  const indicator = record.indicator;
  const comboMeta = COMBOS.find((c) => c.id === selectedCombo)!;

  const timerRef = useRef<number | null>(null);

  const completedCombos = COMBOS.filter((c) => titrations[c.id].completed).length;

  useEffect(() => {
    if (completedCombos >= 4) {
      onMarkLabComplete();
    }
  }, [completedCombos, onMarkLabComplete]);

  const currentPH = calculateTitrationPH(selectedCombo, volume);
  const flaskVisual = getIndicatorColor(indicator, currentPH);

  const appendPoint = (newVol: number, currentPoints: { volume: number; pH: number }[]) => {
    const clamped = Math.min(50, Math.max(0, Number(newVol.toFixed(2))));
    const ph = calculateTitrationPH(selectedCombo, clamped);
    const exists = currentPoints.some((p) => Math.abs(p.volume - clamped) < 0.05);
    const nextPts = exists
      ? currentPoints
      : [...currentPoints, { volume: clamped, pH: ph }].sort((a, b) => a.volume - b.volume);
    return { clamped, nextPts };
  };

  useEffect(() => {
    if (!isStreaming) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setVolume((prev) => {
        // Slow down near equivalence point (23 to 27 cm3) for high resolution data logging!
        const step = prev >= 22 && prev <= 28 ? 0.4 : 1.2;
        const next = Math.min(50, Number((prev + step).toFixed(2)));
        const nextPH = calculateTitrationPH(selectedCombo, next);

        const prevRec = titrations[selectedCombo];
        const nextPts = [...prevRec.points, { volume: next, pH: nextPH }].sort((a, b) => a.volume - b.volume);
        onUpdateTitration(selectedCombo, {
          ...prevRec,
          points: nextPts,
          completed: next >= 45 || prevRec.completed,
        });

        if (next >= 50) {
          setIsStreaming(false);
        }
        return next;
      });
    }, 90);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isStreaming, selectedCombo, titrations, onUpdateTitration]);

  const handleStepAdd = (delta: number) => {
    setIsStreaming(false);
    const initialPts =
      record.points.length === 0
        ? [{ volume: 0, pH: calculateTitrationPH(selectedCombo, 0) }]
        : record.points;
    const { clamped, nextPts } = appendPoint(volume + delta, initialPts);
    setVolume(clamped);
    onUpdateTitration(selectedCombo, {
      ...record,
      points: nextPts,
      completed: clamped >= 45 || record.completed,
    });
  };

  const handleResetCombo = () => {
    setIsStreaming(false);
    setVolume(0);
    onUpdateTitration(selectedCombo, {
      ...record,
      points: [{ volume: 0, pH: calculateTitrationPH(selectedCombo, 0) }],
      endPointMark: null,
      equivalenceMark: null,
      completed: false,
    });
  };

  const handleIndicatorChange = (ind: 'phenolphthalein' | 'methyl-orange') => {
    onUpdateTitration(selectedCombo, {
      ...record,
      indicator: ind,
    });
  };

  const handleSelectCombo = (id: TitrationComboId) => {
    setIsStreaming(false);
    setSelectedCombo(id);
    const pts = titrations[id].points;
    setVolume(pts.length > 0 ? pts[pts.length - 1].volume : 0);
  };

  const handlePlotClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (markMode === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * 520;
    const sy = ((e.clientY - rect.top) / rect.height) * 260;
    const pad = { left: 52, right: 20, top: 18, bottom: 42 };
    const pw = 520 - pad.left - pad.right;
    const ph = 260 - pad.top - pad.bottom;
    const vVal = Math.min(50, Math.max(0, Number((((sx - pad.left) / pw) * 50).toFixed(1))));
    const pVal = Math.min(14, Math.max(0, Number((14 - ((sy - pad.top) / ph) * 14).toFixed(2))));

    if (markMode === 'endpoint') {
      onUpdateTitration(selectedCombo, { ...record, endPointMark: { volume: vVal, pH: pVal } });
    } else {
      onUpdateTitration(selectedCombo, { ...record, equivalenceMark: { volume: vVal, pH: pVal } });
    }
    setMarkMode('none');
  };

  // Chart dimensions
  const w = 520;
  const h = 260;
  const pad = { left: 52, right: 20, top: 18, bottom: 42 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;
  const xScale = (v: number) => pad.left + (v / 50) * pw;
  const yScale = (p: number) => pad.top + ((14 - p) / 14) * ph;

  // Burette liquid height (0 cm3 added = full at y=28; 50 cm3 added = empty at y=168)
  const buretteLiquidTop = 28 + (volume / 50) * 140;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Interactive Stage */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              pH Titration Data Logger — {comboMeta.label}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Burette: {comboMeta.acidName} · Flask: 25.0 cm³ {comboMeta.baseName}
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md">
              pH {currentPH.toFixed(2)}
            </div>
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-md font-semibold">
              Vol = {volume.toFixed(1)} cm³
            </div>
          </div>
        </div>

        {/* Apparatus + Indicator readout side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <div className="sm:col-span-5">
            <svg viewBox="0 0 240 310" className="w-full max-w-[220px] mx-auto h-auto">
              {/* Retort stand */}
              <rect x="22" y="286" width="196" height="10" rx="2" fill="#475569" />
              <rect x="44" y="18" width="7" height="270" fill="#64748B" />
              {/* Burette clamp */}
              <rect x="51" y="74" width="65" height="9" rx="2" fill="#334155" />

              {/* Burette tube */}
              <rect x="114" y="22" width="16" height="156" fill="#FFFFFF" stroke="#334155" strokeWidth="1.6" />
              {/* Acid inside burette */}
              <rect x="115.5" y={buretteLiquidTop} width="13" height={Math.max(0, 177 - buretteLiquidTop)} fill="#E0F2FE" />
              {/* Burette scale */}
              {[0, 10, 20, 30, 40, 50].map((v) => {
                const y = 28 + (v / 50) * 140;
                return (
                  <g key={v}>
                    <line x1="114" y1={y} x2="120" y2={y} stroke="#475569" strokeWidth="1" />
                    <text x="135" y={y + 3} className="text-[8.5px] fill-slate-500 font-mono">
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Tap / Stopcock */}
              <rect x="110" y="180" width="24" height="6" rx="2" fill={isStreaming ? '#2563EB' : '#475569'} />
              <polygon points="118,178 126,178 123,198 121,198" fill="#CBD5E1" stroke="#334155" strokeWidth="1.2" />

              {/* Falling stream when active */}
              {isStreaming && (
                <line x1="122" y1="198" x2="122" y2="258" stroke="#60A5FA" strokeWidth="2" strokeDasharray="4 4" />
              )}

              {/* White Tile */}
              <rect x="74" y="280" width="98" height="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />

              {/* 250 cm3 Conical Flask */}
              <path d="M 108 214 L 108 232 L 82 276 Q 80 280 86 280 L 158 280 Q 164 280 162 276 L 136 232 L 136 214 Z" fill="#FFFFFF" fillOpacity="0.82" stroke="#334155" strokeWidth="1.8" />
              {/* Coloured Solution in Flask */}
              <path d="M 94 256 L 150 256 L 160 276 Q 161 278 156 278 L 88 278 Q 83 278 84 276 Z" fill={flaskVisual.fill} fillOpacity="0.88" className="transition-colors duration-200" />

              {/* Delicate Glass pH Probe dipping into flask */}
              <line x1="146" y1="268" x2="174" y2="188" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
              <circle cx="145" cy="270" r="3" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="1" />
              <path d="M 174 188 C 194 150, 214 140, 224 110" fill="none" stroke="#334155" strokeWidth="2" />
              <rect x="176" y="72" width="56" height="38" rx="4" fill="#0F172A" />
              <text x="204" y="95" textAnchor="middle" className="text-[12px] fill-emerald-400 font-mono font-bold">
                {currentPH.toFixed(2)}
              </text>
              <text x="204" y="105" textAnchor="middle" className="text-[7px] fill-slate-400 font-mono">
                pH PROBE
              </text>
            </svg>
          </div>

          <div className="sm:col-span-7 space-y-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-slate-800 mb-1">Indicator Colour Observation</div>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md border border-slate-300 shrink-0 transition-colors"
                  style={{ backgroundColor: flaskVisual.fill }}
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-900">{flaskVisual.label}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {indicator === 'phenolphthalein'
                      ? 'Phenolphthalein range: pH 8.2 – 10.0 (End point 9.3)'
                      : 'Methyl orange range: pH 3.2 – 4.4 (End point 3.7)'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-800">Mark Curve Points (Manual p. 25)</div>
              <p className="text-[11px] text-slate-500">
                Select a marker below, then click directly on the pH graph to place your black × (end point) and red × (equivalence point).
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMarkMode(markMode === 'endpoint' ? 'none' : 'endpoint')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors ${
                    markMode === 'endpoint'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Place Black × (End Point)
                </button>
                <button
                  type="button"
                  onClick={() => setMarkMode(markMode === 'equivalence' ? 'none' : 'equivalence')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors ${
                    markMode === 'equivalence'
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Place Red × (Equivalence)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Data Logger pH Curve */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-800">
              Live Data Logger Curve: pH vs Volume of Acid Added
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {markMode !== 'none'
                ? `Click graph to mark ${markMode === 'endpoint' ? 'Black × (End Point)' : 'Red × (Equivalence)'}`
                : 'Shaded band = selected indicator range'}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            onClick={handlePlotClick}
            className={`w-full h-auto bg-white border border-slate-200 rounded-lg select-none ${
              markMode !== 'none' ? 'cursor-crosshair ring-2 ring-blue-400' : ''
            }`}
          >
            {/* Indicator pH range band */}
            {indicator === 'phenolphthalein' ? (
              <rect
                x={pad.left}
                y={yScale(10.0)}
                width={pw}
                height={yScale(8.2) - yScale(10.0)}
                fill="#FCE7F3"
                fillOpacity="0.85"
              />
            ) : (
              <rect
                x={pad.left}
                y={yScale(4.4)}
                width={pw}
                height={yScale(3.2) - yScale(4.4)}
                fill="#FFEDD5"
                fillOpacity="0.9"
              />
            )}

            {/* Gridlines */}
            {[0, 10, 20, 25, 30, 40, 50].map((v) => (
              <g key={v}>
                <line
                  x1={xScale(v)}
                  y1={pad.top}
                  x2={xScale(v)}
                  y2={pad.top + ph}
                  stroke={v === 25 ? '#CBD5E1' : '#F1F5F9'}
                  strokeDasharray={v === 25 ? '3 3' : undefined}
                  strokeWidth="1"
                />
                <text x={xScale(v)} y={pad.top + ph + 15} textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">
                  {v}
                </text>
              </g>
            ))}
            {[0, 2, 4, 6, 7, 8, 10, 12, 14].map((p) => (
              <g key={p}>
                <line x1={pad.left} y1={yScale(p)} x2={pad.left + pw} y2={yScale(p)} stroke="#F1F5F9" strokeWidth="1" />
                <text x={pad.left - 8} y={yScale(p) + 3} textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
                  {p}
                </text>
              </g>
            ))}

            {/* Axes */}
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ph} stroke="#0F172A" strokeWidth="1.4" />
            <line x1={pad.left} y1={pad.top + ph} x2={pad.left + pw} y2={pad.top + ph} stroke="#0F172A" strokeWidth="1.4" />

            {/* Recorded Curve */}
            {record.points.length > 1 && (
              <path
                d={record.points
                  .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xScale(pt.volume).toFixed(1)} ${yScale(pt.pH).toFixed(1)}`)
                  .join(' ')}
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="2.2"
              />
            )}

            {/* Current live point */}
            <circle cx={xScale(volume)} cy={yScale(currentPH)} r="4" fill="#1D4ED8" />

            {/* Black × End Point Mark */}
            {record.endPointMark && (
              <g transform={`translate(${xScale(record.endPointMark.volume)}, ${yScale(record.endPointMark.pH)})`}>
                <line x1="-5" y1="-5" x2="5" y2="5" stroke="#0F172A" strokeWidth="2.4" />
                <line x1="5" y1="-5" x2="-5" y2="5" stroke="#0F172A" strokeWidth="2.4" />
                <text x="8" y="-6" className="text-[9.5px] fill-slate-900 font-mono font-semibold">
                  End ({record.endPointMark.volume} cm³)
                </text>
              </g>
            )}

            {/* Red × Equivalence Point Mark */}
            {record.equivalenceMark && (
              <g transform={`translate(${xScale(record.equivalenceMark.volume)}, ${yScale(record.equivalenceMark.pH)})`}>
                <line x1="-5" y1="-5" x2="5" y2="5" stroke="#DC2626" strokeWidth="2.4" />
                <line x1="5" y1="-5" x2="-5" y2="5" stroke="#DC2626" strokeWidth="2.4" />
                <text x="8" y="12" className="text-[9.5px] fill-red-700 font-mono font-semibold">
                  Eq ({record.equivalenceMark.volume} cm³, pH {record.equivalenceMark.pH})
                </text>
              </g>
            )}

            <text x={pad.left + pw / 2} y={h - 6} textAnchor="middle" className="text-[11px] fill-slate-700 font-medium">
              Volume of acid added / cm³
            </text>
            <text x="16" y={pad.top + ph / 2} textAnchor="middle" transform={`rotate(-90 16 ${pad.top + ph / 2})`} className="text-[11px] fill-slate-700 font-medium">
              pH
            </text>
          </svg>
        </div>
      </div>

      {/* Right Control Deck */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">1. Select Acid–Base Combination ({completedCombos}/4)</h4>
          <div className="grid grid-cols-1 gap-1.5">
            {COMBOS.map((c) => {
              const rec = titrations[c.id];
              const active = c.id === selectedCombo;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCombo(c.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left text-xs transition-colors ${
                    active
                      ? 'bg-blue-50 border-blue-600 text-slate-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>{c.label}</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      {c.strongAcid ? 'Strong acid' : 'Weak acid'} + {c.strongBase ? 'Strong base' : 'Weak base'}
                    </div>
                  </div>
                  {rec.completed ? (
                    <span className="text-emerald-700 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Logged
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono">Pending</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">2. Choose Indicator (3–4 Drops)</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleIndicatorChange('phenolphthalein')}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                indicator === 'phenolphthalein'
                  ? 'bg-pink-50 border-pink-600 text-pink-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Phenolphthalein (8.2–10.0)
            </button>
            <button
              type="button"
              onClick={() => handleIndicatorChange('methyl-orange')}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                indicator === 'methyl-orange'
                  ? 'bg-orange-50 border-orange-500 text-orange-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Methyl Orange (3.2–4.4)
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <h4 className="text-sm font-semibold text-slate-900">3. Burette Controls</h4>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={volume >= 50}
              onClick={() => {
                if (record.points.length === 0) {
                  onUpdateTitration(selectedCombo, {
                    ...record,
                    points: [{ volume: 0, pH: calculateTitrationPH(selectedCombo, 0) }],
                  });
                }
                setIsStreaming((v) => !v);
              }}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-45 flex items-center justify-center gap-2 transition-colors"
            >
              {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isStreaming ? 'Stop Stream' : 'Open Stopcock (Auto-Log)'}
            </button>
            <button
              type="button"
              onClick={handleResetCombo}
              className="py-2.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              title="Reset current titration"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleStepAdd(0.1)}
              className="py-2 text-xs font-mono font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              +0.1 cm³ (Drop)
            </button>
            <button
              type="button"
              onClick={() => handleStepAdd(1.0)}
              className="py-2 text-xs font-mono font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              +1.0 cm³
            </button>
            <button
              type="button"
              onClick={() => handleStepAdd(5.0)}
              className="py-2 text-xs font-mono font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              +5.0 cm³
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
