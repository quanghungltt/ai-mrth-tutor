export interface TikZTemplate {
  id: string;
  title: string;
  grade: string;
  category: 'Lớp 1 - Tiểu học' | 'Hình phẳng (THCS/THPT)' | 'Hình không gian (THCS/THPT)';
  description: string;
  tikzCode: string;
  svgPreviewType: string;
}

export const TIKZ_TEMPLATES: TikZTemplate[] = [
  {
    id: 'cube-3d',
    title: 'Khối Lập Phương ABCD.A\'B\'C\'',
    grade: 'Toán Lớp 1 & Không gian',
    category: 'Lớp 1 - Tiểu học',
    description: 'Khối lập phương với đầy đủ các đỉnh, nét đứt [dashed] cho các cạnh khuất AD, DC, DD\'.',
    svgPreviewType: 'cube',
    tikzCode: `\\documentclass[tikz,border=5mm]{standalone}
\\usepackage{tikz}
\\usepackage{tkz-euclide}
\\begin{document}
\\begin{tikzpicture}[scale=1.2, line join=round, line cap=round]
  % Định nghĩa tọa độ các đỉnh
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (3,0);
  \\coordinate (D) at (1.2,1.2);
  \\coordinate (C) at ($(B)+(D)-(A)$);
  \\coordinate (h) at (0,3);
  \\coordinate (A') at ($(A)+(h)$);
  \\coordinate (B') at ($(B)+(h)$);
  \\coordinate (C') at ($(C)+(h)$);
  \\coordinate (D') at ($(D)+(h)$);

  % Cạnh khuất vẽ nét đứt [dashed]
  \\draw[dashed, thick] (A)--(D)--(C) (D)--(D');

  % Cạnh thấy vẽ nét liền
  \\draw[thick] (A)--(B)--(C)--(C')--(D')--(A')--cycle;
  \\draw[thick] (B)--(B') (A')--(B');

  % Đánh dấu các đỉnh
  \\foreach \\p/\\pos in {A/below left, B/below right, C/right, D/above left, A'/above left, B'/above right, C'/above right, D'/above}
    \\fill (\\p) circle (1.5pt) node[\\pos] {$\\p$};
\\end{tikzpicture}
\\end{document}`,
  },
  {
    id: 'cuboid-3d',
    title: 'Khối Hộp Chữ Nhật ABCD.A\'B\'C\'',
    grade: 'Toán Lớp 1 & Lớp 8-11',
    category: 'Lớp 1 - Tiểu học',
    description: 'Khối hộp chữ nhật có 6 mặt, các cạnh khuất vẽ bằng nét đứt [dashed].',
    svgPreviewType: 'cuboid',
    tikzCode: `\\documentclass[tikz,border=5mm]{standalone}
\\usepackage{tikz}
\\usepackage{tkz-euclide}
\\begin{document}
\\begin{tikzpicture}[scale=1, line join=round, line cap=round]
  % Tọa độ các đỉnh hộp chữ nhật
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (4.5,0);
  \\coordinate (D) at (1.5,1.5);
  \\coordinate (C) at ($(B)+(D)-(A)$);
  \\coordinate (A') at (0,2.5);
  \\coordinate (B') at ($(B)+(A')$);
  \\coordinate (C') at ($(C)+(A')$);
  \\coordinate (D') at ($(D)+(A')$);

  % Cạnh khuất (dashed)
  \\draw[dashed, thick] (A)--(D)--(C) (D)--(D');

  % Cạnh thấy
  \\draw[thick] (A)--(B)--(C)--(C')--(B')--(A')--cycle;
  \\draw[thick] (A')--(D')--(C') (B)--(B');

  % Nhãn điểm
  \\foreach \\p/\\pos in {A/below left, B/below right, C/right, D/above left, A'/above left, B'/above right, C'/above right, D'/above}
    \\fill (\\p) circle (1.5pt) node[\\pos] {$\\p$};
\\end{tikzpicture}
\\end{document}`,
  },
  {
    id: 'right-triangle-altitude',
    title: 'Tam Giác Vuông ABC tại A có Đường Cao AH',
    grade: 'Hình học phẳng',
    category: 'Hình phẳng (THCS/THPT)',
    description: 'Sử dụng tkz-euclide, đánh dấu góc vuông tại A và H, ký hiệu đoạn thẳng.',
    svgPreviewType: 'right-triangle',
    tikzCode: `\\documentclass[tikz,border=5mm]{standalone}
\\usepackage{tikz}
\\usepackage{tkz-euclide}
\\begin{document}
\\begin{tikzpicture}[scale=1.2]
  % Định nghĩa tam giác vuông tại A
  \\tkzDefPoint(0,0){A}
  \\tkzDefPoint(4,0){C}
  \\tkzDefPoint(0,3){B}

  % Chân đường cao H từ A xuống BC
  \\tkzDefPointBy[projection=onto B--C](A)\\tkzGetPoint{H}

  % Vẽ các đoạn thẳng
  \\tkzDrawPolygon[thick](A,B,C)
  \\tkzDrawSegment[thick](A,H)

  % Đánh dấu góc vuông chuẩn mực bằng tkz-euclide
  \\tkzMarkRightAngle[size=0.3,fill=gray!20](B,A,C)
  \\tkzMarkRightAngle[size=0.25,fill=gray!20](A,H,C)

  % Điểm và nhãn
  \\tkzDrawPoints[fill=black,size=4](A,B,C,H)
  \\tkzLabelPoints[below left](A)
  \\tkzLabelPoints[below right](C)
  \\tkzLabelPoints[above](B)
  \\tkzLabelPoints[above right](H)
\\end{tikzpicture}
\\end{document}`,
  },
  {
    id: 'pyramid-square-base',
    title: 'Hình Chóp S.ABCD (SA ⊥ đáy ABCD)',
    grade: 'Hình học không gian',
    category: 'Hình không gian (THCS/THPT)',
    description: 'Chóp có SA vuông góc đáy, nét đứt cho AB, AD, SA, AC, BD, đánh dấu góc vuông.',
    svgPreviewType: 'pyramid',
    tikzCode: `\\documentclass[tikz,border=5mm]{standalone}
\\usepackage{tikz}
\\usepackage{tkz-euclide}
\\begin{document}
\\begin{tikzpicture}[scale=1.1, line join=round, line cap=round]
  % Đáy hình bình hành biểu diễn hình chữ nhật/vuông
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (-1.5,-1.5);
  \\coordinate (D) at (3.5,0);
  \\coordinate (C) at ($(B)+(D)-(A)$);
  % Đỉnh S sao cho SA vuông góc đáy
  \\coordinate (S) at (0,3.5);

  % Cạnh khuất vẽ nét đứt [dashed]
  \\draw[dashed, thick] (A)--(B) (A)--(D) (S)--(A) (A)--(C) (B)--(D);

  % Cạnh thấy vẽ nét liền
  \\draw[thick] (S)--(B)--(C)--(S)--(D)--(C);

  % Đánh dấu góc vuông SA vuông góc AB, AD
  \\tkzMarkRightAngle[size=0.25](S,A,D)
  \\tkzMarkRightAngle[size=0.25](S,A,B)

  % Điểm và nhãn
  \\foreach \\p/\\pos in {S/above, A/above right, B/below left, C/below right, D/right}
    \\fill (\\p) circle (1.5pt) node[\\pos] {$\\p$};
\\end{tikzpicture}
\\end{document}`,
  },
  {
    id: 'isosceles-triangle',
    title: 'Tam Giác Cân ABC tại A (Ký hiệu bằng nhau)',
    grade: 'Hình học phẳng',
    category: 'Hình phẳng (THCS/THPT)',
    description: 'Ký hiệu hai cạnh bên AB = AC bằng vạch || và đường cao AH đồng thời là trung tuyến.',
    svgPreviewType: 'isosceles-triangle',
    tikzCode: `\\documentclass[tikz,border=5mm]{standalone}
\\usepackage{tikz}
\\usepackage{tkz-euclide}
\\begin{document}
\\begin{tikzpicture}[scale=1.2]
  % Định nghĩa các điểm tam giác cân
  \\tkzDefPoint(0,3){A}
  \\tkzDefPoint(-2,0){B}
  \\tkzDefPoint(2,0){C}
  \\tkzDefMidPoint(B,C)\\tkzGetPoint{H}

  % Vẽ hình
  \\tkzDrawPolygon[thick](A,B,C)
  \\tkzDrawSegment[thick, dashed](A,H)

  % Ký hiệu góc vuông và đoạn bằng nhau
  \\tkzMarkRightAngle[size=0.25](A,H,C)
  \\tkzMarkSegments[mark=s||,size=4pt](A,B A,C)
  \\tkzMarkSegments[mark=s|,size=3pt](B,H H,C)

  % Nhãn điểm
  \\tkzDrawPoints[fill=black,size=4](A,B,C,H)
  \\tkzLabelPoints[above](A)
  \\tkzLabelPoints[below left](B)
  \\tkzLabelPoints[below right](C)
  \\tkzLabelPoints[below](H)
\\end{tikzpicture}
\\end{document}`,
  },
  {
    id: 'grade1-number-line',
    title: 'Trục Số Lớp 1 (Phạm vi 0 - 10)',
    grade: 'Toán Lớp 1',
    category: 'Lớp 1 - Tiểu học',
    description: 'Trục số có các vạch chia đều từ 0 đến 10, mũi tên bước nhảy minh họa phép cộng 4 + 3 = 7.',
    svgPreviewType: 'numberline',
    tikzCode: `\\documentclass[tikz,border=5mm]{standalone}
\\usepackage{tikz}
\\begin{document}
\\begin{tikzpicture}[scale=1]
  % Trục số có mũi tên
  \\draw[thick, ->] (-0.5,0) -- (10.5,0) node[right] {$x$};
  
  % Các vạch chia và số từ 0 đến 10
  \\foreach \\x in {0,1,...,10} {
    \\draw[thick] (\\x,0.15) -- (\\x,-0.15) node[below=2pt] {\\large \\x};
  }

  % Cung nhảy minh họa phép cộng 4 + 3 = 7
  \\draw[->, ultra thick, blue] (4,0.3) to[out=60,in=120] node[above] {$+3$} (7,0.3);
  \\fill[red] (4,0) circle (2.5pt);
  \\fill[red] (7,0) circle (2.5pt);
\\end{tikzpicture}
\\end{document}`,
  },
];
