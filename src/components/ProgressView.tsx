import React, { useState } from 'react';
import { LearningProgress, ErrorCategory } from '../types/math';
import { DEMO_PROBLEMS, ERROR_RULES_HANDBOOK } from '../data/problems';
import { MathView } from './MathView';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookMarked,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ClipboardCopy,
  Check,
} from 'lucide-react';

interface ProgressViewProps {
  progress: LearningProgress;
  onResetProgress: () => void;
  onGoToPractice: () => void;
}

const ERROR_NAMES: Record<ErrorCategory, string> = {
  distributive_property: 'Phân phối phép nhân',
  bracket_sign: 'Dấu khi bỏ ngoặc',
  transposition_rule: 'Chuyển vế đổi dấu',
  coefficient_division: 'Chia hệ số của ẩn',
  combine_like_terms: 'Thu gọn đơn thức đồng dạng',
};

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  onResetProgress,
  onGoToPractice,
}) => {
  const [copied, setCopied] = useState(false);

  const totalProblems = DEMO_PROBLEMS.length;
  const attemptedCount = progress.problemsAttempted.length;
  const solvedCount = progress.problemsSolved.length;
  const accuracy =
    progress.totalAttemptsCount > 0
      ? Math.round((progress.correctAttemptsCount / progress.totalAttemptsCount) * 100)
      : 0;

  // Danh sách các quy tắc cần ôn tập (dựa trên các lỗi học sinh gặp trong phiên)
  const encounteredCategories = Object.keys(progress.encounteredErrors) as ErrorCategory[];
  const rulesToReview = ERROR_RULES_HANDBOOK.filter((rule) =>
    encounteredCategories.includes(rule.category)
  );

  const handleCopyReport = () => {
    const reportText = `[BÁO CÁO TIẾN BỘ PHIÊN HỌC - AI MATH TUTOR (XD-01)]
- Số bài đã mở thử: ${attemptedCount} / ${totalProblems} bài
- Số bước sửa đúng: ${progress.correctAttemptsCount} lần
- Số bài đã sửa đúng lỗi: ${solvedCount} / ${totalProblems} bài
- Tỷ lệ chính xác các lần thử: ${accuracy}%
- Số lượt xem gợi ý: ${progress.hintsUsedTotal} lượt
- Các nhóm lỗi đã gặp: ${encounteredCategories.map((c) => ERROR_NAMES[c]).join(', ') || 'Chưa ghi nhận'}
Ghi nhận theo thời gian thực trong phiên làm việc.`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Tiến độ học tập cá nhân</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Tiến bộ của em trong phiên
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Chỉ số được ghi nhận theo thời gian thực từ các thao tác giải toán trong phiên thử nghiệm hiện tại (không lưu trữ hồ sơ học sinh thực tế).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-4 h-4 text-slate-500" />
                  <span>Sao chép tóm tắt</span>
                </>
              )}
            </button>

            <button
              onClick={onResetProgress}
              className="px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm mới phiên</span>
            </button>
          </div>
        </div>

        {/* 4 Chỉ số thống kê chính */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
            <div className="text-xs font-medium text-blue-800">Số bài đã thử</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-900 mt-1">
              {attemptedCount} <span className="text-sm font-normal text-blue-600">/ {totalProblems}</span>
            </div>
            <div className="text-[11px] text-blue-700 mt-1">Trong bộ tình huống demo</div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <div className="text-xs font-medium text-emerald-800">Bước sửa đúng</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-900 mt-1">
              {progress.correctAttemptsCount}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              Đã sửa đúng lỗi: {solvedCount} / {totalProblems} bài
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl">
            <div className="text-xs font-medium text-amber-800">Tỷ lệ chính xác</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-900 mt-1">
              {accuracy}%
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              Qua {progress.totalAttemptsCount} lượt gửi bước sửa
            </div>
          </div>

          <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl">
            <div className="text-xs font-medium text-purple-800">Gợi ý đã tham khảo</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-900 mt-1">
              {progress.hintsUsedTotal}
            </div>
            <div className="text-[11px] text-purple-700 mt-1">Cấp độ 1, 2, 3</div>
          </div>
        </div>
      </div>

      {/* Grid: Các nhóm lỗi đã gặp & Những quy tắc cần ôn tập */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nhóm lỗi đã gặp */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Các nhóm lỗi đã gặp trong phiên
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {encounteredCategories.length} nhóm
            </span>
          </div>

          {encounteredCategories.length > 0 ? (
            <div className="space-y-3">
              {encounteredCategories.map((category) => {
                const count = progress.encounteredErrors[category] || 0;
                return (
                  <div
                    key={category}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-800">
                        {ERROR_NAMES[category] || category}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Mã: {category}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        {count} lần gặp
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs sm:text-sm space-y-2">
              <p>Bạn chưa thực hiện kiểm tra bài toán nào trong phiên này.</p>
              <button
                onClick={onGoToPractice}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Bắt đầu bài tập đầu tiên</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Những quy tắc cần ôn tập */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Những quy tắc cần ôn tập
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Gợi ý dựa trên bài đã làm
            </span>
          </div>

          {rulesToReview.length > 0 ? (
            <div className="space-y-3">
              {rulesToReview.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1.5"
                >
                  <div className="font-bold text-xs sm:text-sm text-blue-900">
                    {rule.name}
                  </div>
                  <div className="font-mono text-xs text-slate-700 bg-white/80 p-2 rounded border border-blue-100">
                    <MathView math={rule.formula} />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {rule.tip}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs sm:text-sm space-y-2">
              <p>Chưa có quy tắc nào cần lưu ý đặc biệt. Hãy luyện tập thêm để hệ thống cá nhân hóa đề xuất cho em!</p>
            </div>
          )}
        </div>
      </div>

      {/* Danh sách các bài đã hoàn thành */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Danh sách bài tập trong phiên ({solvedCount}/{totalProblems} đã hoàn thành)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEMO_PROBLEMS.map((prob) => {
            const isSolved = progress.problemsSolved.includes(prob.id);
            const isAttempted = progress.problemsAttempted.includes(prob.id);

            return (
              <div
                key={prob.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  isSolved
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : isAttempted
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-slate-200 bg-slate-50/50 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{prob.title}</span>
                  {isSolved ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      Đã sửa đúng
                    </span>
                  ) : isAttempted ? (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                      Đang luyện
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-medium rounded text-[10px]">
                      Chưa thử
                    </span>
                  )}
                </div>

                <div className="font-mono text-slate-900">
                  <MathView math={prob.originalProblemLatex} />
                </div>

                <div className="text-[11px] text-slate-500">
                  Chủ đề: {prob.topicLabel} ({prob.gradeLevel})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
