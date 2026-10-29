import React from 'react';

interface InteractiveClockProps {
  hour: number;
  minute?: number;
  size?: number;
  interactive?: boolean;
  onHourChange?: (hour: number) => void;
}

export const InteractiveClock: React.FC<InteractiveClockProps> = ({
  hour,
  minute = 0,
  size = 200,
  interactive = false,
  onHourChange,
}) => {
  // Convert hour and minute into rotation degrees
  // 12 hours = 360 deg, so 1 hour = 30 deg
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  // 60 mins = 360 deg, so 1 min = 6 deg
  const minuteAngle = minute * 6;

  const radius = size / 2;
  const center = radius;

  // 12 hour numbers
  const clockNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div
        className="relative bg-amber-50 rounded-full border-8 border-amber-400 shadow-lg select-none"
        style={{ width: size, height: size }}
      >
        {/* Hour numbers positioned in circle */}
        {clockNumbers.map((num, idx) => {
          const angle = idx * 30 * (Math.PI / 180);
          const r = radius - 28;
          const x = center + r * Math.sin(angle);
          const y = center - r * Math.cos(angle);

          return (
            <div
              key={num}
              onClick={() => interactive && onHourChange && onHourChange(num)}
              className={`absolute flex items-center justify-center font-black text-slate-800 transition ${
                interactive ? 'cursor-pointer hover:scale-125 hover:text-amber-600' : ''
              }`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                fontSize: size > 180 ? '1.1rem' : '0.85rem',
              }}
            >
              {num}
            </div>
          );
        })}

        {/* Hour Hand (Kim ngắn - màu đỏ) */}
        <div
          className="absolute origin-bottom bg-rose-600 rounded-full shadow-md z-10 transition-transform duration-300"
          style={{
            width: size * 0.04,
            height: size * 0.28,
            left: `calc(50% - ${size * 0.02}px)`,
            top: `calc(50% - ${size * 0.28}px)`,
            transform: `rotate(${hourAngle}deg)`,
            transformOrigin: 'bottom center',
          }}
        />

        {/* Minute Hand (Kim dài - màu xanh dương) */}
        <div
          className="absolute origin-bottom bg-blue-600 rounded-full shadow-md z-10 transition-transform duration-300"
          style={{
            width: size * 0.03,
            height: size * 0.4,
            left: `calc(50% - ${size * 0.015}px)`,
            top: `calc(50% - ${size * 0.4}px)`,
            transform: `rotate(${minuteAngle}deg)`,
            transformOrigin: 'bottom center',
          }}
        />

        {/* Center Pivot */}
        <div
          className="absolute rounded-full bg-amber-900 border-2 border-white shadow-md z-20"
          style={{
            width: size * 0.08,
            height: size * 0.08,
            left: `calc(50% - ${size * 0.04}px)`,
            top: `calc(50% - ${size * 0.04}px)`,
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm font-bold text-slate-700 bg-white/80 px-3 py-1.5 rounded-full border border-amber-200">
        <span className="flex items-center gap-1 text-rose-600">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Kim ngắn (Kim giờ)
        </span>
        <span className="flex items-center gap-1 text-blue-600">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Kim dài (Kim phút)
        </span>
      </div>
    </div>
  );
};
