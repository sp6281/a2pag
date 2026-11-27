import React, { useState } from 'react';

interface ExamGraphProps {
  type: 'cp7-fig1' | 'cp7-fig2' | 'cp9-nh4cl' | 'cp12c-structures';
  plottedPoints?: { t: number; c: number }[];
  onTogglePlotPoint?: (pt: { t: number; c: number }) => void;
}

const CP7_TABLE_DATA = [
  { t: 0, c: 0.5, given: true },
  { t: 100, c: 0.44, given: true },
  { t: 200, c: 0.39, given: true },
  { t: 400, c: 0.31, given: false },
  { t: 600, c: 0.24, given: false },
  { t: 800, c: 0.19, given: false },
  { t: 1000, c: 0.15, given: false },
  { t: 1200, c: 0.12, given: false },
];

export const ExamGraphs: React.FC<ExamGraphProps> = ({
  type,
  plottedPoints = [],
  onTogglePlotPoint,
}) => {
  const [showCurve, setShowCurve] = useState(false);
  const [showTangent, setShowTangent] = useState(false);

  if (type === 'cp7-fig1') {
    // Straight line from (0, 0.50) to (415, 0.00) -> gradient = -0.00120 mol dm-3 s-1
    const w = 440;
    const h = 270;
    const pad = { top: 20, right: 24, bottom: 44, left: 60 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;
    const xScale = (t: number) => pad.left + (t / 450) * pw;
    const yScale = (c: number) => pad.top + ((0.5 - c) / 0.5) * ph;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 my-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Figure 1 — [H⁺] vs Time (Excess H₂O₂ and I⁻)</span>
          <span className="text-xs font-mono text-slate-500">Zero-order test graph</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[480px] h-auto">
          {/* Grid */}
          {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450].map((t) => (
            <g key={t}>
              <line x1={xScale(t)} y1={pad.top} x2={xScale(t)} y2={pad.top + ph} stroke="#E2E8F0" strokeWidth="1" />
              <text x={xScale(t)} y={pad.top + ph + 16} textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">
                {t}
              </text>
            </g>
          ))}
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((c) => (
            <g key={c}>
              <line x1={pad.left} y1={yScale(c)} x2={pad.left + pw} y2={yScale(c)} stroke="#E2E8F0" strokeWidth="1" />
              <text x={pad.left - 8} y={yScale(c) + 3} textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
                {c.toFixed(1)}
              </text>
            </g>
          ))}
          {/* Axes */}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ph} stroke="#0F172A" strokeWidth="1.5" />
          <line x1={pad.left} y1={pad.top + ph} x2={pad.left + pw} y2={pad.top + ph} stroke="#0F172A" strokeWidth="1.5" />
          {/* Data line: (0, 0.5) to (415, 0) */}
          <line x1={xScale(0)} y1={yScale(0.5)} x2={xScale(415)} y2={yScale(0)} stroke="#1D4ED8" strokeWidth="2.2" />
          {/* Labels */}
          <text x={pad.left + pw / 2} y={h - 6} textAnchor="middle" className="text-[11px] fill-slate-700 font-medium">
            time / s
          </text>
          <text
            x={16}
            y={pad.top + ph / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${pad.top + ph / 2})`}
            className="text-[11px] fill-slate-700 font-medium"
          >
            [H⁺] / mol dm⁻³
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'cp7-fig2') {
    const w = 520;
    const h = 300;
    const pad = { top: 20, right: 20, bottom: 44, left: 60 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;
    const xScale = (t: number) => pad.left + (t / 1200) * pw;
    const yScale = (c: number) => pad.top + ((0.5 - c) / 0.5) * ph;

    const handleGridClick = (e: React.MouseEvent<SVGSVGElement>) => {
      if (!onTogglePlotPoint) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * w;
      const sy = ((e.clientY - rect.top) / rect.height) * h;
      const tVal = Math.round((((sx - pad.left) / pw) * 1200) / 50) * 50;
      const cVal = Math.round(((0.5 - ((sy - pad.top) / ph) * 0.5)) * 100) / 100;
      if (tVal >= 0 && tVal <= 1200 && cVal >= 0 && cVal <= 0.5) {
        onTogglePlotPoint({ t: tVal, c: cVal });
      }
    };

    // Smooth curve through all 8 exact points
    const smoothPath = CP7_TABLE_DATA.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.t).toFixed(1)} ${yScale(d.c).toFixed(1)}`).join(' ');

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 my-3 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono tabular-nums border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                <th className="py-1.5 px-2 text-left font-medium">Time / s</th>
                {CP7_TABLE_DATA.map((d) => (
                  <th key={d.t} className="py-1.5 px-2 text-right font-medium">{d.t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 text-slate-900">
                <td className="py-1.5 px-2 font-medium">[H⁺] / mol dm⁻³</td>
                {CP7_TABLE_DATA.map((d) => (
                  <td key={d.t} className="py-1.5 px-2 text-right">{d.c.toFixed(2)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-600">
            Click on Figure 2 grid to plot the remaining 5 points ({plottedPoints.length} plotted).
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCurve((v) => !v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                showCurve
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {showCurve ? 'Hide Best-Fit Curve' : 'Show Best-Fit Curve'}
            </button>
            <button
              type="button"
              onClick={() => setShowTangent((v) => !v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                showTangent
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {showTangent ? 'Hide Tangent at 0.35' : 'Show Tangent at [H⁺]=0.35'}
            </button>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${w} ${h}`}
          onClick={handleGridClick}
          className="w-full max-w-[560px] h-auto cursor-crosshair select-none"
        >
          {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200].map((t) => (
            <g key={t}>
              <line x1={xScale(t)} y1={pad.top} x2={xScale(t)} y2={pad.top + ph} stroke="#E2E8F0" strokeWidth="1" />
              <text x={xScale(t)} y={pad.top + ph + 16} textAnchor="middle" className="text-[9.5px] fill-slate-500 font-mono">
                {t}
              </text>
            </g>
          ))}
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((c) => (
            <g key={c}>
              <line x1={pad.left} y1={yScale(c)} x2={pad.left + pw} y2={yScale(c)} stroke="#E2E8F0" strokeWidth="1" />
              <text x={pad.left - 8} y={yScale(c) + 3} textAnchor="end" className="text-[9.5px] fill-slate-500 font-mono">
                {c.toFixed(1)}
              </text>
            </g>
          ))}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ph} stroke="#0F172A" strokeWidth="1.5" />
          <line x1={pad.left} y1={pad.top + ph} x2={pad.left + pw} y2={pad.top + ph} stroke="#0F172A" strokeWidth="1.5" />

          {/* First 3 pre-plotted points */}
          {CP7_TABLE_DATA.filter((d) => d.given).map((d) => (
            <g key={d.t} transform={`translate(${xScale(d.t)}, ${yScale(d.c)})`}>
              <line x1="-4" y1="-4" x2="4" y2="4" stroke="#0F172A" strokeWidth="1.8" />
              <line x1="4" y1="-4" x2="-4" y2="4" stroke="#0F172A" strokeWidth="1.8" />
            </g>
          ))}

          {/* Student plotted points */}
          {plottedPoints.map((pt, idx) => (
            <g key={`${pt.t}-${pt.c}-${idx}`} transform={`translate(${xScale(pt.t)}, ${yScale(pt.c)})`}>
              <line x1="-4.5" y1="-4.5" x2="4.5" y2="4.5" stroke="#1D4ED8" strokeWidth="2" />
              <line x1="4.5" y1="-4.5" x2="-4.5" y2="4.5" stroke="#1D4ED8" strokeWidth="2" />
            </g>
          ))}

          {showCurve && (
            <path d={smoothPath} fill="none" stroke="#1D4ED8" strokeWidth="2" strokeDasharray="4 2" />
          )}

          {showTangent && (
            <g>
              {/* Tangent at [H+]=0.35 (t ≈ 295 s), slope = -4.09e-4 => from (140, 0.413) to (580, 0.233) */}
              <line
                x1={xScale(140)}
                y1={yScale(0.413)}
                x2={xScale(580)}
                y2={yScale(0.233)}
                stroke="#D97706"
                strokeWidth="2"
              />
              {/* Triangle */}
              <line
                x1={xScale(140)}
                y1={yScale(0.413)}
                x2={xScale(140)}
                y2={yScale(0.233)}
                stroke="#D97706"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <line
                x1={xScale(140)}
                y1={yScale(0.233)}
                x2={xScale(580)}
                y2={yScale(0.233)}
                stroke="#D97706"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle cx={xScale(295)} cy={yScale(0.35)} r="4" fill="#D97706" />
              <text x={xScale(360)} y={yScale(0.21)} textAnchor="middle" className="text-[10px] fill-amber-700 font-mono">
                Δt = 440 s, Δ[H⁺] = 0.18
              </text>
            </g>
          )}

          <text x={pad.left + pw / 2} y={h - 6} textAnchor="middle" className="text-[11px] fill-slate-700 font-medium">
            time / s
          </text>
          <text
            x={16}
            y={pad.top + ph / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${pad.top + ph / 2})`}
            className="text-[11px] fill-slate-700 font-medium"
          >
            [H⁺] / mol dm⁻³
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'cp9-nh4cl') {
    // Ammonium chloride + NaOH curve from page 27
    const pts = [
      { v: 0, ph: 4.6 },
      { v: 0.5, ph: 7.2 },
      { v: 1, ph: 8.3 },
      { v: 2, ph: 8.6 },
      { v: 3, ph: 8.9 },
      { v: 4, ph: 9.1 },
      { v: 5, ph: 9.25 },
      { v: 6, ph: 9.4 },
      { v: 7, ph: 9.6 },
      { v: 8, ph: 9.9 },
      { v: 9, ph: 10.2 },
      { v: 10, ph: 11.8 },
      { v: 10.5, ph: 13.0 },
      { v: 11, ph: 13.1 },
      { v: 12, ph: 13.2 },
    ];
    const w = 480;
    const h = 280;
    const pad = { top: 20, right: 20, bottom: 44, left: 52 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;
    const xScale = (v: number) => pad.left + (v / 13) * pw;
    const yScale = (p: number) => pad.top + ((14 - p) / 10) * ph;
    const dPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.v).toFixed(1)} ${yScale(p.ph).toFixed(1)}`).join(' ');

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 my-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Titration of NH₄Cl(aq) with NaOH(aq) (Page 27)</span>
          <span className="text-xs font-mono text-slate-500">Initial pH at 0 cm³ = 4.6 · End point pH = 11.8</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[500px] h-auto">
          {Array.from({ length: 14 }, (_, i) => i).map((v) => (
            <g key={v}>
              <line x1={xScale(v)} y1={pad.top} x2={xScale(v)} y2={pad.top + ph} stroke="#E2E8F0" strokeWidth="1" />
              <text x={xScale(v)} y={pad.top + ph + 16} textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">
                {v}
              </text>
            </g>
          ))}
          {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((p) => (
            <g key={p}>
              <line x1={pad.left} y1={yScale(p)} x2={pad.left + pw} y2={yScale(p)} stroke="#E2E8F0" strokeWidth="1" />
              <text x={pad.left - 8} y={yScale(p) + 3} textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
                {p}
              </text>
            </g>
          ))}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ph} stroke="#0F172A" strokeWidth="1.5" />
          <line x1={pad.left} y1={pad.top + ph} x2={pad.left + pw} y2={pad.top + ph} stroke="#0F172A" strokeWidth="1.5" />
          <path d={dPath} fill="none" stroke="#1D4ED8" strokeWidth="2.2" />
          {pts.map((p) => (
            <circle key={p.v} cx={xScale(p.v)} cy={yScale(p.ph)} r="2.6" fill="#0F172A" />
          ))}
          <text x={pad.left + pw / 2} y={h - 6} textAnchor="middle" className="text-[11px] fill-slate-700 font-medium">
            Volume of NaOH added / cm³
          </text>
          <text
            x={16}
            y={pad.top + ph / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${pad.top + ph / 2})`}
            className="text-[11px] fill-slate-700 font-medium"
          >
            pH
          </text>
        </svg>
      </div>
    );
  }

  // cp12c-structures: Silica OH surface, Naphthalene, Benzenecarboxylic acid
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 my-3 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 180 95" className="w-40 h-auto">
          <rect x="16" y="64" width="148" height="22" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
          <text x="90" y="79" textAnchor="middle" className="text-[10px] fill-slate-800 font-medium">main body of silica</text>
          {[36, 72, 108, 144].map((x) => (
            <g key={x}>
              <line x1={x} y1="64" x2={x} y2="48" stroke="#334155" strokeWidth="1.2" />
              <text x={x} y="44" textAnchor="middle" className="text-[10px] fill-slate-800 font-mono">Si</text>
              <line x1={x} y1="33" x2={x} y2="20" stroke="#334155" strokeWidth="1.2" />
              <text x={x} y="16" textAnchor="middle" className="text-[10px] fill-blue-700 font-mono font-semibold">OH</text>
            </g>
          ))}
        </svg>
        <span className="text-xs text-slate-600 mt-1">Polar SiO₂ surface (–OH)</span>
      </div>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 150 90" className="w-36 h-auto">
          {/* Fused benzene rings */}
          <polygon points="40,22 65,10 90,22 90,52 65,64 40,52" fill="none" stroke="#0F172A" strokeWidth="1.6" />
          <circle cx="65" cy="37" r="14" fill="none" stroke="#0F172A" strokeWidth="1.2" />
          <polygon points="90,22 115,10 140,22 140,52 115,64 90,52" fill="none" stroke="#0F172A" strokeWidth="1.6" />
          <circle cx="115" cy="37" r="14" fill="none" stroke="#0F172A" strokeWidth="1.2" />
        </svg>
        <span className="text-xs font-medium text-slate-800">Naphthalene, C₁₀H₈</span>
      </div>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 150 90" className="w-36 h-auto">
          <polygon points="30,24 55,12 80,24 80,54 55,66 30,54" fill="none" stroke="#0F172A" strokeWidth="1.6" />
          <circle cx="55" cy="39" r="14" fill="none" stroke="#0F172A" strokeWidth="1.2" />
          <line x1="80" y1="24" x2="100" y2="14" stroke="#0F172A" strokeWidth="1.6" />
          <text x="103" y="18" className="text-[11px] fill-blue-700 font-mono font-semibold">COOH</text>
        </svg>
        <span className="text-xs font-medium text-slate-800">Benzenecarboxylic acid</span>
      </div>
    </div>
  );
};
