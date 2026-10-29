import React, { useState } from 'react';
import {
  MATH_TOPICS,
  GRADE1_QUESTIONS,
  MathQuestion,
} from '../data/grade1MathData';
import {
  playSuccessSound,
  playErrorSound,
  playClickSound,
  playStarSound,
} from '../utils/soundEffects';
import { InteractiveClock } from './InteractiveClock';
import { RulerMeasure } from './RulerMeasure';
import { Scratchpad } from './Scratchpad';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  Sparkles,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Award,
  Lightbulb,
  Edit3,
} from 'lucide-react';

interface MathPracticeProps {
  onEarnStar?: () => void;
  totalStars?: number;
}

export const MathPractice: React.FC<MathPracticeProps> = ({
  onEarnStar,
  totalStars = 0,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState<boolean>(false);
  const [aiTutorLoading, setAiTutorLoading] = useState<boolean>(false);
  const [aiTutorResponse, setAiTutorResponse] = useState<string>('');

  // Filtered questions
  const filteredQuestions =
    selectedTopicId === 'all'
      ? GRADE1_QUESTIONS
      : GRADE1_QUESTIONS.filter((q) => q.topicId === selectedTopicId);

  const question = filteredQuestions[currentIdx] || filteredQuestions[0];

  const handleSelectTopic = (topicId: string) => {
    playClickSound();
    setSelectedTopicId(topicId);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setAiTutorResponse('');
  };

  const handleChooseOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt === question.correctAnswer) {
      playSuccessSound();
      playStarSound();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      if (onEarnStar) onEarnStar();
    } else {
      playErrorSound();
    }
  };

  const handleNextQuestion = () => {
    playClickSound();
    if (currentIdx < filteredQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setCurrentIdx(0);
    }
    setSelectedOption(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setAiTutorResponse('');
  };

  const handleRetry = () => {
    playClickSound();
    setSelectedOption(null);
    setIsAnswered(false);
    setShowExplanation(false);
  };

  // Text to Speech
  const speakQuestion = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `${question.title}. ${question.question}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // AI Tutor Teacher Thảo Hiền
  const askAiTutor = async () => {
    playClickSound();
    setIsAiTutorOpen(true);
    if (aiTutorResponse) return; // already loaded

    try {
      setAiTutorLoading(true);
      const res = await fetch('/api/gemini/grade1-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Bài toán: "${question.question}". Các đáp án lựa chọn: ${question.options.join(
            ', '
          )}. Đáp án đúng là: ${question.correctAnswer}. Hãy giảng thật dễ hiểu cho bé lớp 1.`,
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setAiTutorResponse(data.explanation);
      } else {
        setAiTutorResponse(question.explanation);
      }
    } catch (e) {
      setAiTutorResponse(question.explanation);
    } finally {
      setAiTutorLoading(false);
    }
  };

  // Render question visuals
  const renderVisual = (q: MathQuestion) => {
    if (!q.visualType) return null;

    if (q.visualType === 'items') {
      const data = q.visualData;
      if (data?.verticalCalc) {
        return (
          <div className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-2xl border-2 border-amber-200 shadow-inner">
            <div className="text-3xl font-black tracking-widest text-slate-800 font-mono">
              <div className="text-right pr-4">{data.verticalCalc.a}</div>
              <div className="flex items-center gap-2">
                <span className="text-amber-600 font-bold">{data.verticalCalc.op}</span>
                <span>{data.verticalCalc.b}</span>
              </div>
              <div className="border-b-4 border-slate-700 w-24 my-1"></div>
              <div className="text-center text-amber-600">?</div>
            </div>
          </div>
        );
      }

      if (data?.leftGroup && data?.rightGroup) {
        return (
          <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex flex-wrap gap-2 p-2 bg-white rounded-xl shadow-xs border border-amber-200">
              {Array.from({ length: data.leftGroup.count }).map((_, i) => (
                <span key={i} className="text-3xl sm:text-4xl animate-bounce-gentle">
                  {data.leftGroup.emoji}
                </span>
              ))}
            </div>
            <span className="text-2xl font-black text-amber-600">+</span>
            <div className="flex flex-wrap gap-2 p-2 bg-white rounded-xl shadow-xs border border-amber-200">
              {Array.from({ length: data.rightGroup.count }).map((_, i) => (
                <span key={i} className="text-3xl sm:text-4xl animate-bounce-gentle">
                  {data.rightGroup.emoji}
                </span>
              ))}
            </div>
          </div>
        );
      }

      if (data?.itemEmoji && data?.count) {
        return (
          <div className="flex flex-wrap justify-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 max-w-md mx-auto">
            {Array.from({ length: data.count }).map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 bg-white rounded-xl shadow-sm border border-amber-200 flex items-center justify-center text-3xl hover:scale-110 transition cursor-default"
              >
                {data.itemEmoji}
              </div>
            ))}
          </div>
        );
      }
    }

    if (q.visualType === 'comparison') {
      const data = q.visualData;
      return (
        <div className="flex items-center justify-center gap-4 sm:gap-8 p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-amber-200 min-w-[100px]">
            <span className="text-3xl font-black text-amber-700">{data.leftCount}</span>
            <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
              {Array.from({ length: data.leftCount }).map((_, i) => (
                <span key={i} className="text-xl">
                  {data.leftEmoji}
                </span>
              ))}
            </div>
          </div>

          <div className="w-12 h-12 rounded-full bg-amber-200 border-2 border-dashed border-amber-500 flex items-center justify-center text-2xl font-black text-amber-800">
            {isAnswered ? selectedOption : '?'}
          </div>

          <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-amber-200 min-w-[100px]">
            <span className="text-3xl font-black text-indigo-700">{data.rightCount}</span>
            <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
              {Array.from({ length: data.rightCount }).map((_, i) => (
                <span key={i} className="text-xl">
                  {data.rightEmoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (q.visualType === 'number-line') {
      const data = q.visualData;
      return (
        <div className="flex items-center justify-center gap-2 sm:gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 overflow-x-auto">
          {data.sequence.map((num: string, idx: number) => (
            <div
              key={idx}
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm border-2 ${
                num === '?'
                  ? 'bg-amber-300 text-amber-950 border-amber-500 animate-pulse text-2xl'
                  : 'bg-white text-slate-800 border-amber-200'
              }`}
            >
              {num === '?' && isAnswered ? selectedOption : num}
            </div>
          ))}
        </div>
      );
    }

    if (q.visualType === 'split-combine') {
      const data = q.visualData;
      return (
        <div className="flex flex-col items-center p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center text-3xl font-black shadow-md border-4 border-rose-200">
            {data.total}
          </div>
          <div className="flex items-center justify-center gap-12 my-2 text-rose-400 font-bold text-xl">
            <span>╱</span>
            <span>╲</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-2xl font-black shadow-md">
              {data.part1}
            </div>
            <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
              {isAnswered ? selectedOption : data.part2}
            </div>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-600">Sơ đồ tách - gộp số</p>
        </div>
      );
    }

    if (q.visualType === 'clock') {
      return (
        <InteractiveClock
          hour={q.visualData.hour}
          minute={q.visualData.minute}
          size={180}
        />
      );
    }

    if (q.visualType === 'ruler') {
      return (
        <RulerMeasure
          lengthCm={q.visualData.lengthCm}
          itemName={q.visualData.item}
        />
      );
    }

    if (q.visualType === 'geometry') {
      const shape = q.visualData.shape;
      if (shape === 'triangle') {
        return (
          <div className="flex items-center justify-center p-4">
            <svg width="140" height="120" viewBox="0 0 140 120">
              <polygon
                points="70,15 15,105 125,105"
                fill="#60a5fa"
                stroke="#2563eb"
                strokeWidth="4"
              />
            </svg>
          </div>
        );
      }
      if (shape === 'cube') {
        return (
          <div className="flex items-center justify-center p-4">
            <svg width="150" height="140" viewBox="0 0 150 140">
              {/* Front face */}
              <rect x="25" y="45" width="70" height="70" fill="#34d399" stroke="#059669" strokeWidth="3" />
              {/* Top face */}
              <polygon points="25,45 60,15 130,15 95,45" fill="#6ee7b7" stroke="#059669" strokeWidth="3" />
              {/* Right face */}
              <polygon points="95,45 130,15 130,85 95,115" fill="#10b981" stroke="#059669" strokeWidth="3" />
            </svg>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Category Pills Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleSelectTopic('all')}
          className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap cursor-pointer transition ${
            selectedTopicId === 'all'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          🌟 Tất cả chủ đề ({GRADE1_QUESTIONS.length})
        </button>
        {MATH_TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleSelectTopic(topic.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap cursor-pointer transition ${
              selectedTopicId === topic.id
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            {topic.title}
          </button>
        ))}
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl shadow-xl border-4 border-amber-200 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-4 sm:p-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              {question.topicName}
            </span>
            <span className="text-sm font-extrabold text-amber-950/80">
              Câu {currentIdx + 1} / {filteredQuestions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScratchpadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-amber-900 font-extrabold text-xs shadow-sm hover:bg-amber-100 transition cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-amber-600" /> Bảng Nháp
            </button>
            <button
              onClick={speakQuestion}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              title="Nghe đọc câu hỏi"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              {question.question}
            </h2>
            {question.hint && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                💡 Gợi ý: {question.hint}
              </p>
            )}
          </div>

          {/* Question Visuals */}
          <div className="flex justify-center">{renderVisual(question)}</div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
            {question.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              const isCorrect = isAnswered && opt === question.correctAnswer;
              const isWrong = isAnswered && isSelected && opt !== question.correctAnswer;

              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => handleChooseOption(opt)}
                  className={`p-4 rounded-2xl font-black text-lg sm:text-xl transition-all duration-200 border-3 flex items-center justify-between cursor-pointer select-none ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-4 ring-emerald-200 shadow-md scale-102'
                      : isWrong
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-4 ring-rose-200 shadow-md'
                      : 'bg-amber-50/50 hover:bg-amber-100 border-amber-300 text-slate-800 hover:border-amber-500 shadow-sm'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-200/80 text-amber-900 font-bold text-sm flex items-center justify-center">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </span>

                  {isCorrect && <CheckCircle2 className="w-7 h-7 text-emerald-600" />}
                  {isWrong && <XCircle className="w-7 h-7 text-rose-600" />}
                </button>
              );
            })}
          </div>

          {/* Feedback & Actions */}
          {isAnswered && (
            <div
              className={`p-5 rounded-2xl border-2 animate-in fade-in zoom-in-95 duration-200 ${
                selectedOption === question.correctAnswer
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {selectedOption === question.correctAnswer ? (
                    <>
                      <span className="text-3xl">🎉</span>
                      <div>
                        <h4 className="font-extrabold text-lg text-emerald-800">
                          Chính xác! Bé giỏi quá!
                        </h4>
                        <p className="text-sm text-emerald-700">{question.explanation}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">💪</span>
                      <div>
                        <h4 className="font-extrabold text-lg text-rose-800">
                          Chưa đúng rồi, bé hãy thử lại nhé!
                        </h4>
                        <p className="text-sm text-rose-700">
                          Đáp án đúng là:{' '}
                          <span className="font-black underline">{question.correctAnswer}</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={askAiTutor}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 shadow-sm transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Cô giáo giảng bài
                  </button>
                  {selectedOption !== question.correctAnswer && (
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 font-bold text-sm hover:bg-rose-100 transition cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> Làm lại
                    </button>
                  )}
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 text-white font-extrabold text-sm hover:bg-amber-600 shadow-md transition cursor-pointer"
                  >
                    Câu tiếp theo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Tutor Modal */}
      {isAiTutorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-purple-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👩‍🏫</span>
                <div>
                  <h3 className="font-black text-lg text-purple-900">
                    Cô Giáo Thảo Hiền Giảng Bài
                  </h3>
                  <p className="text-xs text-purple-600 font-semibold">
                    Giải thích ngọt ngào cho bé lớp 1
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiTutorOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 text-slate-700 text-sm leading-relaxed min-h-[120px]">
              {aiTutorLoading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3 text-purple-600">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold">Cô đang chuẩn bị lời giảng cho bé nhé...</p>
                </div>
              ) : (
                <div className="whitespace-pre-line bg-purple-50/60 p-4 rounded-2xl border border-purple-200">
                  {aiTutorResponse || question.explanation}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsAiTutorOpen(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 cursor-pointer"
              >
                Con đã hiểu rồi ạ! ❤️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scratchpad Modal */}
      <Scratchpad
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />
    </div>
  );
};
