import React, { useEffect, useState } from 'react';
import { Clock, RotateCcw, Droplet, CheckCircle2 } from 'lucide-react';
import { TransitionMetalObservation } from '../../types/workbook';

interface Lab11Props {
  observations: Record<string, TransitionMetalObservation>;
  onRecordWell: (wellId: string, obs: TransitionMetalObservation) => void;
  onMarkLabComplete: () => void;
}

type IonId = 'Cu2+' | 'Fe2+' | 'Fe3+' | 'Al3+';
type PipetteTool = 'NaOH' | 'NH3' | 'Na2CO3';

interface WellVisual {
  bg: string;
  pptColor?: string;
  pptOpacity?: number;
  bubbles?: boolean;
  oxidisedRim?: boolean;
  text: string;
  formula: string;
}

function getWellVisual(
  ion: IonId,
  reagentCol: PipetteTool,
  drops: number,
  oxidised: boolean
): WellVisual {
  // Initial 2 drops of aqueous metal salt (0 reagent drops added)
  if (drops === 0) {
    if (ion === 'Cu2+') return { bg: '#BAE6FD', text: 'Pale blue solution', formula: '[Cu(H₂O)₆]²⁺(aq)' };
    if (ion === 'Fe2+') return { bg: '#DCFCE7', text: 'Very pale green solution', formula: '[Fe(H₂O)₆]²⁺(aq)' };
    if (ion === 'Fe3+') return { bg: '#FDE68A', text: 'Yellow-brown solution', formula: '[Fe(H₂O)₆]³⁺(aq)' };
    return { bg: '#F8FAFC', text: 'Colourless solution', formula: '[Al(H₂O)₆]³⁺(aq)' };
  }

  // With NaOH(aq)
  if (reagentCol === 'NaOH') {
    if (ion === 'Cu2+') {
      return {
        bg: '#E0F2FE',
        pptColor: '#38BDF8',
        pptOpacity: 0.92,
        text: drops >= 8 ? 'Pale blue precipitate (insoluble in excess NaOH)' : 'Pale blue precipitate',
        formula: '[Cu(H₂O)₄(OH)₂](s)',
      };
    }
    if (ion === 'Fe2+') {
      return {
        bg: '#ECFDF5',
        pptColor: '#15803D',
        pptOpacity: 0.92,
        oxidisedRim: oxidised,
        text: oxidised
          ? 'Green ppt turning rusty brown on standing in air (oxidised to Fe³⁺)'
          : 'Dirty green precipitate',
        formula: oxidised ? '[Fe(H₂O)₃(OH)₃](s) on surface' : '[Fe(H₂O)₄(OH)₂](s)',
      };
    }
    if (ion === 'Fe3+') {
      return {
        bg: '#FEF3C7',
        pptColor: '#B45309',
        pptOpacity: 0.95,
        text: 'Rust-brown precipitate (insoluble in excess NaOH)',
        formula: '[Fe(H₂O)₃(OH)₃](s)',
      };
    }
    // Al3+ with NaOH: 2-6 drops -> white ppt; >= 8 drops (excess) -> redissolves to colourless solution!
    if (drops >= 8) {
      return {
        bg: '#F8FAFC',
        text: 'White ppt redissolves in excess NaOH → colourless solution (amphoteric)',
        formula: '[Al(H₂O)₂(OH)₄]⁻(aq)',
      };
    }
    return {
      bg: '#F1F5F9',
      pptColor: '#FFFFFF',
      pptOpacity: 0.96,
      text: 'White gelatinous precipitate (add excess NaOH up to 10 drops to test)',
      formula: '[Al(H₂O)₃(OH)₃](s)',
    };
  }

  // With NH3(aq)
  if (reagentCol === 'NH3') {
    if (ion === 'Cu2+') {
      if (drops >= 8) {
        return {
          bg: '#1D4ED8',
          text: 'Precipitate redissolves in excess NH₃ → deep royal blue solution',
          formula: '[Cu(NH₃)₄(H₂O)₂]²⁺(aq)',
        };
      }
      return {
        bg: '#E0F2FE',
        pptColor: '#38BDF8',
        pptOpacity: 0.9,
        text: 'Pale blue precipitate (keep adding drops of NH₃ to excess)',
        formula: '[Cu(H₂O)₄(OH)₂](s)',
      };
    }
    if (ion === 'Fe2+') {
      return {
        bg: '#ECFDF5',
        pptColor: '#15803D',
        pptOpacity: 0.9,
        oxidisedRim: oxidised,
        text: oxidised
          ? 'Green ppt turning brown at surface in air (no redissolving in excess NH₃)'
          : 'Green precipitate (insoluble in excess NH₃)',
        formula: '[Fe(H₂O)₄(OH)₂](s)',
      };
    }
    if (ion === 'Fe3+') {
      return {
        bg: '#FEF3C7',
        pptColor: '#B45309',
        pptOpacity: 0.95,
        text: 'Rust-brown precipitate (insoluble in excess NH₃)',
        formula: '[Fe(H₂O)₃(OH)₃](s)',
      };
    }
    return {
      bg: '#F1F5F9',
      pptColor: '#FFFFFF',
      pptOpacity: 0.96,
      text: 'White precipitate (remains insoluble in excess NH₃)',
      formula: '[Al(H₂O)₃(OH)₃](s)',
    };
  }

  // With Na2CO3(aq)
  if (ion === 'Cu2+') {
    return {
      bg: '#CCFBF1',
      pptColor: '#0D9488',
      pptOpacity: 0.9,
      text: 'Blue-green precipitate (no effervescence)',
      formula: 'CuCO₃(s)',
    };
  }
  if (ion === 'Fe2+') {
    return {
      bg: '#DCFCE7',
      pptColor: '#4D7C0F',
      pptOpacity: 0.88,
      text: 'Pale green / grey-green precipitate (no effervescence)',
      formula: 'FeCO₃(s)',
    };
  }
  if (ion === 'Fe3+') {
    return {
      bg: '#FEF3C7',
      pptColor: '#B45309',
      pptOpacity: 0.92,
      bubbles: true,
      text: 'Brown precipitate + effervescence (CO₂ gas bubbles — Q15 acidic M³⁺)',
      formula: '[Fe(H₂O)₃(OH)₃](s) + CO₂(g)',
    };
  }
  return {
    bg: '#F1F5F9',
    pptColor: '#FFFFFF',
    pptOpacity: 0.95,
    bubbles: true,
    text: 'White precipitate + effervescence (CO₂ gas bubbles — Exam Q)',
    formula: '[Al(H₂O)₃(OH)₃](s) + CO₂(g)',
  };
}

const IONS: { id: IonId; name: string; salt: string }[] = [
  { id: 'Cu2+', name: 'Copper(II)', salt: '0.1 M CuSO₄' },
  { id: 'Fe2+', name: 'Iron(II)', salt: '0.1 M FeSO₄' },
  { id: 'Fe3+', name: 'Iron(III)', salt: '0.1 M FeCl₃' },
  { id: 'Al3+', name: 'Aluminium(III)', salt: '0.2 M Al(NO₃)₃' },
];

const REAGENTS: { id: PipetteTool; label: string; conc: string }[] = [
  { id: 'NaOH', label: 'NaOH(aq)', conc: '0.5 mol dm⁻³' },
  { id: 'NH3', label: 'NH₃(aq)', conc: '2.0 mol dm⁻³' },
  { id: 'Na2CO3', label: 'Na₂CO₃(aq)', conc: '0.5 mol dm⁻³' },
];

export const Lab11TransitionMetals: React.FC<Lab11Props> = ({
  observations,
  onRecordWell,
  onMarkLabComplete,
}) => {
  const [selectedPipette, setSelectedPipette] = useState<PipetteTool>('NaOH');
  const [wellDrops, setWellDrops] = useState<Record<string, number>>({});
  const [airOxidised, setAirOxidised] = useState<boolean>(false);
  const [activeWell, setActiveWell] = useState<string>('Cu2+-NaOH');

  const testedCount = Object.values(observations).filter((o) => o.tested).length;

  useEffect(() => {
    if (testedCount >= 8) {
      onMarkLabComplete();
    }
  }, [testedCount, onMarkLabComplete]);

  const handleAddDrops = (ion: IonId, col: PipetteTool, amount: number) => {
    const key = `${ion}-${col}`;
    setActiveWell(key);
    setSelectedPipette(col);
    const nextDrops = Math.min(12, (wellDrops[key] || 0) + amount);
    setWellDrops((prev) => ({ ...prev, [key]: nextDrops }));

    const vis = getWellVisual(ion, col, nextDrops, airOxidised);
    onRecordWell(key, {
      wellId: key,
      ion,
      reagent:
        col === 'Na2CO3'
          ? 'Na2CO3'
          : col === 'NaOH'
          ? nextDrops >= 8
            ? 'NaOH-excess'
            : 'NaOH-drops'
          : nextDrops >= 8
          ? 'NH3-excess'
          : 'NH3-drops',
      tested: true,
      studentObservation: vis.text,
    });
  };

  const handleResetMat = () => {
    setWellDrops({});
    setAirOxidised(false);
  };

  const [activeIon, activeCol] = activeWell.split('-') as [IonId, PipetteTool];
  const activeDrops = wellDrops[activeWell] || 0;
  const activeVisual = getWellVisual(activeIon, activeCol, activeDrops, airOxidised);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Laminated White Paper Micro-Chemistry Sheet (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Laminated White Paper Reaction Grid (Reduced Scale)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any well to add 2 drops of its column reagent. Click repeatedly to reach excess (8–10 drops).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAirOxidised((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                airOxidised
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {airOxidised ? 'Step 10: Air Oxidation Active' : 'Step 10: Leave 5 min in Air'}
            </button>
            <button
              type="button"
              onClick={handleResetMat}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              title="Wipe laminated sheet clean"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Laminated Paper Grid */}
        <div className="bg-[#FDFDFD] border-2 border-slate-200 rounded-xl p-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-3">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 pb-1">
                  Metal Ion (2 drops)
                </th>
                {REAGENTS.map((r) => (
                  <th key={r.id} className="text-center pb-1">
                    <div className="text-xs font-semibold text-slate-900">+ {r.label}</div>
                    <div className="text-[10.5px] font-mono font-normal text-slate-500">{r.conc}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IONS.map((ion) => (
                <tr key={ion.id}>
                  <td className="pr-2 align-middle">
                    <div className="text-xs font-semibold text-slate-900">{ion.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{ion.salt}</div>
                  </td>
                  {REAGENTS.map((r) => {
                    const key = `${ion.id}-${r.id}`;
                    const drops = wellDrops[key] || 0;
                    const vis = getWellVisual(ion.id, r.id, drops, airOxidised);
                    const isSelected = activeWell === key;

                    return (
                      <td key={key} className="text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleAddDrops(ion.id, r.id, 2)}
                          className={`group w-full flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                              : 'border-slate-200 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {/* Circular Droplet on Laminated Sheet */}
                          <div
                            className="w-16 h-16 rounded-full border border-slate-300 relative flex items-center justify-center overflow-hidden transition-colors duration-300 shadow-inner"
                            style={{ backgroundColor: vis.bg }}
                          >
                            {/* Precipitate cloud */}
                            {vis.pptColor && (
                              <div
                                className="w-11 h-11 rounded-full blur-[1px] transition-all duration-300"
                                style={{
                                  backgroundColor: vis.pptColor,
                                  opacity: vis.pptOpacity || 0.9,
                                  border:
                                    vis.pptColor === '#FFFFFF'
                                      ? '1.5px solid #CBD5E1'
                                      : vis.oxidisedRim
                                      ? '4px solid #B45309'
                                      : 'none',
                                }}
                              />
                            )}
                            {/* Effervescence CO2 bubbles */}
                            {vis.bubbles && (
                              <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-white border border-slate-400 animate-bubble" />
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-white border border-slate-400 animate-bubble"
                                  style={{ animationDelay: '0.35s' }}
                                />
                                <span
                                  className="w-2 h-2 rounded-full bg-white border border-slate-400 animate-bubble"
                                  style={{ animationDelay: '0.7s' }}
                                />
                              </div>
                            )}
                          </div>

                          <div className="mt-2 text-[10.5px] font-mono text-slate-600">
                            {drops === 0
                              ? 'Initial soln'
                              : drops >= 8
                              ? `${drops} drops (excess)`
                              : `${drops} drops`}
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Inspection & Dropper Panel (4 cols) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-semibold text-slate-900">Active Well Inspection</h4>
          <span className="text-xs font-mono text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {testedCount}/12 tested
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">
              {activeIon} + {activeCol}
            </span>
            <span className="font-mono text-slate-500">{activeDrops} drops added</span>
          </div>
          <p className="text-xs text-slate-800 leading-relaxed">{activeVisual.text}</p>
          <div className="text-xs font-mono text-blue-800 bg-blue-50 border border-blue-100 rounded px-2.5 py-1.5">
            Species: {activeVisual.formula}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Dispense into {activeIon} + {activeCol}</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleAddDrops(activeIon, activeCol, 2)}
              className="py-2 px-3 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 flex items-center justify-center gap-1.5"
            >
              <Droplet className="w-3.5 h-3.5" />
              +2 Drops
            </button>
            <button
              type="button"
              onClick={() => handleAddDrops(activeIon, activeCol, 8)}
              className="py-2 px-3 rounded-lg border border-blue-600 bg-blue-50 text-blue-900 text-xs font-medium hover:bg-blue-100"
            >
              Add Excess (+8)
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-xs font-semibold text-slate-700">Key AQA Diagnostic Tests to Verify</div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            <li>Cu²⁺ + excess NH₃ → deep royal blue solution [Cu(NH₃)₄(H₂O)₂]²⁺</li>
            <li>Al³⁺ + excess NaOH → white ppt dissolves to colourless [Al(H₂O)₂(OH)₄]⁻</li>
            <li>Fe²⁺ + NaOH left 5 min → green ppt oxidises to brown on air exposure</li>
            <li>Fe³⁺ &amp; Al³⁺ + Na₂CO₃ → hydroxide ppt + CO₂ effervescence</li>
          </ul>
          <p className="text-[11px] text-slate-400 pt-1">
            Selected pipette: <span className="font-mono text-slate-600">{selectedPipette}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
