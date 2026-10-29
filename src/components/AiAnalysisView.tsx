import React, { useState } from 'react';
import { AnalysisRequest, AnalysisResponse, StepAnalysisStatus, TutorChatContext } from '../types/math';
import { MathView } from './MathView';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  ShieldCheck,
  ShieldAlert,
  Info,
  Clock,
  ChevronRight,
  BookOpen,
  Check,
  MessageSquare,
} from 'lucide-react';

interface AiAnalysisViewProps {
  onOpenTutor?: (context: TutorChatContext) => void;
}

// Các mẫu đề bài kiểm thử nhanh theo đúng yêu cầu kiểm định
const TEST_PRESETS = [
  {
    name: 'Test 1: Lỗi phân phối',
    problemText: '2(x + 3) = 14',
    steps: ['2x + 3 = 14', '2x = 11', 'x = 11/2'],
    description: 'Lỗi phân phối phép nhân ở bước 1, các bước sau kế thừa',
  },
  {
    name: 'Test 2: Lời giải đúng',
    problemText: '3x - 6 = 9',
    steps: ['3x = 15', 'x = 5'],
    description: 'Lời giải hoàn toàn chính xác mọi bước',
  },
  {
    name: 'Test 3: Lỗi bỏ dấu ngoặc',
    problemText: '5 - (2x - 3)',
    steps: ['5 - 2x - 3', '2 - 2x'],
    description: 'Quên đổi dấu của -3 khi bỏ ngoặc có dấu trừ',
  },
  {
    name: 'Test 4: Bài ngoài phạm vi THCS',
    problemText: '\\int_0^\\pi \\sin(x) dx + \\ln(e^{2x}) = \\sqrt{y}',
    steps: ['\\int_0^\\pi \\sin(x) dx = 2', '2 + 2x = \\sqrt{y}'],
    description: 'Tích phân và hàm logarit - ngoài phạm vi đại số THCS',
  },
];

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({ onOpenTutor }) => {
  const [problemText, setProblemText] = useState<string>('2(x + 3) = 14');
  const [steps, setSteps] = useState<string[]>(['2x + 3 = 14', '2x = 11', 'x = 11/2']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [revealedHintLevel, setRevealedHintLevel] = useState<number>(1);

  // Thêm bước mới
  const handleAddStep = () => {
    if (steps.length >= 10) return;
    setSteps([...steps, '']);
  };

  // Xóa bước
  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, idx) => idx !== index);
    setSteps(newSteps);
  };

  // Cập nhật nội dung bước
  const handleStepChange = (index: number, val: string) => {
    const newSteps = [...steps];
    newSteps[index] = val;
    setSteps(newSteps);
  };

  // Áp dụng mẫu bài kiểm thử nhanh
  const handleApplyPreset = (preset: (typeof TEST_PRESETS)[0]) => {
    setProblemText(preset.problemText);
    setSteps([...preset.steps]);
    setAnalysisResult(null);
    setErrorMsg(null);
    setRevealedHintLevel(1);
  };

  // Gửi yêu cầu phân tích tới Backend an toàn
  const handleAnalyze = async () => {
    const trimmedProblem = problemText.trim();
    const validSteps = steps.map((s) => s.trim()).filter(Boolean);

    if (!trimmedProblem) {
      setErrorMsg('Vui lòng nhập đề bài toán trước khi phân tích.');
      return;
    }

    if (validSteps.length === 0) {
      setErrorMsg('Vui lòng nhập ít nhất một bước giải.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAnalysisResult(null);
    setRevealedHintLevel(1);

    try {
      const payload: AnalysisRequest = {
        problemText: trimmedProblem,
        solutionSteps: validSteps,
      };

      const res = await fetch('/api/analyze-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi phân tích lời giải.');
      }

      setAnalysisResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: StepAnalysisStatus) => {
    switch (status) {
      case 'valid':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hợp lệ</span>
          </span>
        );
      case 'original_error':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 text-xs font-bold rounded-lg border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Lỗi gốc (Sai tại đây)</span>
          </span>
        );
      case 'consequential':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 text-xs font-medium rounded-lg border border-amber-200">
            <Info className="w-3.5 h-3.5 text-amber-700" />
            <span>Hệ quả kéo theo</span>
          </span>
        );
      case 'uncertain':
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Chưa chắc chắn / Ngoài phạm vi</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner giới thiệu chế độ AI */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-7 text-white space-y-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Chế độ B: Trợ giảng Gemini AI</span>
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-blue-200 font-medium">Bảo mật Backend Server-Side (Không lộ API Key)</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Phân tích lời giải Toán tự do bằng AI
        </h2>

        <p className="text-blue-100 text-xs sm:text-sm leading-relaxed max-w-3xl">
          Nhập bất kỳ đề bài đại số hoặc phương trình bậc nhất một ẩn THCS cùng các bước giải của em.
          AI sẽ nhận diện từng bước, chỉ ra <strong>lỗi gốc</strong> (nếu có), phân biệt với <strong>hệ quả kéo theo</strong>,
          và đưa ra 3 cấp độ gợi mở giúp em tự mình hiểu bản chất.
        </p>

        {/* Nút thử nhanh theo kịch bản */}
        <div className="pt-2 space-y-1.5">
          <div className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
            Thử nghiệm nhanh theo tình huống kiểm định:
          </div>
          <div className="flex flex-wrap gap-2">
            {TEST_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors border border-white/15 flex items-center gap-1.5"
              >
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Nhập đề bài & Các bước giải (Cột trái) - Kết quả phân tích (Cột phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái: Form nhập liệu (7 cột) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            {/* Nhập đề bài */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Đề bài toán</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">{problemText.length}/500 ký tự</span>
              </div>
              <input
                type="text"
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Ví dụ: 2(x + 3) = 14 hoặc 3x - 6 = 9 hoặc 5 - (2x - 3)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-mono text-slate-900 transition-all outline-none"
              />

              {/* KaTeX Xem trước đề bài */}
              {problemText.trim() && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <div className="text-xs text-slate-400 mb-1">Hiển thị công thức:</div>
                  <div className="text-lg font-bold text-slate-900">
                    <MathView math={problemText} />
                  </div>
                </div>
              )}
            </div>

            {/* Nhập các bước giải */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Các bước giải (Mỗi bước một dòng)
                </label>
                <span className="text-[11px] text-slate-400">{steps.length}/10 bước</span>
              </div>

              <div className="space-y-2.5">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(idx, e.target.value)}
                      placeholder={`Bước ${idx + 1} (Ví dụ: 2x + 6 = 14)`}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-mono text-slate-900 transition-all outline-none"
                    />
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Xóa bước này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Nút thêm bước */}
              {steps.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bước giải tiếp theo</span>
                </button>
              )}
            </div>

            {/* Thông báo lỗi đầu vào nếu có */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {/* Nút hành động chính */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi và phân tích qua Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Phân tích bài làm bằng AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả phân tích (5 cột) */}
        <div className="lg:col-span-5 space-y-6">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                Đang xử lý phân tích sư phạm
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Gemini đang kiểm tra tính tương đương toán học của từng bước, xác định điểm khởi phát lỗi và chuẩn bị gợi ý gợi mở...
              </p>
            </div>
          ) : analysisResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-fade-in">
              {/* Header kết quả */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Kết quả phân tích từ AI</span>
                </h3>

                {/* Huy hiệu kiểm chứng độc lập */}
                {analysisResult.verificationStatus === 'verified' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã kiểm chứng đại số</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    <span>AI đề xuất (Chưa CAS độc lập)</span>
                  </span>
                )}
              </div>

              {/* Thông điệp sư phạm cho học sinh */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lời nhắn từ Trợ giảng AI:</span>
                </div>
                <p className="leading-relaxed">{analysisResult.studentMessage}</p>
                {analysisResult.errorCategory && (
                  <div className="text-[11px] font-semibold text-blue-800 pt-1">
                    Nhóm sai sót chính: {analysisResult.errorCategory}
                  </div>
                )}
              </div>

              {/* Đánh giá chi tiết từng bước */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chi tiết từng bước giải:
                </div>

                {analysisResult.steps.map((st, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      st.status === 'original_error'
                        ? 'border-rose-300 bg-rose-50/70 ring-1 ring-rose-200'
                        : st.status === 'consequential'
                        ? 'border-amber-200 bg-amber-50/50'
                        : st.status === 'valid'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">Bước {idx + 1}:</span>
                      {getStatusBadge(st.status)}
                    </div>

                    <div className="font-mono text-sm font-semibold text-slate-900">
                      <MathView math={steps[idx] || ''} />
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {st.explanation}
                    </p>
                  </div>
                ))}
              </div>

              {/* Hệ thống gợi ý 3 cấp bậc thang */}
              {analysisResult.hints && analysisResult.hints.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gợi ý hướng dẫn sửa</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Đang xem {revealedHintLevel}/3 cấp độ
                    </span>
                  </div>

                  {analysisResult.hints.slice(0, revealedHintLevel).map((hint, hIdx) => (
                    <div
                      key={hIdx}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        hIdx === 0
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : hIdx === 1
                          ? 'bg-sky-50/80 border-sky-200 text-sky-900'
                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-mono">
                          {hIdx + 1}
                        </span>
                        <span>
                          {hIdx === 0
                            ? 'Cấp 1: Gợi mở suy nghĩ'
                            : hIdx === 1
                            ? 'Cấp 2: Nhắc lại quy tắc'
                            : 'Cấp 3: Hướng dẫn sửa cụ thể'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed pt-0.5">{hint}</p>
                    </div>
                  ))}

                  {revealedHintLevel < analysisResult.hints.length && (
                    <button
                      type="button"
                      onClick={() => setRevealedHintLevel((prev) => Math.min(prev + 1, 3))}
                      className="w-full py-2 px-3 border border-dashed border-amber-300 hover:bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mở gợi ý tiếp theo (Cấp {revealedHintLevel + 1}/3)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Nút chuyển tiếp sang Trợ giảng AI đối thoại (XD-02B) */}
              {onOpenTutor && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenTutor({
                        problemText,
                        solutionSteps: steps.map((s) => s.trim()).filter(Boolean),
                        errorStepIndex: analysisResult.firstErrorStepIndex,
                        errorCategory: analysisResult.errorCategory,
                        notes: analysisResult.verificationNotes.join('; '),
                      })
                    }
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-300" />
                    <span>Đối thoại sâu cùng Trợ giảng AI về bài này</span>
                  </button>
                </div>
              )}

              {/* Chú thích kiểm chứng độc lập minh bạch */}
              {analysisResult.verificationNotes && analysisResult.verificationNotes.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ghi chú kiểm chứng toán học:</span>
                  </div>
                  {analysisResult.verificationNotes.map((note, nIdx) => (
                    <div key={nIdx} className="leading-relaxed">
                      • {note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-100/70 border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Sẵn sàng phân tích bài làm
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Nhập đề bài và các bước giải ở cột bên trái, hoặc chọn một mẫu kiểm thử nhanh, sau đó bấm <strong>"Phân tích bằng AI"</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
