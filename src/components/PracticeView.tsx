import React, { useState, useEffect } from 'react';
import {
  PracticeProblem,
  FeedbackResult,
  HintLevel,
  MathTopic,
  LearningProgress,
  TutorChatContext,
  EvaluationStatus,
} from '../types/math';
import { DEMO_PROBLEMS } from '../data/problems';
import { evaluateCorrectionStep } from '../services/evaluator';
import { MathView, FormattedMathText } from './MathView';
import { AiAnalysisView } from './AiAnalysisView';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Send,
  RefreshCw,
  Info,
  ChevronRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Check,
  Target,
} from 'lucide-react';

interface PracticeViewProps {
  initialTopic?: MathTopic;
  progress: LearningProgress;
  onRecordAttempt: (
    problemId: string,
    userInput: string,
    status: EvaluationStatus,
    hintsRevealed: number,
    errorCategory: PracticeProblem['errorCategory']
  ) => void;
  onOpenTutor?: (context: TutorChatContext) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  initialTopic,
  progress,
  onRecordAttempt,
  onOpenTutor,
}) => {
  // XD-02A: Hai chế độ riêng biệt
  const [practiceMode, setPracticeMode] = useState<'sample' | 'ai'>('sample');

  const [selectedTopic, setSelectedTopic] = useState<MathTopic | 'all'>(
    initialTopic || 'all'
  );
  const [selectedProblemId, setSelectedProblemId] = useState<string>(
    DEMO_PROBLEMS[0].id
  );

  // Trạng thái của bài hiện tại
  const [isExamined, setIsExamined] = useState<boolean>(false);
  const [revealedHintLevel, setRevealedHintLevel] = useState<HintLevel | 0>(0);
  const [userInput, setUserInput] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [selectedStepByUser, setSelectedStepByUser] = useState<number | null>(null);

  // Lọc danh sách bài theo chủ đề
  const filteredProblems = DEMO_PROBLEMS.filter(
    (p) => selectedTopic === 'all' || p.topic === selectedTopic
  );

  // Lấy bài toán hiện tại
  const currentProblem =
    DEMO_PROBLEMS.find((p) => p.id === selectedProblemId) || DEMO_PROBLEMS[0];

  // Kiểm tra xem bài hiện tại đã từng giải đúng chưa
  const isProblemSolved = progress.problemsSolved.includes(currentProblem.id);

  // Reset các trạng thái khi chuyển bài
  const handleSelectProblem = (probId: string) => {
    setSelectedProblemId(probId);
    setIsExamined(false);
    setRevealedHintLevel(0);
    setUserInput('');
    setFeedback(null);
    setSelectedStepByUser(null);
  };

  // Nút "Kiểm tra lời giải"
  const handleExamineSolution = () => {
    setIsExamined(true);
    // Tự động mở gợi ý cấp 1 nếu chưa mở
    if (revealedHintLevel === 0) {
      setRevealedHintLevel(1);
    }
  };

  // Nút "Gợi ý tiếp theo"
  const handleNextHint = () => {
    if (revealedHintLevel < 3) {
      const nextLevel = (revealedHintLevel + 1) as HintLevel;
      setRevealedHintLevel(nextLevel);
    }
  };

  // Nút "Gửi bước sửa"
  const handleSubmitCorrection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;

    const result = evaluateCorrectionStep(
      userInput,
      currentProblem,
      revealedHintLevel
    );

    setFeedback(result);

    // Cập nhật tiến độ học tập
    onRecordAttempt(
      currentProblem.id,
      userInput,
      result.status,
      revealedHintLevel,
      currentProblem.errorCategory
    );
  };

  // Nút chèn ký tự nhanh vào ô input
  const handleInsertSymbol = (symbol: string) => {
    setUserInput((prev) => prev + symbol);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Phân định 2 chế độ rõ ràng (XD-02A) */}
      <div className="p-1.5 bg-slate-200/70 rounded-2xl flex flex-col sm:flex-row gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setPracticeMode('sample')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            practiceMode === 'sample'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Chế độ A: Bài luyện tập mẫu (XD-01)</span>
        </button>

        <button
          type="button"
          onClick={() => setPracticeMode('ai')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            practiceMode === 'ai'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Chế độ B: Phân tích bài làm bằng AI (XD-02A)</span>
        </button>
      </div>

      {practiceMode === 'ai' ? (
        <AiAnalysisView onOpenTutor={onOpenTutor} />
      ) : (
        <>
          {/* Thanh chọn chủ đề và bài toán */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Bộ lọc chủ đề */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                selectedTopic === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({DEMO_PROBLEMS.length})
            </button>
            <button
              onClick={() => setSelectedTopic('expression')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                selectedTopic === 'expression'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Biến đổi biểu thức
            </button>
            <button
              onClick={() => setSelectedTopic('equation')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                selectedTopic === 'equation'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Giải phương trình
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bộ dữ liệu sư phạm chuẩn hóa — Độc lập và bảo mật</span>
          </div>
        </div>

        {/* Danh sách các bài demo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {filteredProblems.map((prob) => {
            const isSelected = prob.id === currentProblem.id;
            const isSolved = progress.problemsSolved.includes(prob.id);

            return (
              <button
                key={prob.id}
                onClick={() => handleSelectProblem(prob.id)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {prob.gradeLevel}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {prob.title}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-800">
                    <MathView math={prob.originalProblemLatex} />
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {isSolved ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Khu vực bài tập chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái: Đề bài và Lời giải mẫu của học sinh (7 cột) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Đề bài */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                  {currentProblem.topicLabel}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">
                  {currentProblem.gradeLevel}
                </span>
              </div>
              {isProblemSolved && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã sửa đúng lỗi</span>
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {currentProblem.title}
            </h2>

            <p className="text-sm text-slate-600">
              {currentProblem.contextDescription}
            </p>

            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-xl border border-slate-200/80 flex items-center justify-center text-center">
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                <MathView math={currentProblem.originalProblemLatex} displayMode={true} />
              </div>
            </div>
          </div>

          {/* Card Lời giải mẫu */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Lời giải của học sinh mẫu</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quan sát tiến trình giải bên dưới để tìm ra bước tính chưa chính xác:
                </p>
              </div>

              {!isExamined && (
                <button
                  onClick={handleExamineSolution}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Kiểm tra lời giải</span>
                </button>
              )}
            </div>

            {/* Các bước giải */}
            <div className="space-y-3">
              {currentProblem.sampleSteps.map((step, idx) => {
                const isRootError = isExamined && idx === currentProblem.errorStepIndex;
                const isConsequential = isExamined && idx > currentProblem.errorStepIndex;
                const isValidPriorStep = isExamined && idx < currentProblem.errorStepIndex;
                const isUserSelected = !isExamined && selectedStepByUser === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      // Trong chế độ tự luyện: nhấp chọn bước chỉ để quan sát, KHÔNG tự ý tiết lộ lỗi
                      if (!isExamined) {
                        setSelectedStepByUser(idx);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all relative ${
                      isRootError
                        ? 'border-rose-400 bg-rose-50/80 ring-2 ring-rose-300'
                        : isConsequential
                        ? 'border-amber-300/80 bg-amber-50/40'
                        : isValidPriorStep
                        ? 'border-slate-200 bg-slate-50/60'
                        : isUserSelected
                        ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-300 cursor-pointer'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 w-full">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            isRootError
                              ? 'bg-rose-600 text-white'
                              : isConsequential
                              ? 'bg-amber-600 text-white'
                              : isValidPriorStep
                              ? 'bg-emerald-600 text-white'
                              : isUserSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {step.stepNumber}
                        </span>

                        <div className="space-y-1.5 flex-1">
                          <div className="font-mono text-base font-semibold text-slate-900">
                            <MathView math={step.latex} />
                          </div>
                          <p className="text-xs text-slate-600">
                            {step.textExplanation}
                          </p>

                          {/* Diễn giải hệ quả của lỗi khi đã kiểm tra */}
                          {isConsequential && (
                            <div className="mt-2 text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200">
                              <span className="font-bold">Lưu ý sư phạm: </span>
                              {step.consequentialExplanation ||
                                'Phép biến đổi này tuân thủ logic từ bước trước, nhưng bị ảnh hưởng bởi lỗi gốc ở trên nên không dẫn đến nghiệm đúng của đề gốc.'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Nhãn trạng thái bước */}
                      {isRootError && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Lỗi gốc (Sai tại đây)</span>
                        </div>
                      )}

                      {isConsequential && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-medium rounded-lg shrink-0">
                          <Info className="w-3.5 h-3.5 text-amber-700" />
                          <span>Hệ quả kéo theo</span>
                        </div>
                      )}

                      {isValidPriorStep && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hợp lệ</span>
                        </div>
                      )}

                      {isUserSelected && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg shrink-0">
                          <Target className="w-3.5 h-3.5 text-blue-600" />
                          <span>Em đang chọn quan sát</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nút hành động nếu chưa kiểm tra */}
            {!isExamined && (
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-blue-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Quan sát các bước giải trên. Em có thể nhấp vào bước nghi ngờ, sau đó bấm <strong>"Kiểm tra ngay"</strong> để nhận phân tích chi tiết.
                  </span>
                </div>
                <button
                  onClick={handleExamineSolution}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Kiểm tra ngay</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Khu vực phản hồi & Nhập bước sửa (5 cột) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Khu vực phân tích lỗi sai */}
          {isExamined ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Phân tích lỗi sai
                  </h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  Bước {currentProblem.sampleSteps[currentProblem.errorStepIndex].stepNumber}
                </span>
              </div>

              {/* Thông tin loại lỗi & giải thích */}
              <div className="space-y-3">
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{currentProblem.errorCategoryName}</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {currentProblem.errorExplanation}
                  </p>
                </div>

                {/* Các cấp độ gợi ý */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Hệ thống gợi ý sư phạm</span>
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Đang xem {revealedHintLevel}/3 cấp độ
                    </span>
                  </div>

                  {/* Cấp 1 */}
                  {revealedHintLevel >= 1 && (
                    <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-1 text-xs">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                          1
                        </span>
                        <span>{currentProblem.hints.level1.title}</span>
                      </div>
                      <p className="text-amber-800 font-medium pt-0.5">
                        <FormattedMathText text={currentProblem.hints.level1.promptQuestion || ''} />
                      </p>
                      <p className="text-amber-700 text-[11px]">
                        <FormattedMathText text={currentProblem.hints.level1.content} />
                      </p>
                    </div>
                  )}

                  {/* Cấp 2 */}
                  {revealedHintLevel >= 2 && (
                    <div className="p-3.5 bg-sky-50/80 rounded-xl border border-sky-200/80 space-y-1 text-xs">
                      <div className="font-bold text-sky-900 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                          2
                        </span>
                        <span>{currentProblem.hints.level2.title}</span>
                      </div>
                      <p className="text-sky-800 font-medium pt-0.5">
                        <FormattedMathText text={currentProblem.hints.level2.promptQuestion || ''} />
                      </p>
                      <p className="text-sky-700 text-[11px]">
                        <FormattedMathText text={currentProblem.hints.level2.content} />
                      </p>
                    </div>
                  )}

                  {/* Cấp 3 */}
                  {revealedHintLevel >= 3 && (
                    <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80 space-y-1 text-xs">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                          3
                        </span>
                        <span>{currentProblem.hints.level3.title}</span>
                      </div>
                      <p className="text-emerald-800 font-medium pt-0.5">
                        <FormattedMathText text={currentProblem.hints.level3.promptQuestion || ''} />
                      </p>
                      <p className="text-emerald-700 text-[11px]">
                        <FormattedMathText text={currentProblem.hints.level3.content} />
                      </p>
                    </div>
                  )}

                  {/* Nút gợi ý tiếp theo */}
                  {revealedHintLevel < 3 && (
                    <button
                      onClick={handleNextHint}
                      className="w-full py-2 px-3 border border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>Xem gợi ý tiếp theo (Cấp {revealedHintLevel + 1}/3)</span>
                    </button>
                  )}

                  {/* Nút trao đổi trực tiếp với Trợ giảng AI */}
                  {onOpenTutor && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTutor({
                          problemText: currentProblem.originalProblemLatex,
                          solutionSteps: currentProblem.sampleSteps.map((s) => s.latex),
                          errorStepIndex: currentProblem.errorStepIndex,
                          errorCategory: currentProblem.errorCategoryName,
                          notes: currentProblem.errorExplanation,
                        })
                      }
                      className="w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Hỏi Trợ giảng AI về bước sai này</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Khu vực Nhập bước sửa */}
              <form onSubmit={handleSubmitCorrection} className="space-y-3 pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  Nhập bước giải đúng của em tại bước này:
                </label>

                {/* Phím bấm ký tự nhanh */}
                <div className="flex flex-wrap gap-1">
                  {['x', '+', '-', '=', '·', '(', ')', ':'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleInsertSymbol(sym === '·' ? '*' : sym)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono font-bold transition-colors"
                    >
                      {sym}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUserInput('')}
                    className="ml-auto px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Xóa
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={`Ví dụ: ${currentProblem.validCorrectionPatterns[0]}`}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-mono text-slate-900 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!userInput.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi</span>
                  </button>
                </div>

                {/* Kết quả phản hồi */}
                {feedback && (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-2 animate-fade-in ${
                      feedback.status === 'correct'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : feedback.status === 'incorrect'
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {feedback.status === 'correct' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : feedback.status === 'incorrect' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold">
                          {feedback.status === 'correct'
                            ? 'Làm tốt lắm!'
                            : feedback.status === 'incorrect'
                            ? 'Chưa chính xác'
                            : feedback.stepType === 'final_root'
                            ? 'Cần trình bày thêm bước biến đổi'
                            : feedback.status === 'needs_clarification'
                            ? 'Cần làm rõ bước giải'
                            : 'Thông báo xác minh'}
                        </div>
                        <p className="mt-0.5 leading-relaxed">{feedback.message}</p>
                      </div>
                    </div>

                    {/* Khi sửa đúng: hiển thị bước sửa đúng và câu gợi mở bước tiếp theo (KHÔNG lộ nghiệm cuối cùng) */}
                    {feedback.status === 'correct' && (
                      <div className="pt-2.5 border-t border-emerald-200 mt-2.5 space-y-2">
                        <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Bước sửa đúng:</span>
                        </div>
                        <div className="font-mono text-sm bg-white/90 p-2.5 rounded-xl border border-emerald-200 text-center text-emerald-950 shadow-2xs">
                          <MathView math={currentProblem.correctNextStepLatex} />
                        </div>
                        <p className="text-xs text-emerald-800 font-medium leading-relaxed pt-0.5">
                          {currentProblem.topic === 'equation'
                            ? 'Em hãy suy nghĩ xem cần thực hiện phép biến đổi nào để tiếp tục giải phương trình nhé.'
                            : 'Em hãy suy nghĩ xem cần thực hiện phép biến đổi nào để tiếp tục rút gọn biểu thức nhé.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="bg-slate-100/70 border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Chưa mở phân tích lỗi sai
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Nhấn vào nút <strong>"Kiểm tra lời giải"</strong> ở góc trên hoặc nhấp trực tiếp vào một bước giải để xem phân tích và câu hỏi gợi mở.
              </p>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

