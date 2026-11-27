import React, { useRef, useState } from 'react';
import { X, Save, Download, Upload, Printer, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { WorkbookState } from '../types/workbook';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: WorkbookState;
  overallPercent: number;
  onManualSave: () => void;
  onUpdateProfile: (name: string, classGroup: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => Promise<{ ok: boolean; message: string }>;
  onResetAll: () => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  state,
  overallPercent,
  onManualSave,
  onUpdateProfile,
  onExportJson,
  onImportJson,
  onResetAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const formattedSaved = state.lastSavedAt
    ? new Date(state.lastSavedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not yet saved manually';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await onImportJson(file);
    setImportFeedback(res);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 no-print">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Save &amp; Progress Backup</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes auto-save in your browser · Last saved: <span className="font-mono">{formattedSaved}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Student Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={state.studentName}
                onChange={(e) => onUpdateProfile(e.target.value, state.classGroup)}
                placeholder="e.g. Alex Taylor"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Class / Candidate Group
              </label>
              <input
                type="text"
                value={state.classGroup}
                onChange={(e) => onUpdateProfile(state.studentName, e.target.value)}
                placeholder="e.g. 13C Chemistry"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Progress summary line */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Current Overall Workbook Completion</span>
            <span className="text-sm font-mono font-bold tabular-nums text-blue-700">{overallPercent}%</span>
          </div>

          {/* Save & File Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onManualSave}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Now to Browser Storage
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExportJson}
                className="py-2.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Export Save File (.json)
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                Load Save File (.json)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                window.setTimeout(() => window.print(), 150);
              }}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Print Current View / Save as PDF
            </button>
          </div>

          {importFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                importFeedback.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {importFeedback.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{importFeedback.message}</span>
            </div>
          )}

          {/* Reset danger zone */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">Need a fresh workbook?</span>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-xs font-medium text-red-700 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Progress
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetAll();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-red-700 text-white font-medium hover:bg-red-800"
                >
                  Confirm Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
