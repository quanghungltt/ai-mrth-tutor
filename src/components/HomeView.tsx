import React from 'react';
import { MathTopic, LearningProgress } from '../types/math';
import { ArrowRight, CheckCircle2, AlertTriangle, Lightbulb, Target, Sparkles, BookCheck, ShieldCheck } from 'lucide-react';
import { MathView } from './MathView';

interface HomeViewProps {
  onStartPractice: (topic?: MathTopic) => void;
  onGoToTutor?: () => void;
  progress: LearningProgress;
  totalProblemsCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartPractice,
  onGoToTutor,
  progress,
  totalProblemsCount,
}) => {
  const solvedCount = progress.problemsSolved.length;
  const attemptedCount = progress.problemsAttempted.length;

  return (
    <div className="space-y-10 pb-16">
      {/* UI-01: Hero Section — Thu gọn 20-30% khoảng cách, cập nhật nhãn XD-02B */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/90 text-blue-800 text-xs sm:text-sm font-semibold tracking-wide border border-blue-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Trợ giảng Toán ứng dụng AI — XD-02B</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            AI MATH <span className="text-blue-600">TUTOR</span>
          </h1>

          <p className="text-lg sm:text-xl font-bold text-blue-700">
            Học từ lỗi sai — Tiến bộ qua từng bước
          </p>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Cùng tìm lỗi sai, hiểu bản chất và tự tin giải Toán. Ứng dụng giúp học sinh THCS nhận diện chính xác bước giải sai trong quá trình biến đổi đại số và giải phương trình, hiểu nguyên nhân gốc rễ và tự mình sửa đúng qua các câu hỏi gợi mở.
          </p>

          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onStartPractice()}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>Bắt đầu luyện tập ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onGoToTutor && (
              <button
                onClick={onGoToTutor}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold rounded-xl shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Trợ giảng AI đối thoại</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Giai đoạn XD-02B: Hoạt động trên bộ tình huống sư phạm được chuẩn hóa độc lập. Minh bạch, không giả lập AI.</span>
          </div>
        </div>
      </section>

      {/* UI-02: Hai chủ đề trọng tâm — Tinh chỉnh bố cục, viền và độ tương phản */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hai chủ đề nền tảng trọng tâm
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Tập trung vào hai nhóm kiến thức có tần suất mắc lỗi cao nhất ở bậc THCS (Lớp 7 & Lớp 8)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Card 1: Biến đổi biểu thức */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-lg border border-sky-200">
                  Đại số Lớp 7 - 8
                </span>
                <span className="text-xs font-medium text-slate-500">Kiến thức nền tảng</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                1. Biến đổi biểu thức đại số
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                Nhận diện và khắc phục các sai lầm kinh điển khi phá dấu ngoặc, đổi dấu hạng tử đứng sau dấu trừ, và quy tắc cộng trừ các đơn thức đồng dạng.
              </p>

              <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ví dụ tình huống:
                </div>
                <div className="text-sm text-slate-800 flex items-center gap-2">
                  <span className="font-medium text-slate-700">Rút gọn:</span>
                  <MathView math="A = 5 - (2x - 3)" />
                </div>
                <div className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>Bẫy lỗi: Quên đổi dấu của -3 khi phá ngoặc</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-auto">
              <button
                onClick={() => onStartPractice('expression')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Luyện tập Biến đổi biểu thức</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Giải phương trình */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
                  Đại số Lớp 8
                </span>
                <span className="text-xs font-medium text-slate-500">Phương trình bậc nhất</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                2. Giải phương trình bậc nhất một ẩn
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                Luyện thành thạo quy tắc phân phối phép nhân <MathView math="a(b+c)" />, quy tắc chuyển vế đổi dấu, và phép biến đổi chia cả hai vế cho hệ số của ẩn.
              </p>

              <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ví dụ tình huống:
                </div>
                <div className="text-sm text-slate-800 flex items-center gap-2">
                  <span className="font-medium text-slate-700">Giải:</span>
                  <MathView math="2(x + 3) = 14" />
                </div>
                <div className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>Bẫy lỗi: 2x + 3 = 14 (quên nhân 2 với 3)</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-auto">
              <button
                onClick={() => onStartPractice('equation')}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Luyện tập Giải phương trình</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* UI-03: Thống kê tiến bộ phiên hiện tại — Trình bày trực quan, giữ nguyên công thức */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookCheck className="w-5 h-5 text-blue-600" />
                <span>Tiến bộ trong phiên luyện tập hiện tại</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghi nhận trực tiếp từ các thao tác của bạn trong phiên làm việc này (không dùng dữ liệu giả).
              </p>
            </div>

            <div className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shadow-2xs">
              Đã hoàn thành {solvedCount} / {totalProblemsCount} bài
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5">
            <div className="bg-slate-50/90 rounded-xl p-3.5 sm:p-4 border border-slate-200/70 text-center hover:bg-slate-50 transition-colors">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono tracking-tight">
                {attemptedCount}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Bài đã mở thử</div>
            </div>

            <div className="bg-slate-50/90 rounded-xl p-3.5 sm:p-4 border border-slate-200/70 text-center hover:bg-slate-50 transition-colors">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
                {progress.correctAttemptsCount}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Bước sửa đúng</div>
            </div>

            <div className="bg-slate-50/90 rounded-xl p-3.5 sm:p-4 border border-slate-200/70 text-center hover:bg-slate-50 transition-colors">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
                {progress.hintsUsedTotal}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Gợi ý đã tham khảo</div>
            </div>

            <div className="bg-slate-50/90 rounded-xl p-3.5 sm:p-4 border border-slate-200/70 text-center hover:bg-slate-50 transition-colors">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono tracking-tight">
                {Object.keys(progress.encounteredErrors).length}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Nhóm lỗi đã tiếp cận</div>
            </div>
          </div>
        </div>
      </section>

      {/* UI-04: 3 Cấp độ gợi ý sư phạm — Tinh chỉnh thẻ, màu sắc và độ tương phản */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-5 sm:p-7 text-white shadow-md border border-slate-800">
          <div className="max-w-3xl space-y-3.5">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-300">
              Phương pháp tiếp cận sư phạm
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Không đưa ngay đáp án — Dẫn dắt từng bước bằng gợi mở
            </h3>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Mỗi tình huống lỗi sai được thiết kế với 3 cấp độ gợi ý bậc thang:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1.5">
              <div className="bg-white/10 rounded-xl p-3.5 sm:p-4 border border-white/15 backdrop-blur-xs hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>Cấp 1: Gợi mở</span>
                </div>
                <p className="text-xs text-blue-100/90 mt-2 leading-relaxed">
                  Đặt câu hỏi kích thích tư duy, giúp học sinh tự phát hiện vị trí bất thường.
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-3.5 sm:p-4 border border-white/15 backdrop-blur-xs hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 font-bold text-sky-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Cấp 2: Nhắc quy tắc</span>
                </div>
                <p className="text-xs text-blue-100/90 mt-2 leading-relaxed">
                  Tái hiện công thức toán học và quy tắc chuyển vế, phá ngoặc hoặc phân phối.
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-3.5 sm:p-4 border border-white/15 backdrop-blur-xs hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <Target className="w-4 h-4 shrink-0" />
                  <span>Cấp 3: Hướng dẫn sửa</span>
                </div>
                <p className="text-xs text-blue-100/90 mt-2 leading-relaxed">
                  Chỉ dẫn cụ thể phép tính cần làm lại nhưng ưu tiên không làm thay toàn bộ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
