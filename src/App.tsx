/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { PracticeView } from './components/PracticeView';
import { AiTutorChatView } from './components/AiTutorChatView';
import { ErrorHandbookView } from './components/ErrorHandbookView';
import { ProgressView } from './components/ProgressView';
import { LearningProgress, MathTopic, ErrorCategory, TutorChatContext, EvaluationStatus } from './types/math';
import { DEMO_PROBLEMS } from './data/problems';
import { ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

const INITIAL_PROGRESS: LearningProgress = {
  problemsAttempted: [],
  problemsSolved: [],
  correctAttemptsCount: 0,
  totalAttemptsCount: 0,
  hintsUsedTotal: 0,
  encounteredErrors: {} as Record<ErrorCategory, number>,
  rulesToReview: [],
};

const STORAGE_KEY = 'ai_math_tutor_session_progress_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [initialPracticeTopic, setInitialPracticeTopic] = useState<MathTopic | undefined>(undefined);
  const [tutorContext, setTutorContext] = useState<TutorChatContext | undefined>(undefined);

  // Khôi phục hoặc khởi tạo tiến độ phiên học
  const [progress, setProgress] = useState<LearningProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read session storage', e);
    }
    return INITIAL_PROGRESS;
  });

  // Lưu tiến độ vào session storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Could not save session storage', e);
    }
  }, [progress]);

  // Điều hướng sang màn hình luyện tập có chỉ định chủ đề
  const handleStartPractice = (topic?: MathTopic) => {
    setInitialPracticeTopic(topic);
    setActiveTab('practice');
  };

  // Mở màn hình Trợ giảng AI với bối cảnh cụ thể
  const handleOpenTutor = (ctx: TutorChatContext) => {
    setTutorContext(ctx);
    setActiveTab('tutor');
  };

  // Ghi nhận lần thử giải
  const handleRecordAttempt = (
    problemId: string,
    userInput: string,
    status: EvaluationStatus,
    hintsRevealed: number,
    errorCategory: ErrorCategory
  ) => {
    setProgress((prev) => {
      const alreadySolved = prev.problemsSolved.includes(problemId);

      // Nếu bài toán đã được sửa đúng trước đó và học sinh nộp lại kết quả đúng -> giữ nguyên, không làm tăng thành tích sai lệch
      if (status === 'correct' && alreadySolved) {
        return prev;
      }

      const newAttempted = prev.problemsAttempted.includes(problemId)
        ? prev.problemsAttempted
        : [...prev.problemsAttempted, problemId];

      const isNewSolved = status === 'correct' && !alreadySolved;
      const newSolved = isNewSolved
        ? [...prev.problemsSolved, problemId]
        : prev.problemsSolved;

      const newEncountered = { ...prev.encounteredErrors };
      // Ghi nhận nhóm lỗi nếu bài này mới bắt đầu thử
      if (!prev.problemsAttempted.includes(problemId)) {
        newEncountered[errorCategory] = (newEncountered[errorCategory] || 0) + 1;
      }

      return {
        ...prev,
        problemsAttempted: newAttempted,
        problemsSolved: newSolved,
        totalAttemptsCount: prev.totalAttemptsCount + 1,
        // Bước sửa đúng chỉ được ghi nhận một lần cho mỗi bài
        correctAttemptsCount: newSolved.length,
        hintsUsedTotal: prev.hintsUsedTotal + (hintsRevealed > 0 ? 1 : 0),
        encounteredErrors: newEncountered,
      };
    });
  };

  // Đặt lại phiên
  const handleResetProgress = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại dữ liệu tiến bộ của phiên học này không?')) {
      setProgress(INITIAL_PROGRESS);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        solvedCount={progress.problemsSolved.length}
        totalProblemsCount={DEMO_PROBLEMS.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView
            onStartPractice={handleStartPractice}
            onGoToTutor={() => setActiveTab('tutor')}
            progress={progress}
            totalProblemsCount={DEMO_PROBLEMS.length}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeView
            initialTopic={initialPracticeTopic}
            progress={progress}
            onRecordAttempt={handleRecordAttempt}
            onOpenTutor={handleOpenTutor}
          />
        )}

        {activeTab === 'tutor' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AiTutorChatView initialContext={tutorContext} />
          </div>
        )}

        {activeTab === 'handbook' && <ErrorHandbookView />}

        {activeTab === 'progress' && (
          <ProgressView
            progress={progress}
            onResetProgress={handleResetProgress}
            onGoToPractice={() => setActiveTab('practice')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">AI MATH TUTOR</span>
            <span>—</span>
            <span>Học từ lỗi sai — Tiến bộ qua từng bước</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Phiên bản XD-02B Trợ giảng AI</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Toán THCS (Lớp 7 - 8)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
