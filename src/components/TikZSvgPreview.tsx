import React from 'react';

interface TikZSvgPreviewProps {
  type: string;
  meta?: any;
}

export const TikZSvgPreview: React.FC<TikZSvgPreviewProps> = ({ type, meta }) => {
  // If meta has explicit points and lines from AI
  if (meta && meta.points && meta.lines) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-inner">
        <svg width="340" height="260" viewBox="0 0 340 260" className="overflow-visible">
          {/* Draw lines */}
          {meta.lines.map((l: any, i: number) => {
            const p1 = meta.points.find((p: any) => p.id === l.from);
            const p2 = meta.points.find((p: any) => p.id === l.to);
            if (!p1 || !p2) return null;
            return (
              <line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#1e293b"
                strokeWidth="2"
                strokeDasharray={l.dashed ? '5,5' : 'none'}
              />
            );
          })}

          {/* Draw right angles if any */}
          {meta.rightAngles?.map((ra: any, i: number) => {
            const v = meta.points.find((p: any) => p.id === ra.vertex);
            if (!v) return null;
            return (
              <rect
                key={i}
                x={v.x - 6}
                y={v.y - 6}
                width="12"
                height="12"
                fill="none"
                stroke="#dc2626"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Draw points & labels */}
          {meta.points.map((p: any) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#0f172a" />
              <text
                x={p.x + (p.labelPos === 'left' ? -12 : p.labelPos === 'right' ? 8 : 0)}
                y={p.y + (p.labelPos === 'above' ? -8 : 14)}
                fontSize="12"
                fontWeight="bold"
                fill="#0f172a"
                fontFamily="serif"
              >
                {p.label || p.id}
              </text>
            </g>
          ))}
        </svg>
        <span className="text-xs font-semibold text-slate-500 mt-2">
          {meta.title || 'Xem trước hình học'}
        </span>
      </div>
    );
  }

  // Predefined SVG previews for standard templates
  switch (type) {
    case 'cube':
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <svg width="280" height="240" viewBox="0 0 280 240" className="overflow-visible">
            {/* Coordinates:
                A: (50, 190), B: (170, 190), D: (100, 140), C: (220, 140)
                A': (50, 80), B': (170, 80), D': (100, 30), C': (220, 30)
            */}
            {/* Hidden edges (dashed) */}
            <line x1="50" y1="190" x2="100" y2="140" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="100" y1="140" x2="220" y2="140" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="100" y1="140" x2="100" y2="30" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />

            {/* Visible edges (solid) */}
            <polygon points="50,190 170,190 170,80 50,80" fill="none" stroke="#0f172a" strokeWidth="2" />
            <polygon points="50,80 170,80 220,30 100,30" fill="none" stroke="#0f172a" strokeWidth="2" />
            <polygon points="170,190 220,140 220,30 170,80" fill="none" stroke="#0f172a" strokeWidth="2" />

            {/* Vertices & Labels */}
            {[
              { id: 'A', x: 50, y: 190, pos: 'left' },
              { id: 'B', x: 170, y: 190, pos: 'right' },
              { id: 'C', x: 220, y: 140, pos: 'right' },
              { id: 'D', x: 100, y: 140, pos: 'left' },
              { id: "A'", x: 50, y: 80, pos: 'left' },
              { id: "B'", x: 170, y: 80, pos: 'right' },
              { id: "C'", x: 220, y: 30, pos: 'right' },
              { id: "D'", x: 100, y: 30, pos: 'left' },
            ].map((pt) => (
              <g key={pt.id}>
                <circle cx={pt.x} cy={pt.y} r="3" fill="#0f172a" />
                <text
                  x={pt.x + (pt.pos === 'left' ? -14 : 8)}
                  y={pt.y + 4}
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="serif"
                >
                  {pt.id}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-3 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            ✓ Nét đứt [dashed] chuẩn cho cạnh khuất AD, DC, DD'
          </div>
        </div>
      );

    case 'cuboid':
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <svg width="300" height="220" viewBox="0 0 300 220" className="overflow-visible">
            {/* A: (40, 170), B: (200, 170), D: (90, 130), C: (250, 130)
                A': (40, 70), B': (200, 70), D': (90, 30), C': (250, 30) */}
            <line x1="40" y1="170" x2="90" y2="130" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="90" y1="130" x2="250" y2="130" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="90" y1="130" x2="90" y2="30" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />

            <polygon points="40,170 200,170 200,70 40,70" fill="none" stroke="#0f172a" strokeWidth="2" />
            <polygon points="40,70 200,70 250,30 90,30" fill="none" stroke="#0f172a" strokeWidth="2" />
            <polygon points="200,170 250,130 250,30 200,70" fill="none" stroke="#0f172a" strokeWidth="2" />

            {[
              { id: 'A', x: 40, y: 170 },
              { id: 'B', x: 200, y: 170 },
              { id: 'C', x: 250, y: 130 },
              { id: 'D', x: 90, y: 130 },
              { id: "A'", x: 40, y: 70 },
              { id: "B'", x: 200, y: 70 },
              { id: "C'", x: 250, y: 30 },
              { id: "D'", x: 90, y: 30 },
            ].map((pt) => (
              <g key={pt.id}>
                <circle cx={pt.x} cy={pt.y} r="3" fill="#0f172a" />
                <text x={pt.x + 6} y={pt.y - 4} fontSize="11" fontWeight="bold" fontFamily="serif">
                  {pt.id}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-3 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            ✓ Nét đứt [dashed] chuẩn cho các cạnh khuất
          </div>
        </div>
      );

    case 'right-triangle':
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <svg width="260" height="220" viewBox="0 0 260 220" className="overflow-visible">
            {/* A: (40, 180), C: (220, 180), B: (40, 40)
                H is foot of altitude from A to BC
                A=(40,180), B=(40,40), C=(220,180) */}
            <polygon points="40,180 40,40 220,180" fill="none" stroke="#0f172a" strokeWidth="2" />
            {/* Altitude AH: H is around (108, 93) */}
            <line x1="40" y1="180" x2="108" y2="93" stroke="#dc2626" strokeWidth="2" />

            {/* Right angle marker at A (40, 180) */}
            <path d="M 40,165 L 55,165 L 55,180" fill="none" stroke="#0f172a" strokeWidth="1.5" />
            {/* Right angle marker at H */}
            <rect x="104" y="94" width="10" height="10" transform="rotate(38 108 93)" fill="none" stroke="#dc2626" strokeWidth="1.5" />

            <circle cx="40" cy="180" r="3.5" fill="#0f172a" />
            <text x="24" y="196" fontSize="13" fontWeight="bold" fontFamily="serif">A</text>

            <circle cx="40" cy="40" r="3.5" fill="#0f172a" />
            <text x="32" y="32" fontSize="13" fontWeight="bold" fontFamily="serif">B</text>

            <circle cx="220" cy="180" r="3.5" fill="#0f172a" />
            <text x="226" y="196" fontSize="13" fontWeight="bold" fontFamily="serif">C</text>

            <circle cx="108" cy="93" r="3.5" fill="#dc2626" />
            <text x="114" y="86" fontSize="13" fontWeight="bold" fill="#dc2626" fontFamily="serif">H</text>
          </svg>
          <div className="mt-3 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            ✓ Đánh dấu góc vuông tại A và chân đường cao H
          </div>
        </div>
      );

    case 'pyramid':
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <svg width="280" height="240" viewBox="0 0 280 240" className="overflow-visible">
            {/* S=(100, 30), A=(100, 140), B=(40, 190), C=(220, 190), D=(240, 140) */}
            {/* Dashed hidden edges */}
            <line x1="100" y1="30" x2="100" y2="140" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="100" y1="140" x2="40" y2="190" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="100" y1="140" x2="240" y2="140" stroke="#0284c7" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="100" y1="140" x2="220" y2="190" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="40" y1="190" x2="240" y2="140" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,4" />

            {/* Solid visible edges */}
            <line x1="100" y1="30" x2="40" y2="190" stroke="#0f172a" strokeWidth="2" />
            <line x1="100" y1="30" x2="220" y2="190" stroke="#0f172a" strokeWidth="2" />
            <line x1="100" y1="30" x2="240" y2="140" stroke="#0f172a" strokeWidth="2" />
            <line x1="40" y1="190" x2="220" y2="190" stroke="#0f172a" strokeWidth="2" />
            <line x1="220" y1="190" x2="240" y2="140" stroke="#0f172a" strokeWidth="2" />

            {/* Right angle marks at A (SA ⊥ AD, SA ⊥ AB) */}
            <path d="M 100,126 L 114,126 L 114,140" fill="none" stroke="#dc2626" strokeWidth="1.5" />

            {/* Points & Labels */}
            <circle cx="100" cy="30" r="3" fill="#0f172a" />
            <text x="96" y="20" fontSize="13" fontWeight="bold" fontFamily="serif">S</text>

            <circle cx="100" cy="140" r="3" fill="#0f172a" />
            <text x="82" y="142" fontSize="13" fontWeight="bold" fontFamily="serif">A</text>

            <circle cx="40" cy="190" r="3" fill="#0f172a" />
            <text x="24" y="202" fontSize="13" fontWeight="bold" fontFamily="serif">B</text>

            <circle cx="220" cy="190" r="3" fill="#0f172a" />
            <text x="224" y="202" fontSize="13" fontWeight="bold" fontFamily="serif">C</text>

            <circle cx="240" cy="140" r="3" fill="#0f172a" />
            <text x="246" y="144" fontSize="13" fontWeight="bold" fontFamily="serif">D</text>
          </svg>
          <div className="mt-3 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            ✓ SA ⊥ (ABCD), nét đứt cạnh khuất SA, AB, AD, AC, BD
          </div>
        </div>
      );

    case 'isosceles-triangle':
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <svg width="260" height="220" viewBox="0 0 260 220" className="overflow-visible">
            {/* A=(130, 30), B=(40, 180), C=(220, 180), H=(130, 180) */}
            <polygon points="130,30 40,180 220,180" fill="none" stroke="#0f172a" strokeWidth="2" />
            <line x1="130" y1="30" x2="130" y2="180" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,4" />

            {/* Right angle at H */}
            <rect x="130" y="168" width="12" height="12" fill="none" stroke="#dc2626" strokeWidth="1.5" />

            {/* Segment marks on AB and AC (||) */}
            <g transform="translate(85, 105) rotate(58)">
              <line x1="-3" y1="-6" x2="-3" y2="6" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="3" y1="-6" x2="3" y2="6" stroke="#0f172a" strokeWidth="1.5" />
            </g>
            <g transform="translate(175, 105) rotate(-58)">
              <line x1="-3" y1="-6" x2="-3" y2="6" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="3" y1="-6" x2="3" y2="6" stroke="#0f172a" strokeWidth="1.5" />
            </g>

            {/* Labels */}
            <circle cx="130" cy="30" r="3" fill="#0f172a" />
            <text x="126" y="20" fontSize="13" fontWeight="bold" fontFamily="serif">A</text>

            <circle cx="40" cy="180" r="3" fill="#0f172a" />
            <text x="24" y="196" fontSize="13" fontWeight="bold" fontFamily="serif">B</text>

            <circle cx="220" cy="180" r="3" fill="#0f172a" />
            <text x="226" y="196" fontSize="13" fontWeight="bold" fontFamily="serif">C</text>

            <circle cx="130" cy="180" r="3" fill="#dc2626" />
            <text x="126" y="200" fontSize="13" fontWeight="bold" fill="#dc2626" fontFamily="serif">H</text>
          </svg>
          <div className="mt-3 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-300">
            ✓ Ký hiệu hai cạnh bằng nhau AB = AC và đường cao AH
          </div>
        </div>
      );

    case 'numberline':
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <svg width="320" height="90" viewBox="0 0 320 90">
            {/* Axis */}
            <line x1="20" y1="55" x2="300" y2="55" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
            {/* Arrow def */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
              </marker>
            </defs>
            {/* Ticks 0 to 10 */}
            {Array.from({ length: 11 }).map((_, i) => {
              const x = 30 + i * 25;
              return (
                <g key={i}>
                  <line x1={x} y1="50" x2={x} y2="60" stroke="#0f172a" strokeWidth="2" />
                  <text x={x} y="74" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    {i}
                  </text>
                </g>
              );
            })}
            {/* Jump arc from 4 to 7 */}
            <path d="M 130,48 Q 167,15 205,48" fill="none" stroke="#2563eb" strokeWidth="2.5" />
            <text x="168" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2563eb">
              +3
            </text>
            <circle cx="130" cy="55" r="4" fill="#dc2626" />
            <circle cx="205" cy="55" r="4" fill="#dc2626" />
          </svg>
          <div className="mt-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            ✓ Trục số Toán Lớp 1 minh họa bước nhảy 4 + 3 = 7
          </div>
        </div>
      );

    default:
      return (
        <div className="p-8 text-center text-slate-500 text-sm">
          Xem trước hình học trực quan
        </div>
      );
  }
};
