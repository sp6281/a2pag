import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PracticalWorkspace } from './components/PracticalWorkspace';
import { CpacTracker } from './components/CpacTracker';
import { ManualViewer } from './components/ManualViewer';
import { SaveModal } from './components/SaveModal';
import { useWorkbookStore } from './hooks/useWorkbookStore';
import { AppSection, PracticalId, WorkspaceTab } from './types/workbook';

export default function App() {
  const {
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
  } = useWorkbookStore();

  const [section, setSection] = useState<AppSection>('overview');
  const [selectedPractical, setSelectedPractical] = useState<PracticalId>('7a');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('lab');
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);

  const handleSelectPractical = (id: PracticalId, tab: WorkspaceTab = 'lab') => {
    setSelectedPractical(id);
    setWorkspaceTab(tab);
    setSection('practical');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (next: AppSection) => {
    setSection(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Header
        activeSection={section}
        onNavigate={handleNavigate}
        onOpenSaveModal={() => setSaveModalOpen(true)}
      />

      <div className="flex-1">
        {section === 'overview' && (
          <OverviewDashboard
            state={state}
            overallPercent={overallPercent}
            completedLabsCount={completedLabsCount}
            achievedCpacCount={achievedCpacCount}
            onSelectPractical={handleSelectPractical}
            onOpenSaveModal={() => setSaveModalOpen(true)}
            onOpenCpac={() => handleNavigate('cpac')}
          />
        )}

        {section === 'practical' && (
          <PracticalWorkspace
            practicalId={selectedPractical}
            activeTab={workspaceTab}
            state={state}
            onSelectPractical={(id) => handleSelectPractical(id, workspaceTab)}
            onChangeTab={setWorkspaceTab}
            onUpdatePractical={updatePractical}
            onUpdateLabData={updateLabData}
          />
        )}

        {section === 'cpac' && (
          <CpacTracker
            state={state}
            onUpdateCpac={updateCpac}
            onSelectPractical={(id) => handleSelectPractical(id, 'lab')}
          />
        )}

        {section === 'manual' && <ManualViewer />}
      </div>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 no-print">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>AQA A-Level Chemistry (Year 2 / A2) Electronic Workbook &amp; Virtual Laboratory</span>
          <span>Auto-saved locally · Export JSON anytime for backup</span>
        </div>
      </footer>

      {/* Save Confirmation Toast */}
      {saveNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {saveNotice}
        </div>
      )}

      <SaveModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        state={state}
        overallPercent={overallPercent}
        onManualSave={manualSave}
        onUpdateProfile={updateProfile}
        onExportJson={exportWorkbookJson}
        onImportJson={importWorkbookJson}
        onResetAll={resetAllProgress}
      />
    </div>
  );
}
