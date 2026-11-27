import { useCallback, useEffect, useState } from 'react';
import { CPAC_CRITERIA, PRACTICAL_ORDER, PRACTICALS } from '../data/practicalsData';
import {
  PracticalId,
  PracticalProgressState,
  TitrationComboId,
  WorkbookState,
} from '../types/workbook';

const STORAGE_KEY = 'aqa_a2_chem_workbook_v1';

function createEmptyPracticalState(): PracticalProgressState {
  return {
    methodStepsChecked: [],
    labCompleted: false,
    answers: {},
    examAnswers: {},
    selfMarkedScore: {},
    cpacChecked: {},
    notes: '',
  };
}

export function createInitialWorkbookState(): WorkbookState {
  const practicals = {} as Record<PracticalId, PracticalProgressState>;
  PRACTICAL_ORDER.forEach((id) => {
    practicals[id] = createEmptyPracticalState();
  });

  const cpacRecords: WorkbookState['cpacRecords'] = {};
  CPAC_CRITERIA.forEach((c) => {
    const linked = PRACTICAL_ORDER.filter((pid) => PRACTICALS[pid].cpacTags.includes(c.code));
    cpacRecords[c.code] = {
      code: c.code,
      achieved: false,
      evidenceNote: '',
      linkedPracticals: linked,
    };
  });

  const emptyTitration = (comboId: TitrationComboId) => ({
    comboId,
    indicator: comboId === 'hcl-nh3' ? ('methyl-orange' as const) : ('phenolphthalein' as const),
    points: [],
    endPointMark: null,
    equivalenceMark: null,
    completed: false,
  });

  return {
    version: 1,
    studentName: '',
    classGroup: '',
    lastSavedAt: null,
    practicals,
    labData: {
      '7a': {
        runs: [
          { runIndex: 0, volA: 40, volB: 40, volWater: 0, timeSeconds: null },
          { runIndex: 1, volA: 40, volB: 20, volWater: 20, timeSeconds: null },
          { runIndex: 2, volA: 40, volB: 10, volWater: 30, timeSeconds: null },
          { runIndex: 3, volA: 40, volB: 5, volWater: 35, timeSeconds: null },
        ],
        variablesTask: '',
      },
      '7b': {
        readings: [],
        vFinal: null,
        graphOrderA: '',
        graphOrderB: '',
        bgTechniques: '',
        bgObservations: '',
        bgExplanations: '',
        evaluation: '',
        examPlottedPoints: [],
      },
      '8': {
        readings: [
          { solution: 'A', ratioLabel: '1 : 5', fe3ToFe2Ratio: 0.2, emf: null },
          { solution: 'B', ratioLabel: '1 : 2', fe3ToFe2Ratio: 0.5, emf: null },
          { solution: 'C', ratioLabel: '1 : 1', fe3ToFe2Ratio: 1.0, emf: null },
          { solution: 'D', ratioLabel: '2 : 1', fe3ToFe2Ratio: 2.0, emf: null },
          { solution: 'E', ratioLabel: '5 : 1', fe3ToFe2Ratio: 5.0, emf: null },
        ],
        diagramLabels: {},
      },
      '9': {
        titrations: {
          'hcl-naoh': emptyTitration('hcl-naoh'),
          'hcl-nh3': emptyTitration('hcl-nh3'),
          'ch3cooh-naoh': emptyTitration('ch3cooh-naoh'),
          'ch3cooh-nh3': emptyTitration('ch3cooh-nh3'),
        },
      },
      '10': {
        salicylicAcidMass: null,
        crudeMass: null,
        pureMass: null,
        tlcCompleted: false,
        rfSalicylic: null,
        rfCrudeSpots: [],
        rfPureAspirin: null,
        mpSalicylic: null,
        mpCrude: null,
        mpPure: null,
        stagesCompleted: [],
      },
      '11': {
        observations: {},
      },
      '12b': {
        hydrolysed: false,
        chromatogramDeveloped: false,
        solventFrontMm: null,
        asparticAcidMm: null,
        phenylalanineMm: null,
        sampleSpot1Mm: null,
        sampleSpot2Mm: null,
        researchNotes: {
          aspartameStructure: '',
          acidHydrolysis: '',
          alkalineHydrolysis: '',
          references: '',
        },
      },
      '12c': {
        remedyPreset: 'aspirin-paracetamol',
        plateDeveloped: false,
        uvViewed: false,
        solventFrontMm: null,
        aspirinMm: null,
        caffeineMm: null,
        paracetamolMm: null,
        ibuprofenMm: null,
        remedySpotsMm: '',
      },
    },
    cpacRecords,
  };
}

function loadFromStorage(): WorkbookState {
  const initial = createInitialWorkbookState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<WorkbookState>;
    return {
      ...initial,
      ...parsed,
      practicals: {
        ...initial.practicals,
        ...(parsed.practicals || {}),
      },
      labData: {
        ...initial.labData,
        ...(parsed.labData || {}),
      },
      cpacRecords: {
        ...initial.cpacRecords,
        ...(parsed.cpacRecords || {}),
      },
    };
  } catch {
    return initial;
  }
}

export interface PracticalCompletionStats {
  percent: number;
  labDone: boolean;
  questionsAnswered: number;
  questionsTotal: number;
  examAnswered: number;
  examTotal: number;
  methodChecked: number;
  methodTotal: number;
}

export function computePracticalStats(
  state: WorkbookState,
  id: PracticalId
): PracticalCompletionStats {
  const def = PRACTICALS[id];
  const p = state.practicals[id];
  const questionsTotal = def.questions.length;
  const questionsAnswered = def.questions.filter(
    (q) => (p.answers[q.id] || '').trim().length > 0
  ).length;

  const examTotal = def.examQuestions?.length || 0;
  const examAnswered = (def.examQuestions || []).filter(
    (q) => (p.examAnswers[q.id] || '').trim().length > 0
  ).length;

  const methodTotal = def.method.length;
  const methodChecked = p.methodStepsChecked.length;

  // Weighted progress: Lab 45%, Workbook Questions 35%, Exam / Method 20%
  const labPart = p.labCompleted ? 45 : methodChecked > 0 ? Math.min(20, (methodChecked / Math.max(1, methodTotal)) * 20) : 0;
  const qPart = questionsTotal > 0 ? (questionsAnswered / questionsTotal) * 35 : 35;
  const examPart =
    examTotal > 0
      ? (examAnswered / examTotal) * 20
      : (methodChecked / Math.max(1, methodTotal)) * 20;

  return {
    percent: Math.round(labPart + qPart + examPart),
    labDone: p.labCompleted,
    questionsAnswered,
    questionsTotal,
    examAnswered,
    examTotal,
    methodChecked,
    methodTotal,
  };
}

export function useWorkbookStore() {
  const [state, setState] = useState<WorkbookState>(() => loadFromStorage());
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Auto-save to localStorage whenever state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  const triggerSaveNotice = useCallback((msg: string) => {
    setSaveNotice(msg);
    window.setTimeout(() => {
      setSaveNotice((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  const manualSave = useCallback(() => {
    const now = new Date().toISOString();
    setState((prev) => {
      const next = { ...prev, lastSavedAt: now };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    triggerSaveNotice('Progress saved locally');
  }, [triggerSaveNotice]);

  const updateProfile = useCallback((studentName: string, classGroup: string) => {
    setState((prev) => ({
      ...prev,
      studentName,
      classGroup,
      lastSavedAt: new Date().toISOString(),
    }));
  }, []);

  const updatePractical = useCallback(
    (
      id: PracticalId,
      updater: (current: PracticalProgressState) => PracticalProgressState
    ) => {
      setState((prev) => ({
        ...prev,
        lastSavedAt: new Date().toISOString(),
        practicals: {
          ...prev.practicals,
          [id]: updater(prev.practicals[id]),
        },
      }));
    },
    []
  );

  const updateLabData = useCallback(
    <K extends keyof WorkbookState['labData']>(
      key: K,
      updater: (current: WorkbookState['labData'][K]) => WorkbookState['labData'][K]
    ) => {
      setState((prev) => ({
        ...prev,
        lastSavedAt: new Date().toISOString(),
        labData: {
          ...prev.labData,
          [key]: updater(prev.labData[key]),
        },
      }));
    },
    []
  );

  const updateCpac = useCallback(
    (code: string, patch: Partial<{ achieved: boolean; evidenceNote: string }>) => {
      setState((prev) => ({
        ...prev,
        lastSavedAt: new Date().toISOString(),
        cpacRecords: {
          ...prev.cpacRecords,
          [code]: {
            ...prev.cpacRecords[code],
            ...patch,
          },
        },
      }));
    },
    []
  );

  const exportWorkbookJson = useCallback(() => {
    const payload = {
      ...state,
      lastSavedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (state.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `AQA_A2_Chemistry_Workbook_${safeName}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    manualSave();
    triggerSaveNotice('Workbook backup exported (.json)');
  }, [state, manualSave, triggerSaveNotice]);

  const importWorkbookJson = useCallback(
    (file: File): Promise<{ ok: boolean; message: string }> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result)) as Partial<WorkbookState>;
            if (!parsed || typeof parsed !== 'object' || !parsed.practicals || !parsed.labData) {
              resolve({ ok: false, message: 'Selected file is not a valid AQA Chemistry workbook backup.' });
              return;
            }
            const base = createInitialWorkbookState();
            const merged: WorkbookState = {
              ...base,
              ...parsed,
              practicals: { ...base.practicals, ...parsed.practicals },
              labData: { ...base.labData, ...parsed.labData },
              cpacRecords: { ...base.cpacRecords, ...(parsed.cpacRecords || {}) },
              lastSavedAt: new Date().toISOString(),
            };
            setState(merged);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            triggerSaveNotice('Workbook restored from backup');
            resolve({ ok: true, message: 'Workbook progress loaded successfully.' });
          } catch {
            resolve({ ok: false, message: 'Could not read JSON file. Please check the file format.' });
          }
        };
        reader.onerror = () => resolve({ ok: false, message: 'Failed to read the selected file.' });
        reader.readAsText(file);
      });
    },
    [triggerSaveNotice]
  );

  const resetAllProgress = useCallback(() => {
    const fresh = createInitialWorkbookState();
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    triggerSaveNotice('All workbook progress reset');
  }, [triggerSaveNotice]);

  const overallPercent = Math.round(
    PRACTICAL_ORDER.reduce((acc, id) => acc + computePracticalStats(state, id).percent, 0) /
      PRACTICAL_ORDER.length
  );

  const completedLabsCount = PRACTICAL_ORDER.filter(
    (id) => state.practicals[id].labCompleted
  ).length;

  const achievedCpacCount = Object.values(state.cpacRecords).filter((c) => c.achieved).length;

  return {
    state,
    saveNotice,
    overallPercent,
    completedLabsCount,
    achievedCpacCount,
    manualSave,
    updateProfile,
    updatePractical,
    updateLabData,
    updateCpac,
    exportWorkbookJson,
    importWorkbookJson,
    resetAllProgress,
  };
}
