export type PracticalId =
  | '7a'
  | '7b'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12b'
  | '12c';

export type WorkspaceTab =
  | 'lab'
  | 'method'
  | 'results'
  | 'questions'
  | 'exam';

export type AppSection = 'overview' | 'practical' | 'cpac' | 'manual';

export interface Run7a {
  runIndex: number;
  volA: number;
  volB: number;
  volWater: number;
  timeSeconds: number | null;
}

export interface Point7b {
  time: number;
  volume: number;
}

export interface Reading8 {
  solution: 'A' | 'B' | 'C' | 'D' | 'E';
  ratioLabel: string;
  fe3ToFe2Ratio: number;
  emf: number | null;
}

export type TitrationComboId =
  | 'hcl-naoh'
  | 'hcl-nh3'
  | 'ch3cooh-naoh'
  | 'ch3cooh-nh3';

export interface TitrationRecord {
  comboId: TitrationComboId;
  indicator: 'phenolphthalein' | 'methyl-orange';
  points: { volume: number; pH: number }[];
  endPointMark: { volume: number; pH: number } | null;
  equivalenceMark: { volume: number; pH: number } | null;
  completed: boolean;
}

export interface AspirinData {
  salicylicAcidMass: number | null;
  crudeMass: number | null;
  pureMass: number | null;
  tlcCompleted: boolean;
  rfSalicylic: number | null;
  rfCrudeSpots: number[];
  rfPureAspirin: number | null;
  mpSalicylic: number | null;
  mpCrude: number | null;
  mpPure: number | null;
  stagesCompleted: number[];
}

export interface TransitionMetalObservation {
  wellId: string;
  ion: 'Cu2+' | 'Fe2+' | 'Fe3+' | 'Al3+';
  reagent: 'initial' | 'NaOH-drops' | 'NaOH-excess' | 'NH3-drops' | 'NH3-excess' | 'Na2CO3' | 'air-oxidation';
  tested: boolean;
  studentObservation: string;
}

export interface DipeptideData {
  hydrolysed: boolean;
  chromatogramDeveloped: boolean;
  solventFrontMm: number | null;
  asparticAcidMm: number | null;
  phenylalanineMm: number | null;
  sampleSpot1Mm: number | null;
  sampleSpot2Mm: number | null;
  researchNotes: {
    aspartameStructure: string;
    acidHydrolysis: string;
    alkalineHydrolysis: string;
    references: string;
  };
}

export interface MedicinesTlcData {
  remedyPreset: 'aspirin-paracetamol' | 'paracetamol-caffeine' | 'aspirin-caffeine';
  plateDeveloped: boolean;
  uvViewed: boolean;
  solventFrontMm: number | null;
  aspirinMm: number | null;
  caffeineMm: number | null;
  paracetamolMm: number | null;
  ibuprofenMm: number | null;
  remedySpotsMm: string;
}

export interface PracticalProgressState {
  methodStepsChecked: number[];
  labCompleted: boolean;
  answers: Record<string, string>;
  examAnswers: Record<string, string>;
  selfMarkedScore: Record<string, number>;
  cpacChecked: Record<string, boolean>;
  notes: string;
}

export interface CpacRecord {
  code: string;
  achieved: boolean;
  evidenceNote: string;
  linkedPracticals: PracticalId[];
}

export interface WorkbookState {
  version: number;
  studentName: string;
  classGroup: string;
  lastSavedAt: string | null;
  practicals: Record<PracticalId, PracticalProgressState>;
  labData: {
    '7a': {
      runs: Run7a[];
      variablesTask: string;
    };
    '7b': {
      readings: Point7b[];
      vFinal: number | null;
      graphOrderA: string;
      graphOrderB: string;
      bgTechniques: string;
      bgObservations: string;
      bgExplanations: string;
      evaluation: string;
      examPlottedPoints: { t: number; c: number }[];
    };
    '8': {
      readings: Reading8[];
      diagramLabels: Record<string, string>;
    };
    '9': {
      titrations: Record<TitrationComboId, TitrationRecord>;
    };
    '10': AspirinData;
    '11': {
      observations: Record<string, TransitionMetalObservation>;
    };
    '12b': DipeptideData;
    '12c': MedicinesTlcData;
  };
  cpacRecords: Record<string, CpacRecord>;
}

export interface WorkbookQuestion {
  id: string;
  number: string;
  prompt: string;
  marks: number;
  cpac?: string;
  guidance: string;
  rows?: number;
}

export interface ExamQuestionItem {
  id: string;
  part: string;
  stem?: string;
  prompt: string;
  marks: number;
  markscheme: string[];
  hasGraph?: 'cp7-fig1' | 'cp7-fig2' | 'cp9-nh4cl' | 'cp12c-structures';
  rows?: number;
}

export interface PracticalDefinition {
  id: PracticalId;
  code: string;
  category: 'Core Practical' | 'Optional Practical';
  title: string;
  shortTitle: string;
  lessonReference: string;
  cpacTags: string[];
  pages: string;
  summary: string;
  background: string[];
  equations?: string[];
  safety: string[];
  equipment: string[];
  method: string[];
  questions: WorkbookQuestion[];
  examSectionTitle?: string;
  examIntro?: string[];
  examTotalMarks?: number;
  examQuestions?: ExamQuestionItem[];
}

export interface CpacCriterion {
  code: string;
  groupNumber: number;
  groupTitle: string;
  descriptor: string;
  teacherGuidance: string;
}
