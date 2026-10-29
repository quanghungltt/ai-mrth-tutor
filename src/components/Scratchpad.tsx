import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen, Trash2, X, Download } from 'lucide-react';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#2563eb');
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions according to container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Initial background: light grid / notebook lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
  }, [isOpen]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const step = 28;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (isEraser) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = lineWidth * 4;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border-4 border-amber-300 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-amber-400 px-5 py-3 flex items-center justify-between text-amber-950">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h3 className="font-extrabold text-lg sm:text-xl">Bảng Nháp Ô Ly Của Bé</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-500 transition-colors text-amber-950 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-amber-50 border-b border-amber-200 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEraser(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm cursor-pointer transition ${
                !isEraser ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Pen className="w-4 h-4" /> Bút vẽ
            </button>
            <button
              onClick={() => setIsEraser(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm cursor-pointer transition ${
                isEraser ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Eraser className="w-4 h-4" /> Tẩy gôm
            </button>
          </div>

          {/* Color palette */}
          {!isEraser && (
            <div className="flex items-center gap-2">
              {['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0f172a'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    color === c ? 'scale-125 border-slate-900 shadow-md' : 'border-white hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 font-bold text-sm hover:bg-rose-200 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Xóa hết
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="relative w-full h-[400px] bg-white cursor-crosshair touch-none select-none">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Footer tip */}
        <div className="bg-amber-100/60 px-4 py-2 text-xs text-amber-800 text-center font-medium">
          💡 Bé có thể viết số, đếm que tính hoặc tính nhẩm đặt tính trực tiếp lên bảng này nhé!
        </div>
      </div>
    </div>
  );
};
