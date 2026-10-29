import React from 'react';

interface RulerMeasureProps {
  lengthCm: number;
  itemName?: string;
}

export const RulerMeasure: React.FC<RulerMeasureProps> = ({ lengthCm, itemName = 'Chiếc bút chì' }) => {
  // A ruler showing 0 to 12 cm
  const maxCm = 12;

  return (
    <div className="flex flex-col items-center w-full max-w-lg p-3 bg-amber-50/70 rounded-2xl border border-amber-200">
      {/* Object being measured */}
      <div className="w-full relative h-12 flex items-center mb-2">
        <div
          className="relative h-7 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-l-md rounded-r-full shadow-md flex items-center px-3 border border-amber-600 transition-all duration-300"
          style={{ width: `${(lengthCm / maxCm) * 100}%` }}
        >
          <span className="text-xs font-black text-amber-950 truncate drop-shadow-xs">
            ✏️ {itemName}
          </span>
          {/* Pencil tip */}
          <div className="absolute right-0 top-0 bottom-0 w-3 bg-slate-800 clip-path-tip" />
        </div>
      </div>

      {/* Realistic Metric Ruler */}
      <div className="relative w-full h-16 bg-gradient-to-b from-yellow-100 to-yellow-200 border-2 border-yellow-500 rounded-lg shadow-inner overflow-hidden select-none">
        <div className="absolute top-1 left-2 text-[10px] font-extrabold text-yellow-800 tracking-wider">
          XĂNG-TI-MÉT (cm)
        </div>

        {/* Ruler ticks */}
        <div className="absolute bottom-0 left-0 right-0 h-10 flex">
          {Array.from({ length: maxCm + 1 }).map((_, cm) => (
            <div
              key={cm}
              className="relative flex-1 border-r border-yellow-700/60 h-8 flex flex-col justify-between items-center"
              style={{ flexBasis: `${100 / maxCm}%` }}
            >
              {/* Half-cm small tick */}
              {cm < maxCm && (
                <div className="absolute top-3 left-1/2 w-[1px] h-3 bg-yellow-600 -translate-x-1/2" />
              )}
              {/* Number */}
              <span className="text-xs font-black text-slate-800 mt-1">{cm}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 text-xs font-semibold text-slate-600">
        📍 Đầu bút đặt từ vạch <span className="font-bold text-amber-700">0</span> và kết thúc ở vạch{' '}
        <span className="font-black text-rose-600 text-sm">{lengthCm} cm</span>
      </div>
    </div>
  );
};
