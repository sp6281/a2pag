import React, { useEffect, useState } from 'react';
import { Sun, Ruler, CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react';
import { MedicinesTlcData } from '../../types/workbook';

interface Lab12cProps {
  data: MedicinesTlcData;
  onUpdate: (patch: Partial<MedicinesTlcData>) => void;
  onMarkLabComplete: () => void;
}

// Matching Page 46 official markscheme values (Solvent front = 50 mm):
// Aspirin A = 25 mm (Rf 0.50)
// Caffeine B = 40 mm (Rf 0.80)
// Paracetamol C = 30 mm (Rf 0.60)
// Ibuprofen D = 35 mm (Rf 0.70)
const FRONT_MM = 50;
const STANDARDS = [
  { code: 'A', name: 'Aspirin', mm: 25, rf: 0.50 },
  { code: 'B', name: 'Caffeine', mm: 40, rf: 0.80 },
  { code: 'C', name: 'Paracetamol', mm: 30, rf: 0.60 },
  { code: 'D', name: 'Ibuprofen', mm: 35, rf: 0.70 },
];

const REMEDY_PRESETS: Record<
  MedicinesTlcData['remedyPreset'],
  { label: string; spotsMm: number[]; names: string }
> = {
  'aspirin-paracetamol': {
    label: 'Remedy 1 (Manual Markscheme Example)',
    spotsMm: [25, 30],
    names: 'Aspirin + Paracetamol',
  },
  'paracetamol-caffeine': {
    label: 'Remedy 2 (Extra-Strength Tablet)',
    spotsMm: [30, 40],
    names: 'Paracetamol + Caffeine',
  },
  'aspirin-caffeine': {
    label: 'Remedy 3 (Migraine Relief Tablet)',
    spotsMm: [25, 40],
    names: 'Aspirin + Caffeine',
  },
};

export const Lab12cMedicinesTLC: React.FC<Lab12cProps> = ({
  data,
  onUpdate,
  onMarkLabComplete,
}) => {
  const [glovesOn, setGlovesOn] = useState(true);
  const [spotted, setSpotted] = useState(data.plateDeveloped);
  const [chamberReady, setChamberReady] = useState(data.plateDeveloped);
  const [progress, setProgress] = useState(data.plateDeveloped ? 100 : 0);
  const [running, setRunning] = useState(false);
  const [uvOn, setUvOn] = useState(data.uvViewed);
  const [circled, setCircled] = useState(data.uvViewed);
  const [rulerMm, setRulerMm] = useState<number>(25);

  const activeRemedy = REMEDY_PRESETS[data.remedyPreset];

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setRunning(false);
          onUpdate({
            plateDeveloped: true,
            solventFrontMm: FRONT_MM,
          });
          return 100;
        }
        return p + 5;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [running, onUpdate]);

  const handleInspectAndRecord = () => {
    setUvOn(true);
    setCircled(true);
    onUpdate({
      plateDeveloped: true,
      uvViewed: true,
      solventFrontMm: FRONT_MM,
      aspirinMm: 25,
      caffeineMm: 40,
      paracetamolMm: 30,
      ibuprofenMm: 35,
      remedySpotsMm: activeRemedy.spotsMm.map((m) => `${m} mm`).join(', '),
    });
    onMarkLabComplete();
  };

  const handleReset = () => {
    setSpotted(false);
    setChamberReady(false);
    setProgress(0);
    setRunning(false);
    setUvOn(false);
    setCircled(false);
  };

  // SVG scale: baseline (0 mm) at y=236, solvent front (50 mm) at y=36 => 4 px per mm
  const mmToY = (mm: number) => 236 - mm * 4;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Interactive TLC Plate & UV Lamp Stage */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Silica Gel TLC Chamber &amp; 254 nm UV Inspection
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mobile phase: 60% hexane – 40% ethyl ethanoate · Standards A–D vs OTC Remedy E
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Plate
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
          <svg viewBox="0 0 560 280" className="w-full h-auto">
            {/* Beaker + Watch glass outline when chamber ready & not under UV */}
            {chamberReady && !uvOn && (
              <g>
                <path d="M 48 22 L 48 264 Q 48 272 60 272 L 396 272 Q 408 272 408 264 L 408 22" fill="none" stroke="#94A3B8" strokeWidth="2" />
                {/* Inverted watch glass lid */}
                <path d="M 40 22 Q 228 4 416 22" fill="none" stroke="#64748B" strokeWidth="2.5" />
                {/* Solvent pool below baseline (y=252 to 270) */}
                <rect x="50" y="252" width="356" height="18" fill="#E0F2FE" fillOpacity="0.8" />
                {/* Solvent-soaked filter paper lining */}
                <rect x="52" y="32" width="12" height="236" fill="#F1F5F9" stroke="#CBD5E1" />
                <text x="68" y="266" className="text-[8.5px] fill-sky-800 font-mono">
                  60:40 hexane–ethyl ethanoate (below baseline)
                </text>
              </g>
            )}

            {/* Silica TLC Plate */}
            <rect
              x="76"
              y="26"
              width="310"
              height="226"
              rx="3"
              fill={uvOn ? '#4ADE80' : '#FFFFFF'}
              stroke="#334155"
              strokeWidth="2"
              className="transition-colors duration-300"
            />

            {/* Solvent rise */}
            {progress > 0 && !uvOn && (
              <rect
                x="77"
                y={236 - (progress / 100) * 200}
                width="308"
                height={(progress / 100) * 200 + 15}
                fill="#EFF6FF"
                fillOpacity="0.6"
              />
            )}

            {/* Pencil Baseline (0 mm, y=236) */}
            <line x1="82" y1="236" x2="380" y2="236" stroke="#334155" strokeWidth="1.1" strokeDasharray="3 2" />

            {/* Solvent Front (50 mm, y=36) */}
            {progress > 0 && (
              <line
                x1="77"
                y1={236 - (progress / 100) * 200}
                x2="385"
                y2={236 - (progress / 100) * 200}
                stroke={uvOn ? '#14532D' : '#0284C7'}
                strokeWidth="1.4"
                strokeDasharray="5 3"
              />
            )}

            {/* 5 Lanes: A, B, C, D, E */}
            {['A', 'B', 'C', 'D', 'E'].map((code, i) => {
              const x = 112 + i * 58;
              return (
                <g key={code}>
                  <text x={x} y="48" textAnchor="middle" className="text-[11px] fill-slate-900 font-mono font-bold">
                    {code}
                  </text>
                  {/* Origin cross */}
                  <line x1={x - 3} y1="233" x2={x + 3} y2="239" stroke="#475569" strokeWidth="1" />
                  <line x1={x + 3} y1="233" x2={x - 3} y2="239" stroke="#475569" strokeWidth="1" />
                  {spotted && progress === 0 && (
                    <circle cx={x} cy="236" r="3" fill="#64748B" />
                  )}
                </g>
              );
            })}

            {/* UV-absorbing dark spots (visible under UV or once circled in pencil) */}
            {progress === 100 && (uvOn || circled) && (
              <g>
                {STANDARDS.map((st, i) => {
                  const x = 112 + i * 58;
                  const y = mmToY(st.mm);
                  return (
                    <g key={st.code}>
                      {uvOn && <circle cx={x} cy={y} r="6.5" fill="#14532D" fillOpacity="0.88" />}
                      {circled && (
                        <circle cx={x} cy={y} r="9" fill="none" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="2 2" />
                      )}
                    </g>
                  );
                })}
                {/* Lane E: OTC Pain Remedy spots */}
                {activeRemedy.spotsMm.map((mm) => {
                  const x = 112 + 4 * 58;
                  const y = mmToY(mm);
                  return (
                    <g key={mm}>
                      {uvOn && <circle cx={x} cy={y} r="6.5" fill="#14532D" fillOpacity="0.88" />}
                      {circled && (
                        <circle cx={x} cy={y} r="9" fill="none" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="2 2" />
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Millimetre Ruler (0 to 50 mm) */}
            <g>
              <rect x="420" y="28" width="46" height="218" rx="3" fill="#FEFCE8" stroke="#CA8A04" strokeWidth="1.2" />
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((mm) => {
                const y = mmToY(mm);
                return (
                  <g key={mm}>
                    <line x1="420" y1={y} x2={mm % 10 === 0 ? 436 : 430} y2={y} stroke="#854D0E" strokeWidth="1" />
                    {mm % 10 === 0 && (
                      <text x="440" y={y + 3} className="text-[8.5px] fill-amber-900 font-mono">
                        {mm}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* Red movable measurement hairline */}
              <line
                x1="76"
                y1={mmToY(rulerMm)}
                x2="466"
                y2={mmToY(rulerMm)}
                stroke="#DC2626"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />
              <rect x="472" y={mmToY(rulerMm) - 10} width="82" height="20" rx="3" fill="#DC2626" />
              <text x="513" y={mmToY(rulerMm) + 3} textAnchor="middle" className="text-[9.5px] fill-white font-mono font-semibold">
                {rulerMm} mm · Rf {(rulerMm / 50).toFixed(2)}
              </text>
            </g>
          </svg>
        </div>

        {/* Ruler control */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
          <label className="flex items-center justify-between text-xs text-amber-950 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-amber-700" />
              Measure Distance from Pencil Baseline (Solvent Front = 50 mm)
            </span>
            <span className="font-mono font-semibold">
              {rulerMm} mm → Rf = {(rulerMm / 50).toFixed(2)}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={rulerMm}
            onChange={(e) => setRulerMm(Number(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>
      </div>

      {/* Right Control Deck */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Unknown Over-the-Counter Pain Remedy (Lane E)
          </label>
          <select
            value={data.remedyPreset}
            onChange={(e) => {
              onUpdate({ remedyPreset: e.target.value as MedicinesTlcData['remedyPreset'] });
              handleReset();
            }}
            className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900"
          >
            {Object.entries(REMEDY_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setGlovesOn(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-900 text-xs font-medium"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Nitrile Gloves &amp; Goggles On
            </span>
            <span>{glovesOn ? 'Verified' : 'Required'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSpotted(true)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs font-medium ${
              spotted ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            1. Spot A (Aspirin), B (Caffeine), C (Paracetamol), D (Ibuprofen) &amp; E with Capillary Tubes
          </button>

          <button
            type="button"
            disabled={!spotted}
            onClick={() => setChamberReady(true)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs font-medium disabled:opacity-45 ${
              chamberReady ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            2. Line Beaker with Solvent-Soaked Filter Paper &amp; Cover with Inverted Watch Glass
          </button>

          <button
            type="button"
            disabled={!chamberReady || running || progress >= 100}
            onClick={() => setRunning(true)}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-45"
          >
            {progress >= 100
              ? '3. Plate Developed — Solvent Front Marked (50 mm)'
              : running
              ? `Eluting Plate (${progress}%)...`
              : '3. Insert Plate & Develop Chromatogram'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={progress < 100}
              onClick={() => setUvOn((v) => !v)}
              className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-45 ${
                uvOn ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Sun className="w-4 h-4" />
              {uvOn ? 'UV Lamp ON' : '4. UV Lamp (254 nm)'}
            </button>
            <button
              type="button"
              disabled={progress < 100}
              onClick={handleInspectAndRecord}
              className="py-2.5 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-45 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Circle &amp; Record
            </button>
          </div>
        </div>

        {/* Standards key */}
        <div className="border-t border-slate-100 pt-3">
          <div className="text-xs font-semibold text-slate-700 mb-1.5">Lane Reference Key</div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-600">
            <div><strong>A</strong> Aspirin</div>
            <div><strong>B</strong> Caffeine</div>
            <div><strong>C</strong> Paracetamol</div>
            <div><strong>D</strong> Ibuprofen</div>
            <div className="col-span-2 text-blue-800"><strong>E</strong> Over-the-counter pain remedy</div>
          </div>
        </div>
      </div>
    </div>
  );
};
