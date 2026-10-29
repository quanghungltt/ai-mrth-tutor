import React, { useState } from 'react';
import { Printer, RefreshCw, Eye, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import { playClickSound } from '../utils/soundEffects';

interface WorksheetItem {
  id: number;
  type: 'calc' | 'compare' | 'word' | 'count';
  question: string;
  detail?: string;
  answer: string;
}

export const WorksheetGenerator: React.FC = () => {
  const [schoolName, setSchoolName] = useState<string>('Trường Tiểu Học Kim Đồng');
  const [examTitle, setExamTitle] = useState<string>('PHIẾU ÔN TẬP TOÁN LỚP 1 - HỌC KỲ II');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(1);

  // Generate a set of realistic Grade 1 worksheet questions
  const generateWorksheetData = (): WorksheetItem[] => {
    return [
      {
        id: 1,
        type: 'calc',
        question: 'Bài 1: Tính nhẩm (2 điểm)',
        detail: 'a) 4 + 5 = ....         b) 9 - 3 = ....         c) 12 + 6 = ....         d) 18 - 5 = ....',
        answer: 'a) 9; b) 6; c) 18; d) 13',
      },
      {
        id: 2,
        type: 'compare',
        question: 'Bài 2: Điền dấu thích hợp (>, <, =) vào chỗ chấm (2 điểm)',
        detail: 'a) 15 ..... 19           b) 20 + 30 ..... 50           c) 47 ..... 42           d) 65 - 5 ..... 55',
        answer: 'a) < ; b) = ; c) > ; d) > (60 > 55)',
      },
      {
        id: 3,
        type: 'calc',
        question: 'Bài 3: Đặt tính rồi tính (2 điểm)',
        detail: '  32 + 25             58 - 34             41 + 17             79 - 26\n  -------             -------             -------             -------',
        answer: '32 + 25 = 57 ; 58 - 34 = 24 ; 41 + 17 = 58 ; 79 - 26 = 53',
      },
      {
        id: 4,
        type: 'count',
        question: 'Bài 4: Hình học & Đo lường (2 điểm)',
        detail: 'a) Một tuần lễ có bao nhiêu ngày? ....................................................\nb) Chiếc bút chì dài từ vạch 0 cm đến vạch 8 cm. Chiếc bút chì dài .......... cm.\nc) Khối lập phương có bao nhiêu mặt là hình vuông? .................................',
        answer: 'a) 7 ngày; b) 8 cm; c) 6 mặt hình vuông',
      },
      {
        id: 5,
        type: 'word',
        question: 'Bài 5: Giải bài toán có lời văn (2 điểm)',
        detail: 'Bạn Nam có 14 viên bi. Nam cho bạn Việt 4 viên bi. Hỏi Nam còn lại bao nhiêu viên bi?\n\nBài giải:\n....................................................................................................................................\n....................................................................................................................................\n....................................................................................................................................',
        answer: 'Số viên bi Nam còn lại là: 14 - 4 = 10 (viên bi). Đáp số: 10 viên bi.',
      },
    ];
  };

  const [items, setItems] = useState<WorksheetItem[]>(generateWorksheetData());

  const handleShuffle = () => {
    playClickSound();
    setSeed((prev) => prev + 1);
    setItems(generateWorksheetData());
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Control Bar (no-print) */}
      <div className="no-print bg-white p-5 rounded-3xl shadow-md border-2 border-amber-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" /> Trình Tạo Phiếu Ôn Tập & Đề Thi A4
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Tự động căn chỉnh chuẩn trang in A4 cho giáo viên và phụ huynh in cho bé
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            {showAnswerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnswerKey ? 'Ẩn Đáp Án' : 'Hiện Đáp Án'}
          </button>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Tạo Đề Khác
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> In Phiếu (A4 / PDF)
          </button>
        </div>
      </div>

      {/* Editable metadata inputs (no-print) */}
      <div className="no-print bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex flex-wrap gap-4 text-xs font-bold text-slate-700">
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1">Tên trường tiểu học:</label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold"
          />
        </div>
        <div className="flex-2 min-w-[280px]">
          <label className="block mb-1">Tiêu đề bài kiểm tra / phiếu bài tập:</label>
          <input
            type="text"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold"
          />
        </div>
      </div>

      {/* Printable Sheet (Standard A4 layout) */}
      <div className="print-page bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-300 text-slate-900 font-serif leading-relaxed space-y-6">
        {/* School Header & Student Box */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="font-bold text-xs tracking-wider uppercase">{schoolName}</h4>
            <p className="text-xs">Họ và tên học sinh: ...................................................</p>
            <p className="text-xs">Lớp: 1..... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Năm học: 2026 - 2027</p>
          </div>

          <div className="flex border-2 border-slate-800 text-center text-xs">
            <div className="border-r border-slate-800 p-2 w-20">
              <span className="font-bold block">Điểm số</span>
              <div className="h-10"></div>
            </div>
            <div className="p-2 w-32">
              <span className="font-bold block">Lời phê cô giáo</span>
              <div className="h-10"></div>
            </div>
          </div>
        </div>

        {/* Exam Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black tracking-wide uppercase">{examTitle}</h2>
          <p className="text-xs italic text-slate-600">Thời gian làm bài: 35 phút (Không kể thời gian phát đề)</p>
        </div>

        {/* Worksheet Items */}
        <div className="space-y-6 pt-2">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <h5 className="font-bold text-sm text-slate-900">{item.question}</h5>
              <div className="pl-4 font-mono text-xs text-slate-800 whitespace-pre-line leading-loose">
                {item.detail}
              </div>

              {/* Teacher answer key box */}
              {showAnswerKey && (
                <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-300 text-emerald-900 text-xs font-sans">
                  <span className="font-bold">Đáp án: </span> {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-8 text-center text-xs italic text-slate-500 border-t border-slate-200">
          --- Chúc các con làm bài thật tốt và đạt điểm 10 nhé! ---
        </div>
      </div>
    </div>
  );
};
