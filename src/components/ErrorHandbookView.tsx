import React, { useState } from 'react';
import { ERROR_RULES_HANDBOOK } from '../data/problems';
import { MathView } from './MathView';
import { BookOpen, AlertOctagon, Lightbulb, CheckCircle, Search, ShieldCheck } from 'lucide-react';
import { ErrorCategory } from '../types/math';

interface ErrorHandbookViewProps {
  onPracticeTopic?: (category: ErrorCategory) => void;
}

export const ErrorHandbookView: React.FC<ErrorHandbookViewProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRules = ERROR_RULES_HANDBOOK.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.commonMistake.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white space-y-3 shadow-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-xs">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Sổ tay sư phạm Toán THCS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Phân tích lỗi sai & Sổ tay quy tắc
        </h1>
        <p className="text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
          Tổng hợp các quy tắc đại số quan trọng nhất cùng các "bẫy" sai lầm phổ biến mà học sinh lớp 7 và lớp 8 thường gặp. Hiểu rõ nguyên nhân giúp em không bao giờ lặp lại lỗi cũ.
        </p>

        {/* Thanh tìm kiếm */}
        <div className="pt-2 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm quy tắc, lỗi sai (VD: ngoặc, chuyển vế...)"
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-slate-400 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Danh sách các quy tắc & lỗi sai */}
      <div className="space-y-6">
        {filteredRules.map((rule, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs hover:border-slate-300 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                  0{idx + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {rule.name}
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 self-start sm:self-auto">
                {rule.category}
              </span>
            </div>

            {/* Công thức chuẩn */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-center">
              <div className="text-base sm:text-xl font-bold font-mono text-blue-900">
                <MathView math={rule.formula} displayMode={true} />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {rule.description}
            </p>

            {/* Grid so sánh: Bẫy lỗi thường gặp & Mẹo ghi nhớ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Bẫy lỗi sai thường gặp</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">
                  {rule.commonMistake}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Mẹo vàng ghi nhớ ("Khẩu quyết")</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  {rule.tip}
                </p>
              </div>
            </div>
          </div>
        ))}

        {filteredRules.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            Không tìm thấy quy tắc nào phù hợp với từ khóa "{searchQuery}".
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Biên soạn theo chương trình GDPT môn Toán THCS hiện hành.</span>
        </div>
      </div>
    </div>
  );
};
