import React, { useEffect, useState } from 'react';
import { Flame, FlaskConical, Wind, Ruler, CheckCircle2 } from 'lucide-react';
import { DipeptideData } from '../../types/workbook';

interface Lab12bProps {
  data: DipeptideData;
  onUpdate: (patch: Partial<DipeptideData>) => void;
  onMarkLabComplete: () => void;
}

// Solvent front distance = 100 mm
// Aspartic acid Rf = 0.24 (24 mm), Phenylalanine Rf = 0.68 (68 mm)
const SOLVENT_FRONT_MM = 100;
const ASPARTIC_MM = 24;
const PHENYLALANINE_MM = 68;

export const Lab12bDipeptide: React.FC<Lab12bProps> = ({
  data,
  onUpdate,
  onMarkLabComplete,
}) => {
  const [crushed, setCrushed] = useState(data.hydrolysed);
  const [refluxMin, setRefluxMin] = useState(data.hydrolysed ? 30 : 0);
  const [refluxing, setRefluxing] = useState(false);
  const [solventSeparated, setSolventSeparated] = useState(data.chromatogramDeveloped);
  const [spotted, setSpotted] = useState(data.chromatogramDeveloped);
  const [chromaProgress, setChromaProgress] = useState(data.chromatogramDeveloped ? 100 : 0);
  const [chromaRunning, setChromaRunning] = useState(false);
  const [ninhydrinSprayed, setNinhydrinSprayed] = useState(data.chromatogramDeveloped);
  const [warmed, setWarmed] = useState(data.chromatogramDeveloped);
  const [rulerYmm, setRulerYmm] = useState<number>(68);

  useEffect(() => {
    if (!refluxing) return;
    const id = window.setInterval(() => {
      setRefluxMin((m) => {
        if (m >= 30) {
          setRefluxing(false);
          onUpdate({ hydrolysed: true });
          return 30;
        }
        return m + 2;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [refluxing, onUpdate]);

  useEffect(() => {
    if (!chromaRunning) return;
    const id = window.setInterval(() => {
      setChromaProgress((p) => {
        if (p >= 100) {
          setChromaRunning(false);
          return 100;
        }
        return p + 5;
      });
    }, 110);
    return () => window.clearInterval(id);
  }, [chromaRunning]);

  const handleWarmHairdryer = () => {
    setWarmed(true);
    onUpdate({
      hydrolysed: true,
      chromatogramDeveloped: true,
      solventFrontMm: SOLVENT_FRONT_MM,
      asparticAcidMm: ASPARTIC_MM,
      phenylalanineMm: PHENYLALANINE_MM,
      sampleSpot1Mm: ASPARTIC_MM,
      sampleSpot2Mm: PHENYLALANINE_MM,
    });
    onMarkLabComplete();
  };

  // SVG coordinate helper: baseline y = 240, solvent front (100 mm) y = 40 => 2 px per mm
  const mmToY = (mm: number) => 240 - mm * 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Interactive Paper Chromatogram & Ruler */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Aspartame Acid Hydrolysis &amp; Paper Chromatogram
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mobile phase: upper organic layer of butan-1-ol : ethanoic acid : water (5:1:4)
            </p>
          </div>
          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
            Reflux: {refluxMin} / 30 min
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
          <svg viewBox="0 0 560 285" className="w-full h-auto">
            {/* Chromatography Paper */}
            <rect x="75" y="16" width="330" height="252" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.8" />

            {/* Solvent rise shading */}
            {chromaProgress > 0 && (
              <rect
                x="76"
                y={240 - (chromaProgress / 100) * 200}
                width="328"
                height={(chromaProgress / 100) * 200 + 27}
                fill="#F0F9FF"
                fillOpacity="0.65"
              />
            )}

            {/* Pencil baseline (0 mm, y=240) */}
            <line x1="82" y1="240" x2="398" y2="240" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 2" />
            <text x="68" y="243" textAnchor="end" className="text-[9.5px] fill-slate-500 font-mono">0 mm</text>

            {/* Solvent front line */}
            {chromaProgress > 0 && (
              <g>
                <line
                  x1="76"
                  y1={240 - (chromaProgress / 100) * 200}
                  x2="404"
                  y2={240 - (chromaProgress / 100) * 200}
                  stroke="#0284C7"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                />
                <text
                  x="68"
                  y={243 - (chromaProgress / 100) * 200}
                  textAnchor="end"
                  className="text-[9.5px] fill-sky-700 font-mono font-semibold"
                >
                  {chromaProgress} mm
                </text>
              </g>
            )}

            {/* Origin crosses */}
            {[
              { x: 145, label: '(i) Refluxed Sample' },
              { x: 240, label: '(ii) Aspartic Acid' },
              { x: 335, label: '(iii) Phenylalanine' },
            ].map((lane) => (
              <g key={lane.label}>
                <text x={lane.x} y="258" textAnchor="middle" className="text-[10.5px] fill-slate-800 font-medium">
                  {lane.label}
                </text>
                {spotted && (
                  <circle cx={lane.x} cy="240" r="3" fill="#94A3B8" />
                )}
              </g>
            ))}

            {/* Ninhydrin-developed Purple Spots */}
            {warmed && (
              <g>
                {/* Refluxed sample shows BOTH aspartic acid & phenylalanine spots */}
                <ellipse cx="145" cy={mmToY(ASPARTIC_MM)} rx="11" ry="8" fill="#7E22CE" fillOpacity="0.82" stroke="#475569" strokeDasharray="2 2" />
                <ellipse cx="145" cy={mmToY(PHENYLALANINE_MM)} rx="11" ry="8" fill="#7E22CE" fillOpacity="0.82" stroke="#475569" strokeDasharray="2 2" />

                {/* Standard Aspartic Acid */}
                <ellipse cx="240" cy={mmToY(ASPARTIC_MM)} rx="11" ry="8" fill="#7E22CE" fillOpacity="0.88" stroke="#475569" strokeDasharray="2 2" />

                {/* Standard Phenylalanine */}
                <ellipse cx="335" cy={mmToY(PHENYLALANINE_MM)} rx="11" ry="8" fill="#7E22CE" fillOpacity="0.88" stroke="#475569" strokeDasharray="2 2" />
              </g>
            )}

            {chromaProgress === 100 && !warmed && (
              <text x="240" y="138" textAnchor="middle" className="text-[11px] fill-slate-500">
                Amino acids are colourless — spray ninhydrin &amp; warm with hairdryer
              </text>
            )}

            {/* Built-in Interactive Millimetre Ruler on right side */}
            <g>
              <rect x="424" y="30" width="46" height="222" rx="3" fill="#FEFCE8" stroke="#CA8A04" strokeWidth="1.2" />
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((mm) => {
                const y = mmToY(mm);
                return (
                  <g key={mm}>
                    <line x1="424" y1={y} x2="438" y2={y} stroke="#854D0E" strokeWidth="1" />
                    <text x="442" y={y + 3} className="text-[8.5px] fill-amber-900 font-mono">
                      {mm}
                    </text>
                  </g>
                );
              })}
              {/* Movable horizontal measurement hairline */}
              <line
                x1="75"
                y1={mmToY(rulerYmm)}
                x2="470"
                y2={mmToY(rulerYmm)}
                stroke="#DC2626"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />
              <rect x="476" y={mmToY(rulerYmm) - 10} width="76" height="20" rx="3" fill="#DC2626" />
              <text x="514" y={mmToY(rulerYmm) + 3} textAnchor="middle" className="text-[9.5px] fill-white font-mono font-semibold">
                {rulerYmm} mm · Rf {(rulerYmm / 100).toFixed(2)}
              </text>
            </g>
          </svg>
        </div>

        {/* Ruler slider control */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
          <label className="flex items-center justify-between text-xs text-amber-950 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-amber-700" />
              Slide Red Measurement Hairline to Measure Spot Centres
            </span>
            <span className="font-mono font-semibold">
              x = {rulerYmm} mm · y = 100 mm · Rf = {(rulerYmm / 100).toFixed(2)}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={rulerYmm}
            onChange={(e) => setRulerYmm(Number(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>
      </div>

      {/* Right Guided Steps */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Procedure Steps</h4>

        <button
          type="button"
          onClick={() => setCrushed(true)}
          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs font-medium ${
            crushed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
          }`}
        >
          1. Crush 3 aspartame tablets (mortar &amp; pestle) + add 25 cm³ of 4 M HCl &amp; granules
        </button>

        <button
          type="button"
          disabled={!crushed || refluxing || refluxMin >= 30}
          onClick={() => setRefluxing(true)}
          className="w-full py-2.5 px-3.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-45 flex items-center justify-center gap-2"
        >
          <Flame className="w-4 h-4" />
          {refluxMin >= 30
            ? '2. Acid Reflux Complete (30 min)'
            : refluxing
            ? `Refluxing (${refluxMin}/30 min)...`
            : '2. Heat Under Reflux for 30 Minutes'}
        </button>

        <button
          type="button"
          disabled={refluxMin < 30}
          onClick={() => setSolventSeparated(true)}
          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs font-medium disabled:opacity-45 flex items-center gap-2 ${
            solventSeparated ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FlaskConical className="w-4 h-4 shrink-0" />
          3. Shake 5:1:4 butan-1-ol : ethanoic acid : water &amp; collect upper layer
        </button>

        <button
          type="button"
          disabled={!solventSeparated}
          onClick={() => setSpotted(true)}
          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs font-medium disabled:opacity-45 ${
            spotted ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
          }`}
        >
          4. Draw pencil baseline &amp; spot refluxed sample, aspartic acid &amp; phenylalanine
        </button>

        <button
          type="button"
          disabled={!spotted || chromaRunning || chromaProgress >= 100}
          onClick={() => setChromaRunning(true)}
          className="w-full py-2.5 px-3.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-45"
        >
          {chromaProgress >= 100
            ? '5. Chromatogram Developed (Solvent Front 100 mm)'
            : chromaRunning
            ? `Developing paper chromatogram (${chromaProgress}%)...`
            : '5. Run Paper Chromatogram in Covered Beaker'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={chromaProgress < 100}
            onClick={() => setNinhydrinSprayed(true)}
            className={`py-2 px-3 rounded-lg border text-xs font-medium disabled:opacity-45 ${
              ninhydrinSprayed ? 'bg-purple-50 border-purple-400 text-purple-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            6. Spray Ninhydrin (Fume Cupboard)
          </button>
          <button
            type="button"
            disabled={!ninhydrinSprayed}
            onClick={handleWarmHairdryer}
            className="py-2 px-3 rounded-lg bg-purple-700 text-white text-xs font-medium hover:bg-purple-800 disabled:opacity-45 flex items-center justify-center gap-1.5"
          >
            <Wind className="w-3.5 h-3.5" />
            7. Warm with Hairdryer
          </button>
        </div>

        {warmed && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Purple Spots Developed &amp; Saved
            </div>
            <div className="font-mono text-[11px]">
              Aspartic acid: {ASPARTIC_MM} mm (Rf 0.24) · Phenylalanine: {PHENYLALANINE_MM} mm (Rf 0.68)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
