import React from 'react';
import { BookOpen, Award, CheckCircle2, Home, Compass, Sparkles } from 'lucide-react';

export type ActiveTab = 'home' | 'practice' | 'tutor' | 'handbook' | 'progress';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  solvedCount: number;
  totalProblemsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  solvedCount,
  totalProblemsCount,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="font-bold text-lg tracking-wider font-mono">∑</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  AI MATH <span className="text-blue-600">TUTOR</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                  XD-02B AI Tutor
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Học từ lỗi sai — Tiến bộ qua từng bước
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Trang chủ</span>
            </button>

            <button
              onClick={() => setActiveTab('practice')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'practice'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Luyện tập</span>
            </button>

            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tutor'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Trợ giảng AI</span>
            </button>

            <button
              onClick={() => setActiveTab('handbook')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'handbook'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Sổ tay quy tắc</span>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'progress'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Tiến bộ</span>
              {solvedCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-emerald-700 bg-emerald-100 rounded-full">
                  {solvedCount}/{totalProblemsCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
