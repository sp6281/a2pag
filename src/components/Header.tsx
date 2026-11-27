import React from 'react';
import { Save } from 'lucide-react';
import { AppSection } from '../types/workbook';

interface HeaderProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  onOpenSaveModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  onOpenSaveModal,
}) => {
  const navItems: { id: AppSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'practical', label: 'Practicals' },
    { id: 'cpac', label: 'CPAC Tracker' },
    { id: 'manual', label: 'Manual PDF' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 no-print">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-700 transition-colors"
        >
          AQA A2 Chemistry Lab
        </button>

        {/* Zone 2: 4 Clean Single-Line Navigation Links */}
        <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  active
                    ? 'text-blue-700 border-blue-700'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenSaveModal}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Progress
          </button>
        </div>
      </div>
    </header>
  );
};
