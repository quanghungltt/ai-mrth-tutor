import React, { useState } from 'react';
import { TIKZ_TEMPLATES, TikZTemplate } from '../data/tikzTemplates';
import { TikZSvgPreview } from './TikZSvgPreview';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';
import {
  Code,
  Copy,
  Check,
  Download,
  Sparkles,
  Upload,
  Image as ImageIcon,
  BookOpen,
  Info,
  ExternalLink,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const TikZStudio: React.FC = () => {
  const [promptText, setPromptText] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TikZTemplate>(TIKZ_TEMPLATES[0]);
  const [tikzCode, setTikzCode] = useState<string>(TIKZ_TEMPLATES[0].tikzCode);
  const [svgMeta, setSvgMeta] = useState<any>(null);
  const [svgPreviewType, setSvgPreviewType] = useState<string>(TIKZ_TEMPLATES[0].svgPreviewType);

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Loading & Copy status
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [aiNote, setAiNote] = useState<string>('');

  const handleSelectTemplate = (tmpl: TikZTemplate) => {
    playClickSound();
    setSelectedTemplate(tmpl);
    setTikzCode(tmpl.tikzCode);
    setSvgPreviewType(tmpl.svgPreviewType);
    setSvgMeta(null);
    setAiNote(tmpl.description);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateTikZ = async () => {
    if (!promptText && !imageBase64) return;
    playClickSound();
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/tikz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          imageBase64: imageBase64,
        }),
      });

      const data = await res.json();
      if (data.success && data.tikzCode) {
        playSuccessSound();
        setTikzCode(data.tikzCode);
        setAiNote(data.fullResponse);
        if (data.svgMeta) {
          setSvgMeta(data.svgMeta);
          setSvgPreviewType('custom');
        } else {
          // Fallback preview based on keywords
          if (promptText.toLowerCase().includes('lập phương')) setSvgPreviewType('cube');
          else if (promptText.toLowerCase().includes('chóp')) setSvgPreviewType('pyramid');
          else if (promptText.toLowerCase().includes('vuông')) setSvgPreviewType('right-triangle');
          else if (promptText.toLowerCase().includes('hộp')) setSvgPreviewType('cuboid');
        }
      } else {
        alert(data.error || 'Không thể tạo mã TikZ lúc này.');
      }
    } catch (err: any) {
      alert('Lỗi kết nối khi gọi AI: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(tikzCode);
    setCopied(true);
    playClickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTex = () => {
    playClickSound();
    const element = document.createElement('a');
    const file = new Blob([tikzCode], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedTemplate.id || 'hinh_toan_tikz'}.tex`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Studio Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black tracking-wide text-blue-100">
            <Sparkles className="w-4 h-4 text-yellow-300" /> TRỢ LÝ GIÁO VIÊN TOÁN HỌC & SOẠN ĐỀ
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Chuyển Đổi Đề Bài Thành Mã TikZ Chuẩn Đẹp (tkz-euclide)
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Nhận đề bài hình học (văn bản hoặc hình ảnh chụp từ đề thi), tự động xuất mã TikZ chất lượng cao. Đánh dấu góc vuông chuẩn mực, ký hiệu đoạn bằng nhau, nét đứt <code className="bg-blue-900/60 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs">[dashed]</code> cho các cạnh khuất hình không gian.
          </p>
        </div>

        {/* Decorative badge */}
        <div className="absolute right-4 bottom-4 opacity-10 text-9xl font-mono select-none pointer-events-none">
          TikZ
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Templates (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Input Box */}
          <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                <Code className="w-5 h-5 text-indigo-600" /> Nhập Đề Bài Toán Hình
              </h3>
              <span className="text-xs text-slate-500 font-semibold">Chữ hoặc Ảnh</span>
            </div>

            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ví dụ: Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a. Cạnh bên SA vuông góc với đáy. Hãy vẽ hình và đánh dấu góc vuông SA vuông góc đáy, các cạnh khuất nét đứt..."
              rows={4}
              className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
            />

            {/* Image upload box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-500" /> Tải ảnh đề bài (nếu có):
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition">
                  <Upload className="w-4 h-4" /> Chọn ảnh đề bài
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imageFile && (
                  <span className="text-xs font-semibold text-emerald-600 truncate max-w-[180px]">
                    ✓ {imageFile.name}
                  </span>
                )}
              </div>

              {imageBase64 && (
                <div className="relative mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center max-h-36 overflow-hidden">
                  <img
                    src={imageBase64}
                    alt="Preview"
                    className="max-h-32 object-contain rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImageBase64(null);
                    }}
                    className="absolute top-3 right-3 bg-rose-600 text-white rounded-full p-1 text-xs font-bold hover:bg-rose-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateTikZ}
              disabled={loading || (!promptText && !imageBase64)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold text-sm shadow-md hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang phân tích & sinh mã TikZ...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" /> Chuyển Sang Mã TikZ Chuẩn
                </>
              )}
            </button>
          </div>

          {/* Quick Predefined Templates */}
          <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Kho Mẫu Hình Chuẩn Sư Phạm ({TIKZ_TEMPLATES.length})
            </h4>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {TIKZ_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer flex flex-col gap-1 ${
                    selectedTemplate.id === tmpl.id
                      ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 truncate">
                      {tmpl.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{tmpl.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code & Interactive Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual SVG Preview Card */}
          <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <span className="text-xl">👁️</span> Xem Trước Trực Quan Hình Học
              </h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Chuẩn tkz-euclide
              </span>
            </div>

            <TikZSvgPreview type={svgPreviewType} meta={svgMeta} />
          </div>

          {/* TikZ Code Output Block */}
          <div className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden border-2 border-slate-800">
            {/* Code Header */}
            <div className="bg-slate-800 px-5 py-3 flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-400">
                <Code className="w-4 h-4" /> Mã Nguồn TikZ (LaTeX)
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Sao chép mã
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadTex}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition cursor-pointer"
                  title="Tải file .tex"
                >
                  <Download className="w-3.5 h-3.5" /> Tải .tex
                </button>
              </div>
            </div>

            {/* Code Text Area */}
            <div className="p-4 overflow-x-auto max-h-[380px] scrollbar-thin">
              <pre className="font-['JetBrains_Mono',monospace] text-xs leading-relaxed text-emerald-300 whitespace-pre">
                {tikzCode}
              </pre>
            </div>

            {/* Code Footer with LaTeX guide */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" /> Hướng dẫn biên dịch LaTeX:
              </div>
              <p>
                Thầy/Cô chỉ cần thêm <code className="text-amber-300">\usepackage&#123;tkz-euclide&#125;</code> và <code className="text-amber-300">\usepackage&#123;tikz&#125;</code> vào phần khai báo (preamble) trên Overleaf hoặc TeXMaker là có thể xuất file PDF hoàn hảo!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
