import React, { useState, useEffect, useRef } from 'react';
import {
  playSuccessSound,
  playErrorSound,
  playVictorySound,
  playClickSound,
  playStarSound,
} from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Timer,
  Zap,
  Trophy,
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface FastMathArenaProps {
  onEarnStar?: () => void;
}

interface QuickProblem {
  num1: number;
  num2: number;
  op: '+' | '-';
  answer: number;
  options: number[];
}

export const FastMathArena: React.FC<FastMathArenaProps> = ({ onEarnStar }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [problem, setProblem] = useState<QuickProblem | null>(null);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('grade1_fastmath_highscore') || '0', 10);
  });
  const [gameOver, setGameOver] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a random Grade 1 math problem
  const generateProblem = (): QuickProblem => {
    const isAddition = Math.random() > 0.4;
    let num1: number;
    let num2: number;
    let answer: number;

    if (isAddition) {
      // sum within 20
      num1 = Math.floor(Math.random() * 11);
      num2 = Math.floor(Math.random() * (20 - num1 + 1));
      answer = num1 + num2;
    } else {
      // subtraction within 20
      num1 = Math.floor(Math.random() * 16) + 3; // 3 to 18
      num2 = Math.floor(Math.random() * num1); // 0 to num1
      answer = num1 - num2;
    }

    // Generate 4 distinct options including the answer
    const optionsSet = new Set<number>([answer]);
    while (optionsSet.size < 4) {
      const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 4) + 1);
      const fake = Math.max(0, answer + delta);
      optionsSet.add(fake);
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    return {
      num1,
      num2,
      op: isAddition ? '+' : '-',
      answer,
      options,
    };
  };

  const startGame = () => {
    playClickSound();
    setIsPlaying(true);
    setGameOver(false);
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setProblem(generateProblem());
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      // Game Over
      setIsPlaying(false);
      setGameOver(true);
      playVictorySound();
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('grade1_fastmath_highscore', score.toString());
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, timeLeft]);

  const handleAnswer = (choice: number) => {
    if (!problem || !isPlaying) return;

    if (choice === problem.answer) {
      playSuccessSound();
      const points = 10 + streak * 2;
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);

      if (onEarnStar && (score + points) % 30 === 0) {
        playStarSound();
        onEarnStar();
      }

      setProblem(generateProblem());
    } else {
      playErrorSound();
      setStreak(0);
      // Small penalty or keep moving
      setProblem(generateProblem());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-xl border-4 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h2 className="text-xl font-black">Đấu Trường Tính Nhanh (60 Giây)</h2>
              <p className="text-xs text-amber-100 font-semibold">
                Luyện phản xạ tính cộng trừ siêu tốc cho bé
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-2xl backdrop-blur-xs font-black text-sm">
            <Trophy className="w-4 h-4 text-yellow-200" /> Kỷ lục: {highScore}
          </div>
        </div>

        {/* Not Playing Screen */}
        {!isPlaying && !gameOver && (
          <div className="p-8 text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-5xl shadow-inner border-4 border-amber-300">
              🚀
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">Sẵn Sàng Thử Thách Chưa?</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Bé có 60 giây để trả lời càng nhiều phép tính cộng trừ càng tốt. Trả lời đúng liên tiếp sẽ được nhân điểm combo nhé!
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={startGame}
                className="px-8 py-3.5 rounded-2xl bg-amber-500 text-white font-black text-lg shadow-lg hover:bg-amber-600 hover:scale-105 transition cursor-pointer"
              >
                Bắt Đầu Ngay! ⭐
              </button>
            </div>
          </div>
        )}

        {/* Playing Screen */}
        {isPlaying && problem && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Stats row */}
            <div className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <div className="flex items-center gap-2 text-rose-600 font-black text-lg">
                <Timer className="w-6 h-6 animate-pulse" />
                <span>{timeLeft}s</span>
              </div>

              <div className="flex items-center gap-2 font-black text-lg text-amber-700">
                <Zap className="w-6 h-6 text-amber-500" />
                <span>Điểm: {score}</span>
              </div>

              {streak > 1 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-extrabold animate-bounce">
                  <Flame className="w-4 h-4" /> Combo x{streak}!
                </div>
              )}
            </div>

            {/* Problem display */}
            <div className="py-8 bg-amber-50/60 rounded-3xl border-3 border-amber-200 text-center shadow-inner">
              <div className="text-5xl sm:text-6xl font-black text-slate-800 tracking-wider font-mono">
                {problem.num1} {problem.op} {problem.num2} = <span className="text-amber-600">?</span>
              </div>
            </div>

            {/* 4 Choices */}
            <div className="grid grid-cols-2 gap-4">
              {problem.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="py-5 rounded-2xl bg-white border-3 border-amber-300 text-3xl font-black text-slate-800 hover:bg-amber-100 hover:border-amber-500 shadow-md hover:scale-102 active:scale-95 transition cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="p-8 text-center space-y-6">
            <span className="text-6xl inline-block animate-bounce">🏆</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-amber-700">Hết Giờ Rồi!</h3>
              <p className="text-slate-600 font-semibold">Bé đã hoàn thành xuất sắc thử thách!</p>
            </div>

            <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 max-w-sm mx-auto space-y-3">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <span>Điểm số đạt được:</span>
                <span className="text-3xl font-black text-amber-600">{score} điểm</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <span>Kỷ lục cao nhất:</span>
                <span className="text-xl font-black text-slate-900">{highScore} điểm</span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-white font-black text-base shadow-md hover:bg-amber-600 transition cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" /> Chơi Lại Lần Nữa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
