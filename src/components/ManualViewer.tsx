import React from 'react';
import { Download, FileText } from 'lucide-react';

const PDF_URL = '/assets/aistudio/YEAR_2_-_TCS_AQA_CHEMISTRY_Laboratory_Manual_c4bff3e3.pdf';

export const ManualViewer: React.FC = () => {
  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Original A2 Laboratory Manual (46 Pages)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              The Cotswold School · AQA A-Level Chemistry Core Practicals 7a, 7b, 8, 9, 10, 11, 12b &amp; Optional Practical 12c
            </p>
          </div>
        </div>

        <a
          href={PDF_URL}
          download="AQA_A2_Chemistry_Laboratory_Manual.pdf"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Download Original PDF
        </a>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[76vh]">
        <iframe
          src={PDF_URL}
          title="AQA A2 Chemistry Laboratory Manual PDF"
          className="w-full h-full border-0"
        />
      </div>
    </main>
  );
};
