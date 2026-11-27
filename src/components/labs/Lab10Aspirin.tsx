import React, { useEffect, useState } from 'react';
import { Flame, Snowflake, Sun, Thermometer, CheckCircle2, ShieldAlert, Scale } from 'lucide-react';
import { AspirinData } from '../../types/workbook';

interface Lab10Props {
  data: AspirinData;
  onUpdate: (patch: Partial<AspirinData>) => void;
  onMarkLabComplete: () => void;
}

export const Lab10Aspirin: React.FC<Lab10Props> = ({
  data,
  onUpdate,
  onMarkLabComplete,
}) => {
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | 4>(1);

  // Stage 1 internal workflow state
  const [fumeCupboard, setFumeCupboard] = useState(false);
  const [weighedMass, setWeighedMass] = useState<number>(data.salicylicAcidMass || 2.00);
  const [anhydrideAdded, setAnhydrideAdded] = useState(false);
  const [catalystAdded, setCatalystAdded] = useState(false);
  const [refluxMinutes, setRefluxMinutes] = useState(0);
  const [refluxRunning, setRefluxRunning] = useState(false);
  const [hydrolysed, setHydrolysed] = useState(false);
  const [precipitated, setPrecipitated] = useState(false);
  const [crudeFiltered, setCrudeFiltered] = useState(data.crudeMass !== null);

  // Stage 2 recrystallisation state
  const [ethanolAdded, setEthanolAdded] = useState(false);
  const [waterPortions, setWaterPortions] = useState(0); // cloud point at 6 cm3
  const [iceCooled, setIceCooled] = useState(false);
  const [pureFiltered, setPureFiltered] = useState(data.pureMass !== null);

  // Stage 3 TLC state
  const [tlcProgress, setTlcProgress] = useState(data.tlcCompleted ? 100 : 0);
  const [tlcRunning, setTlcRunning] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'uv' | 'iodine'>('normal');

  // Stage 4 Melting point state
  const [mpSample, setMpSample] = useState<'salicylic' | 'crude' | 'pure'>('pure');
  const [mpTemp, setMpTemp] = useState<number>(25);
  const [mpHeating, setMpHeating] = useState<boolean>(false);

  useEffect(() => {
    if (data.stagesCompleted.length >= 4) {
      onMarkLabComplete();
    }
  }, [data.stagesCompleted.length, onMarkLabComplete]);

  // Reflux accelerated timer (10 min in ~4 seconds)
  useEffect(() => {
    if (!refluxRunning) return;
    const id = window.setInterval(() => {
      setRefluxMinutes((m) => {
        if (m >= 10) {
          setRefluxRunning(false);
          return 10;
        }
        return Number((m + 0.5).toFixed(1));
      });
    }, 180);
    return () => window.clearInterval(id);
  }, [refluxRunning]);

  // TLC capillary rise animation
  useEffect(() => {
    if (!tlcRunning) return;
    const id = window.setInterval(() => {
      setTlcProgress((p) => {
        if (p >= 100) {
          setTlcRunning(false);
          const nextStages = Array.from(new Set([...data.stagesCompleted, 3]));
          onUpdate({
            tlcCompleted: true,
            rfSalicylic: 0.78,
            rfCrudeSpots: [0.54, 0.78],
            rfPureAspirin: 0.54,
            stagesCompleted: nextStages,
          });
          return 100;
        }
        return p + 5;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [tlcRunning, data.stagesCompleted, onUpdate]);

  // Melting point heating ramp
  const targetMP = mpSample === 'salicylic' ? 152 : mpSample === 'crude' ? 122 : 132;
  useEffect(() => {
    if (!mpHeating) return;
    const id = window.setInterval(() => {
      setMpTemp((t) => {
        if (t >= targetMP + 4) {
          setMpHeating(false);
          const nextStages = Array.from(new Set([...data.stagesCompleted, 4]));
          onUpdate({
            mpSalicylic: mpSample === 'salicylic' ? 152 : data.mpSalicylic,
            mpCrude: mpSample === 'crude' ? 122 : data.mpCrude,
            mpPure: mpSample === 'pure' ? 132 : data.mpPure,
            stagesCompleted: nextStages,
          });
          return targetMP + 4;
        }
        return t + 3;
      });
    }, 90);
    return () => window.clearInterval(id);
  }, [mpHeating, targetMP, mpSample, data, onUpdate]);

  const theoreticalMass = (weighedMass / 138.0) * 180.0;

  const completeStage1 = () => {
    // Realistic crude yield ~86% of theoretical (plus slight salicylic acid impurity)
    const crude = Number((theoreticalMass * 0.87).toFixed(2));
    setCrudeFiltered(true);
    const nextStages = Array.from(new Set([...data.stagesCompleted, 1]));
    onUpdate({
      salicylicAcidMass: weighedMass,
      crudeMass: crude,
      stagesCompleted: nextStages,
    });
  };

  const completeStage2 = () => {
    // Realistic purified yield ~68% of theoretical
    const pure = Number((theoreticalMass * 0.69).toFixed(2));
    setPureFiltered(true);
    const nextStages = Array.from(new Set([...data.stagesCompleted, 2]));
    onUpdate({
      pureMass: pure,
      stagesCompleted: nextStages,
    });
  };

  const isMelted = mpTemp >= targetMP;
  const isSoftening = mpSample === 'crude' ? mpTemp >= targetMP - 5 : mpTemp >= targetMP - 1;

  return (
    <div className="space-y-5">
      {/* 4-Stage Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { num: 1 as const, title: '1. Synthesis & Reflux', sub: 'Crude Aspirin' },
          { num: 2 as const, title: '2. Recrystallisation', sub: 'Ethanol / Ice Bath' },
          { num: 3 as const, title: '3. TLC Purity Check', sub: '254 nm UV / I₂' },
          { num: 4 as const, title: '4. Melting Point', sub: 'Pure vs Crude' },
        ].map((st) => {
          const done = data.stagesCompleted.includes(st.num);
          return (
            <button
              key={st.num}
              type="button"
              onClick={() => setActiveStage(st.num)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                activeStage === st.num
                  ? 'bg-blue-50 border-blue-600 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{st.title}</span>
                {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{st.sub}</div>
            </button>
          );
        })}
      </div>

      {/* STAGE 1: SYNTHESIS */}
      {activeStage === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Part 1a &amp; 1b — Synthesis, Boiling Water Bath Reflux &amp; Filtration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salicylic acid ({weighedMass.toFixed(2)} g) + 4 cm³ ethanoic anhydride + 0.25 cm³ H₃PO₄
                </p>
              </div>
              <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                Reflux: {refluxMinutes.toFixed(1)} / 10.0 min
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
              <svg viewBox="0 0 600 265" className="w-full h-auto">
                {/* Fume cupboard sash outline if enabled */}
                {fumeCupboard && (
                  <g>
                    <rect x="8" y="8" width="584" height="248" rx="6" fill="none" stroke="#0284C7" strokeWidth="2" strokeDasharray="6 4" />
                    <text x="20" y="24" className="text-[10px] fill-sky-700 font-mono font-semibold">
                      FUME CUPBOARD EXTRACTION ACTIVE · GOGGLES ON
                    </text>
                  </g>
                )}

                {/* Bench */}
                <rect x="0" y="232" width="600" height="33" fill="#E2E8F0" />

                {/* Left: Top-pan Balance */}
                <g>
                  <rect x="36" y="198" width="115" height="34" rx="4" fill="#334155" />
                  <rect x="52" y="207" width="83" height="18" rx="2" fill="#0F172A" />
                  <text x="93" y="220" textAnchor="middle" className="text-[12px] fill-emerald-400 font-mono font-semibold">
                    {weighedMass.toFixed(2)} g
                  </text>
                  <rect x="48" y="191" width="91" height="7" rx="2" fill="#94A3B8" />
                  {/* Weighing boat with salicylic acid */}
                  <polygon points="62,191 124,191 118,180 68,180" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.2" />
                  <ellipse cx="93" cy="184" rx="18" ry="4" fill="#F8FAFC" stroke="#CBD5E1" />
                  <text x="93" y="248" textAnchor="middle" className="text-[10.5px] fill-slate-700 font-medium">
                    Salicylic Acid
                  </text>
                </g>

                {/* Center: 400 cm3 Beaker Water Bath + Pear-shaped Flask */}
                <g>
                  {/* Hotplate */}
                  <rect x="218" y="212" width="154" height="20" rx="3" fill="#475569" />
                  <rect x="234" y="206" width="122" height="6" fill={refluxRunning ? '#EF4444' : '#94A3B8'} />

                  {/* 400 cm3 Water Bath Beaker */}
                  <path d="M 236 105 L 236 202 Q 236 206 244 206 L 346 206 Q 354 206 354 202 L 354 105" fill="#FFFFFF" fillOpacity="0.6" stroke="#334155" strokeWidth="2" />
                  <rect x="239" y="138" width="112" height="66" fill="#BAE6FD" fillOpacity="0.45" />

                  {/* Pear-shaped flask clamped inside */}
                  <path d="M 284 56 L 284 114 C 284 132, 264 148, 268 172 C 272 192, 318 192, 322 172 C 326 148, 306 132, 306 114 L 306 56 Z" fill="#FFFFFF" fillOpacity="0.85" stroke="#1E293B" strokeWidth="2" />
                  {/* Reaction liquid inside pear-shaped flask */}
                  <path
                    d="M 271 162 C 272 188, 318 188, 319 162 Z"
                    fill={anhydrideAdded ? (catalystAdded ? '#FEF9C3' : '#F1F5F9') : '#FFFFFF'}
                  />
                  {/* Anti-bumping granules */}
                  <circle cx="288" cy="182" r="2" fill="#64748B" />
                  <circle cx="295" cy="184" r="2" fill="#64748B" />
                  <circle cx="302" cy="182" r="2" fill="#64748B" />

                  {/* Boiling bubbles during reflux */}
                  {refluxRunning && [282, 294, 306].map((bx, i) => (
                    <circle key={bx} cx={bx} cy="176" r="2.2" fill="#FFFFFF" stroke="#0284C7" strokeWidth="0.9" className="animate-bubble" style={{ animationDelay: `${i * 0.3}s` }} />
                  ))}

                  <text x="295" y="248" textAnchor="middle" className="text-[10.5px] fill-slate-700 font-medium">
                    Reflux Water Bath (10 min)
                  </text>
                </g>

                {/* Right: Ice-Cold Water Precipitation Beaker / Vacuum Filter */}
                <g>
                  <path d="M 442 128 L 442 224 Q 442 232 452 232 L 548 232 Q 558 232 558 224 L 558 128" fill="#FFFFFF" fillOpacity="0.7" stroke="#334155" strokeWidth="2" />
                  <rect x="445" y="156" width="110" height="74" fill="#E0F2FE" fillOpacity="0.75" />
                  {/* Precipitated white crude aspirin solid */}
                  {precipitated && (
                    <g>
                      <ellipse cx="500" cy="220" rx="44" ry="10" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
                      <text x="500" y="192" textAnchor="middle" className="text-[10px] fill-slate-700 font-mono font-semibold">
                        White solid ppt
                      </text>
                    </g>
                  )}
                  <text x="500" y="248" textAnchor="middle" className="text-[10.5px] fill-slate-700 font-medium">
                    30 cm³ Ice-Cold Water
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
            <h4 className="text-sm font-semibold text-slate-900">Step-by-Step Synthesis Controls</h4>

            <div>
              <label className="flex items-center justify-between text-xs text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Scale className="w-3.5 h-3.5 text-slate-500" />
                  Weigh Salicylic Acid (1.95 – 2.05 g)
                </span>
                <span className="font-mono font-semibold">{weighedMass.toFixed(2)} g</span>
              </label>
              <input
                type="range"
                min={1.95}
                max={2.05}
                step={0.01}
                value={weighedMass}
                onChange={(e) => setWeighedMass(Number(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <button
              type="button"
              onClick={() => setFumeCupboard(true)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium ${
                fumeCupboard ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                1. Move to Fume Cupboard &amp; Wear Goggles
              </span>
              <span>{fumeCupboard ? 'Active' : 'Required'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!fumeCupboard}
                onClick={() => setAnhydrideAdded(true)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium disabled:opacity-45 ${
                  anhydrideAdded ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                2. Add 4 cm³ Ethanoic Anhydride
              </button>
              <button
                type="button"
                disabled={!anhydrideAdded}
                onClick={() => setCatalystAdded(true)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium disabled:opacity-45 ${
                  catalystAdded ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                3. Add 0.25 cm³ H₃PO₄ + Granules
              </button>
            </div>

            <button
              type="button"
              disabled={!catalystAdded || refluxRunning || refluxMinutes >= 10}
              onClick={() => setRefluxRunning(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-45 flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4" />
              {refluxMinutes >= 10
                ? '4. Reflux Complete (10 min)'
                : refluxRunning
                ? `Heating under reflux (${refluxMinutes.toFixed(1)} min)...`
                : '4. Heat Under Reflux (10 min Boiling Water Bath)'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={refluxMinutes < 10}
                onClick={() => setHydrolysed(true)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium disabled:opacity-45 ${
                  hydrolysed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                5. Add 2×1 cm³ Cold Water
              </button>
              <button
                type="button"
                disabled={!hydrolysed}
                onClick={() => setPrecipitated(true)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium disabled:opacity-45 ${
                  precipitated ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                6. Pour into Ice Water &amp; Scratch
              </button>
            </div>

            <button
              type="button"
              disabled={!precipitated}
              onClick={completeStage1}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 disabled:opacity-45"
            >
              7. Vacuum Filter, Wash (5 cm³ Ice Water), Dry at 30 °C &amp; Weigh Crude Solid
            </button>

            {crudeFiltered && data.crudeMass !== null && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
                <div>Salicylic acid weighed: <strong>{weighedMass.toFixed(2)} g</strong></div>
                <div>Theoretical max yield: <strong>{theoreticalMass.toFixed(2)} g</strong></div>
                <div className="text-emerald-800">
                  Dried crude aspirin mass: <strong>{data.crudeMass.toFixed(2)} g</strong> ({((data.crudeMass / theoreticalMass) * 100).toFixed(1)}%)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: RECRYSTALLISATION */}
      {activeStage === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Part 2 — Recrystallisation from Ethanol &amp; Water
            </h3>
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
              <svg viewBox="0 0 560 230" className="w-full h-auto">
                <rect x="0" y="200" width="560" height="30" fill="#E2E8F0" />
                {/* Ice bath beaker when cooled */}
                {iceCooled && (
                  <g>
                    <path d="M 185 88 L 185 196 Q 185 200 193 200 L 367 200 Q 375 200 375 196 L 375 88" fill="#E0F2FE" fillOpacity="0.6" stroke="#0284C7" strokeWidth="2" />
                    <rect x="200" y="130" width="22" height="18" rx="3" fill="#FFFFFF" fillOpacity="0.85" stroke="#7DD3FC" />
                    <rect x="332" y="138" width="24" height="18" rx="3" fill="#FFFFFF" fillOpacity="0.85" stroke="#7DD3FC" />
                    <text x="280" y="218" textAnchor="middle" className="text-[11px] fill-sky-800 font-medium">
                      Ice-Cold Water Bath (Needle Crystals Growing)
                    </text>
                  </g>
                )}

                {/* Boiling tube */}
                <path d="M 244 26 L 244 176 Q 244 192 280 192 Q 316 192 316 176 L 316 26" fill="#FFFFFF" fillOpacity="0.85" stroke="#334155" strokeWidth="2.2" />
                {/* Liquid inside boiling tube */}
                {ethanolAdded && (
                  <path
                    d={`M 247 ${150 - waterPortions * 7} L 313 ${150 - waterPortions * 7} L 313 176 Q 313 189 280 189 Q 247 189 247 176 Z`}
                    fill={waterPortions >= 6 ? '#E2E8F0' : '#F0F9FF'}
                    fillOpacity={waterPortions >= 6 ? 0.92 : 0.7}
                  />
                )}
                {/* Crystals forming in ice bath */}
                {iceCooled && (
                  <g stroke="#FFFFFF" strokeWidth="2.2">
                    <line x1="258" y1="176" x2="276" y2="152" />
                    <line x1="274" y1="184" x2="296" y2="150" />
                    <line x1="290" y1="182" x2="306" y2="156" />
                    <line x1="262" y1="162" x2="288" y2="178" />
                    <line x1="272" y1="146" x2="298" y2="168" />
                  </g>
                )}
                <text x="280" y="18" textAnchor="middle" className="text-[10.5px] fill-slate-700 font-mono">
                  {!ethanolAdded && 'Crude solid ready in boiling tube'}
                  {ethanolAdded && waterPortions < 6 && `Dissolved in 5 cm³ ethanol + ${waterPortions} cm³ water (clear)`}
                  {ethanolAdded && waterPortions >= 6 && !iceCooled && 'First persistent cloudiness reached! Ready for ice bath.'}
                  {iceCooled && 'Pure white needle crystals filling boiling tube'}
                </text>
              </svg>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Recrystallisation Controls</h4>
            <button
              type="button"
              onClick={() => setEthanolAdded(true)}
              className={`w-full py-2.5 px-3 rounded-lg border text-xs font-medium ${
                ethanolAdded ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              1. Add 5 cm³ Ethanol &amp; Dissolve Crude Aspirin
            </button>

            <button
              type="button"
              disabled={!ethanolAdded || waterPortions >= 6}
              onClick={() => setWaterPortions((w) => Math.min(6, w + 1))}
              className="w-full py-2.5 px-3 rounded-lg border border-blue-600 bg-blue-50 text-blue-900 text-xs font-medium hover:bg-blue-100 disabled:opacity-45"
            >
              2. Add 1 cm³ Distilled Water While Stirring ({waterPortions} cm³ added)
            </button>

            <button
              type="button"
              disabled={waterPortions < 6}
              onClick={() => setIceCooled(true)}
              className={`w-full py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-45 ${
                iceCooled ? 'bg-sky-50 border-sky-400 text-sky-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Snowflake className="w-4 h-4 text-sky-600" />
              3. Place Boiling Tube in Ice-Cold Water Bath
            </button>

            <button
              type="button"
              disabled={!iceCooled}
              onClick={completeStage2}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 disabled:opacity-45"
            >
              4. Filter, Wash (5 cm³ Ice Water), Dry Overnight &amp; Weigh Pure Crystals
            </button>

            {pureFiltered && data.pureMass !== null && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-950 space-y-1">
                <div>Pure dry aspirin mass: <strong>{data.pureMass.toFixed(2)} g</strong></div>
                <div>Purified % yield: <strong>{((data.pureMass / theoreticalMass) * 100).toFixed(1)}%</strong></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 3: TLC PURITY CHECK */}
      {activeStage === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Part 3 — TLC Purity Check (10:9:1 Hexane : Ethyl Ethanoate : Ethanoic Acid)
              </h3>
              <span className="text-xs font-mono text-slate-500">Solvent front: {tlcProgress}%</span>
            </div>

            <div className="flex justify-center bg-slate-900/5 border border-slate-200 rounded-lg p-5">
              <svg viewBox="0 0 320 260" className="w-72 h-auto">
                {/* TLC Plate */}
                <rect
                  x="40"
                  y="16"
                  width="240"
                  height="228"
                  rx="4"
                  fill={viewMode === 'uv' ? '#4ADE80' : viewMode === 'iodine' ? '#FEF3C7' : '#FFFFFF'}
                  stroke="#334155"
                  strokeWidth="2"
                  className="transition-colors duration-300"
                />
                {/* Pencil baseline (y=204) */}
                <line x1="48" y1="204" x2="272" y2="204" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 2" />

                {/* Solvent front rising from y=204 to y=44 (160 px travel = 40 mm) */}
                {tlcProgress > 0 && (
                  <line
                    x1="44"
                    y1={204 - (tlcProgress / 100) * 160}
                    x2="276"
                    y2={204 - (tlcProgress / 100) * 160}
                    stroke="#0284C7"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                )}

                {/* Lane Labels */}
                <text x="95" y="228" textAnchor="middle" className="text-[10.5px] fill-slate-800 font-semibold">Salicylic Acid</text>
                <text x="160" y="228" textAnchor="middle" className="text-[10.5px] fill-slate-800 font-semibold">Crude</text>
                <text x="225" y="228" textAnchor="middle" className="text-[10.5px] fill-slate-800 font-semibold">Purified</text>

                {/* Spots visible only under UV (dark spots on green plate) or Iodine (brown spots) */}
                {tlcProgress === 100 && viewMode !== 'normal' && (
                  <g>
                    {/* Salicylic acid Rf = 0.78 -> y = 204 - 0.78*160 = 79.2 */}
                    <circle cx="95" cy="79" r="7" fill={viewMode === 'uv' ? '#14532D' : '#92400E'} fillOpacity="0.85" />
                    <text x="95" y="66" textAnchor="middle" className="text-[9px] fill-slate-900 font-mono">Rf 0.78</text>

                    {/* Crude aspirin: TWO spots (aspirin 0.54 + impurity salicylic acid 0.78) */}
                    <circle cx="160" cy="79" r="5" fill={viewMode === 'uv' ? '#14532D' : '#92400E'} fillOpacity="0.65" />
                    <circle cx="160" cy="118" r="7.5" fill={viewMode === 'uv' ? '#14532D' : '#92400E'} fillOpacity="0.88" />

                    {/* Purified aspirin: SINGLE clean spot at Rf = 0.54 -> y = 204 - 0.54*160 = 117.6 */}
                    <circle cx="225" cy="118" r="7.5" fill={viewMode === 'uv' ? '#14532D' : '#92400E'} fillOpacity="0.9" />
                    <text x="225" y="104" textAnchor="middle" className="text-[9px] fill-slate-900 font-mono">Rf 0.54</text>
                  </g>
                )}

                {tlcProgress === 100 && viewMode === 'normal' && (
                  <text x="160" y="128" textAnchor="middle" className="text-[10.5px] fill-slate-400">
                    Spots are colourless — turn on UV (254 nm) or I₂ vapour
                  </text>
                )}
              </svg>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">TLC Development &amp; Visualisation</h4>
            <button
              type="button"
              disabled={tlcRunning}
              onClick={() => {
                setTlcProgress(0);
                setTlcRunning(true);
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-50"
            >
              {tlcProgress === 100 ? 'Re-run TLC Plate in Developing Tank' : 'Place Spotted Plate in Developing Tank'}
            </button>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-700">Inspect Developed Plate:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('normal')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium ${
                    viewMode === 'normal' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  White Light
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('uv')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 ${
                    viewMode === 'uv' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  UV 254 nm
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('iodine')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium ${
                    viewMode === 'iodine' ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  I₂ Vapour
                </button>
              </div>
              <p className="text-xs text-slate-500 pt-1">
                Notice how crude aspirin contains a faint upper spot matching unreacted salicylic acid (Rf 0.78), whereas purified aspirin shows only one clean spot (Rf 0.54).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4: MELTING POINT APPARATUS */}
      {activeStage === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Part 5 — Digital Melting Point Apparatus
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 border border-slate-200 rounded-lg p-5">
              <div className="bg-slate-900 rounded-xl p-5 text-center space-y-2">
                <div className="text-[11px] font-mono text-slate-400">BLOCK TEMPERATURE</div>
                <div className="text-4xl font-mono font-bold text-emerald-400 tabular-nums">
                  {mpTemp} °C
                </div>
                <div className="text-xs font-mono text-slate-300">
                  {isMelted
                    ? 'STATE: COMPLETELY LIQUID (MELTED)'
                    : isSoftening
                    ? 'STATE: SOFTENING / MELTING...'
                    : 'STATE: WHITE CRYSTALLINE SOLID'}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-xs font-medium text-slate-600 mb-2">Capillary Magnifier View</div>
                <div className="w-32 h-32 rounded-full border-4 border-slate-700 bg-slate-950 flex items-center justify-center relative overflow-hidden">
                  {/* Glass capillary */}
                  <div className="w-8 h-24 border-x-2 border-b-2 border-slate-300/70 rounded-b-full flex flex-col justify-end items-center pb-1 overflow-hidden">
                    <div
                      className="w-full transition-all duration-300"
                      style={{
                        height: isMelted ? '36%' : isSoftening ? '48%' : '62%',
                        backgroundColor: isMelted ? 'rgba(186, 230, 253, 0.55)' : '#FFFFFF',
                      }}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 font-mono">
                  Literature MP: Aspirin 135 °C · Salicylic Acid 152 °C
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">Select Capillary Sample</h4>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'salicylic' as const, name: 'Starting Salicylic Acid', rec: data.mpSalicylic },
                { id: 'crude' as const, name: 'Crude Aspirin (Impure)', rec: data.mpCrude },
                { id: 'pure' as const, name: 'Purified Aspirin (Recrystallised)', rec: data.mpPure },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setMpHeating(false);
                    setMpSample(s.id);
                    setMpTemp(25);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs ${
                    mpSample === s.id
                      ? 'bg-blue-50 border-blue-600 text-slate-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="font-mono text-emerald-700">
                    {s.rec !== null ? `${s.rec} °C` : 'Not tested'}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={mpHeating}
              onClick={() => {
                setMpTemp(95);
                setMpHeating(true);
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Thermometer className="w-4 h-4" />
              {mpHeating ? 'Heating Block...' : 'Start Melting Point Ramp'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
