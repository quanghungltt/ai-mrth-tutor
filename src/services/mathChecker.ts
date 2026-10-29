/**
 * Bộ kiểm tra toán học độc lập (Independent Mathematical Verifier)
 * Dành cho đại số và phương trình bậc nhất một ẩn THCS (XD-02A)
 * Tuân thủ quy tắc trung thực: KHÔNG dùng điểm tự tin của AI thay thế bằng chứng,
 * chỉ xác nhận "verified" khi thuật toán đại số xác minh được tính tương đương.
 */

import { StepVerificationDetail, StepVerificationStatus } from '../types/math.ts';
import { DEMO_PROBLEMS } from '../data/problems.ts';

export interface LinearTerm {
  a: number; // Hệ số của x
  b: number; // Hằng số tự do
}

export interface IndependentVerificationResult {
  isVerifiable: boolean;
  status: 'verified' | 'partially_verified' | 'unverified';
  rootErrorIndex: number | null;
  correctRoot?: number;
  notes: string[];
}

/**
 * Loại bỏ khoảng trắng và chuẩn hóa ký hiệu toán
 */
function cleanExpr(str: string): string {
  return str
    .replace(/\s+/g, '')
    .replace(/[×·]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/–|—/g, '-')
    .replace(/(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)/g, '$1/$2')
    .toLowerCase();
}

/**
 * Phân tích an toàn một số, phân số hữu tỉ p/q hoặc phép tính nhân số học p*q.
 * Đọc toàn bộ chuỗi, không dùng parseFloat cắt cụt ký tự thừa,
 * kiểm tra mẫu số khác 0 và tính giá trị chính xác.
 */
function parseNumberOrFraction(token: string): number | null {
  if (!token) return null;
  const s = token.trim();

  // 1. Phân số hoặc phép chia dạng p/q
  const fracMatch = s.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (isNaN(num) || isNaN(den) || Math.abs(den) < 1e-12) {
      return null; // Mẫu số bằng 0 hoặc không hợp lệ
    }
    return num / den;
  }

  // 2. Phép nhân số học giữa các hằng số dạng p*q
  const multMatch = s.match(/^([+-]?\d+(?:\.\d+)?)\*([+-]?\d+(?:\.\d+)?)$/);
  if (multMatch) {
    const a = parseFloat(multMatch[1]);
    const b = parseFloat(multMatch[2]);
    if (isNaN(a) || isNaN(b)) return null;
    return a * b;
  }

  // 3. Số đơn thuần dạng nguyên hoặc thập phân
  const numMatch = s.match(/^[+-]?\d+(?:\.\d+)?$/);
  if (numMatch) {
    const val = parseFloat(s);
    return isNaN(val) ? null : val;
  }

  // Không chấp nhận ký tự thừa hay cú pháp sai (ví dụ: 20/4abc)
  return null;
}

/**
 * Phân tích cú pháp biểu thức tuyến tính dạng c(ax + b) hoặc ax + b
 * Trả về { a, b } sao cho biểu thức tương đương với a*x + b
 */
function parseLinearExpression(expr: string): LinearTerm | null {
  const s = cleanExpr(expr);
  if (!s) return null;

  try {
    // 1. Dạng c(ax + b) hoặc -(ax + b)
    const parenMatch = s.match(/^([+-]?\d*)(?:\*|\.)?\(([+-]?\d*x?[+-]?\d*)\)$/);
    if (parenMatch) {
      let multiplier = 1;
      if (parenMatch[1] === '-' || parenMatch[1] === '-1') multiplier = -1;
      else if (parenMatch[1] === '+' || parenMatch[1] === '') multiplier = 1;
      else multiplier = parseFloat(parenMatch[1]);

      const inner = parseLinearPolynomial(parenMatch[2]);
      if (!inner) return null;
      return { a: inner.a * multiplier, b: inner.b * multiplier };
    }

    // 2. Dạng kết hợp như 5-(2x-3)
    const subParenMatch = s.match(/^([+-]?\d+)-\((\d*x?[+-]?\d*)\)$/);
    if (subParenMatch) {
      const leadingConst = parseFloat(subParenMatch[1]);
      const inner = parseLinearPolynomial(subParenMatch[2]);
      if (!inner) return null;
      return { a: -inner.a, b: leadingConst - inner.b };
    }

    // 3. Đa thức tuyến tính chuẩn ax + b
    return parseLinearPolynomial(s);
  } catch {
    return null;
  }
}

function parseLinearPolynomial(s: string): LinearTerm | null {
  // Tách thành các hạng tử kèm dấu
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms) return null;

  let totalA = 0;
  let totalB = 0;

  for (const term of terms) {
    if (term.includes('x')) {
      const coeffStr = term.replace('x', '').replace('*', '');
      let coeff = 1;
      if (coeffStr === '' || coeffStr === '+') coeff = 1;
      else if (coeffStr === '-') coeff = -1;
      else {
        const parsed = parseNumberOrFraction(coeffStr);
        if (parsed === null) return null;
        coeff = parsed;
      }
      totalA += coeff;
    } else {
      const parsed = parseNumberOrFraction(term);
      if (parsed === null) return null;
      totalB += parsed;
    }
  }

  return { a: totalA, b: totalB };
}

/**
 * Phân tích phương trình tuyến tính A(x) = B(x)
 * Trả về nghiệm x nếu có nghiệm duy nhất
 */
export function solveLinearEquation(eqStr: string): { root: number | null; isIdentical: boolean; isNoSolution: boolean } | null {
  const parts = eqStr.split('=');
  if (parts.length !== 2) return null;

  const left = parseLinearExpression(parts[0]);
  const right = parseLinearExpression(parts[1]);

  if (!left || !right) return null;

  // (left.a)x + left.b = (right.a)x + right.b
  // (left.a - right.a)x = right.b - left.b
  const diffA = left.a - right.a;
  const diffB = right.b - left.b;

  if (Math.abs(diffA) < 1e-9) {
    if (Math.abs(diffB) < 1e-9) {
      return { root: null, isIdentical: true, isNoSolution: false };
    }
    return { root: null, isIdentical: false, isNoSolution: true };
  }

  const root = diffB / diffA;
  return { root, isIdentical: false, isNoSolution: false };
}

/**
 * Kiểm tra độc lập lời giải phương trình bậc nhất một ẩn
 */
export function verifyLinearEquationSteps(
  problemText: string,
  steps: string[]
): IndependentVerificationResult {
  const problemEq = solveLinearEquation(problemText);

  // Nếu đề bài không phải phương trình tuyến tính chuẩn một ẩn mà bộ giải hỗ trợ
  if (!problemEq || problemEq.root === null) {
    return {
      isVerifiable: false,
      status: 'unverified',
      rootErrorIndex: null,
      notes: ['Đề bài nằm ngoài phạm vi giải quyết của bộ kiểm chứng đại số tuyến tính tự động.'],
    };
  }

  const originalRoot = problemEq.root;
  let firstErrorIdx: number | null = null;
  const stepRoots: (number | null)[] = [];

  for (let i = 0; i < steps.length; i++) {
    // Làm sạch ký hiệu mũi tên hoặc vế kết quả nếu bước chứa \Rightarrow
    const cleanedStep = steps[i].split(/\\Rightarrow|=>/)[0].trim();
    const stepEq = solveLinearEquation(cleanedStep);

    if (!stepEq || stepEq.root === null) {
      // Có thể là bước ghi nhận x = c trực tiếp
      const directMatch = cleanedStep.match(/x\s*=\s*([+-]?\d+(?:\.\d+)?|\d+\/\d+)/i);
      if (directMatch) {
        let val: number;
        if (directMatch[1].includes('/')) {
          const [num, den] = directMatch[1].split('/').map(Number);
          val = num / den;
        } else {
          val = parseFloat(directMatch[1]);
        }
        stepRoots.push(val);
        if (firstErrorIdx === null && Math.abs(val - originalRoot) > 1e-6) {
          firstErrorIdx = i;
        }
      } else {
        stepRoots.push(null);
      }
    } else {
      stepRoots.push(stepEq.root);
      if (firstErrorIdx === null && Math.abs(stepEq.root - originalRoot) > 1e-6) {
        firstErrorIdx = i;
      }
    }
  }

  // Kết luận kiểm chứng
  if (firstErrorIdx !== null) {
    return {
      isVerifiable: true,
      status: 'verified',
      rootErrorIndex: firstErrorIdx,
      correctRoot: originalRoot,
      notes: [
        `Bộ kiểm chứng đại số độc lập xác nhận nghiệm đúng của phương trình gốc là x = ${originalRoot}.`,
        `Tập nghiệm bị thay đổi tại Bước ${firstErrorIdx + 1} (nghiệm biến thành ${stepRoots[firstErrorIdx] !== null ? stepRoots[firstErrorIdx] : 'không xác định'}).`,
      ],
    };
  }

  // Nếu tất cả các bước đều giữ nguyên nghiệm
  const allValid = stepRoots.every((r) => r !== null && Math.abs(r - originalRoot) < 1e-6);
  if (allValid && stepRoots.length > 0) {
    return {
      isVerifiable: true,
      status: 'verified',
      rootErrorIndex: null,
      correctRoot: originalRoot,
      notes: [
        `Bộ kiểm chứng đại số độc lập xác nhận tất cả các bước đều bảo toàn nghiệm đúng x = ${originalRoot}.`,
      ],
    };
  }

  return {
    isVerifiable: true,
    status: 'partially_verified',
    rootErrorIndex: null,
    correctRoot: originalRoot,
    notes: [
      `Đã tính được nghiệm gốc x = ${originalRoot}, một số bước trung gian cần xem xét thêm kết hợp phản hồi từ AI.`,
    ],
  };
}

/**
 * Kiểm tra xem biểu thức có chứa cách viết phân số nhập nhằng liền biến x hay không
 * Ví dụ: -2/3x=4 hoặc 2/3x (không rõ là (-2/3)*x hay -2/(3x))
 */
export function isAmbiguousFractionNotation(expr: string): boolean {
  const cleaned = cleanExpr(expr);
  // Dạng có phân số chia liền biến x như -2/3x hoặc /x mà không được bao bọc bởi ngoặc phân số như (-2/3)*x
  const ambiguousAdjacentVar = /(?:^|[^()0-9])([+-]?\d+)\/(\d*)x/i;
  const directSlashVar = /\/x/i;
  return ambiguousAdjacentVar.test(cleaned) || directSlashVar.test(cleaned);
}

/**
 * Kiểm tra xem một chuỗi có phải là phát biểu nghiệm trực tiếp (ví dụ: x = 4, x = -2, x = 5) hay không.
 * Không coi các phép tính chia hoặc phân số chưa thực hiện (như x = 20/4) là phát biểu nghiệm trực tiếp,
 * để phân biệt rõ giữa bước chia hệ số trung gian và kết luận nghiệm cuối cùng.
 */
export function isDirectRootAssertion(expr: string): boolean {
  const cleaned = cleanExpr(expr).replace(/\s+/g, '');
  return /^x=[+-]?\d+(?:\.\d+)?$/i.test(cleaned);
}

/**
 * XD-02B & FIX-02: Kiểm chứng độc lập một bước sửa của học sinh
 * Tuân thủ nguyên tắc trung thực toán học và bảo mật sư phạm:
 * - Đối chiếu với đề bài và nghiệm chuẩn của phương trình gốc
 * - TUYỆT ĐỐI KHÔNG tiết lộ nghiệm cuối cùng (x = 4) trong explanation hoặc kết quả trả về
 * - Phân biệt rõ giữa bước biến đổi đại số tương đương (2x + 6 = 14) và phát biểu nghiệm trực tiếp (x = 4)
 * - Trả về verified_correct, verified_incorrect, uncertain hoặc unsupported
 */
export function verifyCorrectionStep(
  problemText: string,
  stepText: string,
  errorContext?: {
    errorStepIndex?: number | null;
    errorCategory?: string | null;
    notes?: string;
  }
): StepVerificationDetail {
  const trimmedStep = (stepText || '').trim();
  if (!trimmedStep) {
    return {
      status: 'unsupported',
      explanation: 'Chưa có bước sửa nào được nhập để kiểm chứng.',
      notes: ['Bước sửa rỗng.'],
    };
  }

  // A10: Kiểm tra sự hiện diện của ngữ cảnh lỗi để đối chiếu quy tắc
  const hasErrorContext = Boolean(
    errorContext &&
    (errorContext.errorCategory ||
     errorContext.errorStepIndex !== undefined ||
     errorContext.notes)
  );

  if (!hasErrorContext) {
    return {
      status: 'uncertain',
      originalRoot: null,
      proposedRoot: null,
      explanation: 'Chưa xác định được ngữ cảnh bước sửa cụ thể của bài toán để đối chiếu bước biến đổi tương ứng. Em hãy chọn hoặc nêu rõ bước cần sửa nhé.',
      notes: ['Thiếu thông tin ngữ cảnh lỗi (errorContext) để đối chiếu đúng bước giải.'],
    };
  }

  // 1. Kiểm tra cách viết ký hiệu toán học nhập nhằng (ví dụ: -2/3x=4)
  if (isAmbiguousFractionNotation(trimmedStep)) {
    return {
      status: 'uncertain',
      originalRoot: null,
      proposedRoot: null,
      explanation: `Cách viết phân số liền biến '${trimmedStep}' có tính nhập nhằng về thứ tự ưu tiên phép tính (có thể hiểu là $(-2/3) \\cdot x = 4$ hoặc $\\frac{-2}{3x} = 4$). Em hãy viết rõ ràng dạng \`(-2/3)*x = 4\` hoặc \`-(2*x)/3 = 4\` để bộ kiểm chứng đại số có thể xác nhận chính xác.`,
      notes: [
        `Phát hiện ký hiệu phân số nhập nhằng: '${trimmedStep}'.`,
        'Yêu cầu học sinh làm rõ cách viết bằng cách sử dụng dấu ngoặc đơn hoặc ký hiệu nhân tường minh.',
      ],
    };
  }

  // 2. Giải phương trình gốc để tìm nghiệm chuẩn (dùng nội bộ để kiểm tra tính tương đương)
  const problemEq = solveLinearEquation(problemText);
  if (!problemEq || problemEq.root === null) {
    return {
      status: 'unsupported',
      explanation: 'Đề bài hiện tại nằm ngoài phạm vi giải quyết của bộ kiểm chứng đại số tuyến tính tự động.',
      notes: ['Không thể giải nghiệm duy nhất của phương trình gốc.'],
    };
  }

  const originalRoot = problemEq.root;

  // 3. Phân biệt phát biểu nghiệm trực tiếp (x = c) với bước biến đổi đại số
  const isDirectRoot = isDirectRootAssertion(trimmedStep);
  const isIntermediateContext =
    errorContext?.errorStepIndex !== undefined &&
    errorContext?.errorStepIndex !== null &&
    errorContext.errorStepIndex < 2;

  if (isDirectRoot) {
    const stepEq = solveLinearEquation(trimmedStep);
    const isRootMatch = stepEq && stepEq.root !== null && Math.abs(stepEq.root - originalRoot) < 1e-6;

    if (isRootMatch) {
      if (isIntermediateContext) {
        // Học sinh nhập luôn nghiệm cuối cùng thay vì sửa bước biến đổi trung gian (như phép nhân phân phối)
        return {
          status: 'uncertain',
          stepType: 'final_root',
          originalRoot: null,
          proposedRoot: null,
          explanation: `Em đang nêu nghiệm cuối cùng của bài toán thay vì bước biến đổi đại số trung gian cho Bước ${(errorContext?.errorStepIndex ?? 0) + 1}. Em hãy viết lại phương trình sau khi thực hiện đúng bước biến đổi đó nhé (ví dụ: áp dụng đúng phép nhân phân phối hoặc quy tắc chuyển vế).`,
          notes: [
            'Học sinh nhập nghiệm cuối cùng thay vì bước biến đổi tương đương trung gian.',
            'Yêu cầu học sinh viết bước biến đổi trung gian của phương trình.',
          ],
        };
      } else {
        return {
          status: 'verified_correct',
          stepType: 'final_root',
          originalRoot: null,
          proposedRoot: null,
          explanation: `Bộ kiểm chứng đại số độc lập xác nhận: Nghiệm cuối cùng $${trimmedStep}$ hoàn toàn chính xác! Chúc mừng em đã giải trọn vẹn bài toán.`,
          notes: ['Nghiệm cuối cùng chính xác.'],
        };
      }
    } else {
      return {
        status: 'verified_incorrect',
        stepType: 'final_root',
        originalRoot: null,
        proposedRoot: null,
        explanation: `Bộ kiểm chứng đại số độc lập phát hiện: Giá trị $x$ em đưa ra chưa thỏa mãn phương trình ban đầu. Em hãy thực hiện từng bước biến đổi đại số để tìm nghiệm chính xác nhé.`,
        notes: ['Nghiệm đề xuất không thỏa mãn phương trình gốc.'],
      };
    }
  }

  // 4. Trường hợp bước sửa là một phương trình (có dấu '=')
  if (trimmedStep.includes('=')) {
    const stepEq = solveLinearEquation(trimmedStep);

    if (!stepEq) {
      return {
        status: 'uncertain',
        originalRoot: null,
        proposedRoot: null,
        explanation: `Bộ kiểm chứng chưa thể phân tích phương trình '${trimmedStep}'. Em hãy kiểm tra lại cú pháp toán học.`,
        notes: ['Không thể phân tích cú pháp phương trình bước sửa.'],
      };
    }

    if (stepEq.isNoSolution) {
      return {
        status: 'verified_incorrect',
        stepType: 'intermediate_transformation',
        originalRoot: null,
        proposedRoot: null,
        explanation: `Phương trình bước sửa '${trimmedStep}' là phương trình vô nghiệm, không tương đương với phương trình ban đầu.`,
        notes: [
          `Phương trình gốc có nghiệm hợp lệ.`,
          `Phương trình đề xuất vô nghiệm.`,
        ],
      };
    }

    if (stepEq.isIdentical) {
      return {
        status: 'uncertain',
        stepType: 'intermediate_transformation',
        originalRoot: null,
        proposedRoot: null,
        explanation: `Phương trình bước sửa '${trimmedStep}' nghiệm đúng với mọi $x$, chưa đưa ra bước thu hẹp nghiệm cụ thể.`,
        notes: ['Phương trình đồng nhất 0x = 0.'],
      };
    }

    if (stepEq.root !== null) {
      const isEquivalent = Math.abs(stepEq.root - originalRoot) < 1e-6;
      if (!isEquivalent) {
        return {
          status: 'verified_incorrect',
          stepType: 'intermediate_transformation',
          originalRoot: null,
          proposedRoot: null,
          explanation: `Bộ kiểm chứng đại số độc lập phát hiện: Phép biến đổi '${trimmedStep}' không tương đương với phương trình ban đầu. Em hãy kiểm tra lại phép tính của bước này nhé.`,
          notes: [
            `Phương trình gốc: ${problemText}.`,
            `Phương trình bước sửa: ${trimmedStep}.`,
            'Phép biến đổi làm lệch nghiệm phương trình.',
          ],
        };
      }

      // XD-02B FIX-03A: Khi phương trình có cùng nghiệm, phân biệt chặt chẽ
      // giữa phép biến đổi tương đương thông thường và đúng bước biến đổi được yêu cầu.
      const probParts = problemText.split('=');
      const stepParts = trimmedStep.split('=');

      if (probParts.length === 2 && stepParts.length === 2) {
        const origLeft = parseLinearExpression(probParts[0]);
        const origRight = parseLinearExpression(probParts[1]);
        const stepLeft = parseLinearExpression(stepParts[0]);
        const stepRight = parseLinearExpression(stepParts[1]);

        if (origLeft && origRight && stepLeft && stepRight) {
          const isDistributiveError = Boolean(
            errorContext?.errorCategory?.toLowerCase().includes('phân phối') ||
            errorContext?.notes?.toLowerCase().includes('phân phối') ||
            errorContext?.errorCategory === 'distributive_property'
          );

          if (isDistributiveError) {
            // ==========================================
            // BƯỚC PHÂN PHỐI PHÉP NHÂN (XD-02B FIX-03A)
            // 1. Xác định biểu thức cần phân phối từ đề bài
            // 2. Khai triển bằng thuật toán đại số
            // 3. So sánh đúng vế tương ứng sau phân phối
            // 4. Không chấp nhận nhân, chia cả 2 vế, hoặc chuyển vế sớm
            // ==========================================
            const directMatch =
              Math.abs(stepLeft.a - origLeft.a) < 1e-6 &&
              Math.abs(stepLeft.b - origLeft.b) < 1e-6 &&
              Math.abs(stepRight.a - origRight.a) < 1e-6 &&
              Math.abs(stepRight.b - origRight.b) < 1e-6;

            const swappedMatch =
              Math.abs(stepLeft.a - origRight.a) < 1e-6 &&
              Math.abs(stepLeft.b - origRight.b) < 1e-6 &&
              Math.abs(stepRight.a - origLeft.a) < 1e-6 &&
              Math.abs(stepRight.b - origLeft.b) < 1e-6;

            if (directMatch || swappedMatch) {
              return {
                status: 'verified_correct',
                stepType: 'intermediate_transformation',
                originalRoot: null,
                proposedRoot: null,
                explanation: `Bộ kiểm chứng đại số độc lập xác nhận: Bước sửa '${trimmedStep}' đã thực hiện chính xác phép nhân phân phối phá ngoặc của phương trình.`,
                notes: [
                  `Phương trình gốc: ${problemText}.`,
                  `Phương trình bước sửa: ${trimmedStep}.`,
                  'Phép nhân phân phối được thực hiện đúng trên các vế.',
                ],
              };
            }

            // Phân loại các tình huống không phải bước phân phối để phản hồi sư phạm:
            // Tình huống 1: Chia cả hai vế cho hệ số đứng trước ngoặc (ví dụ x + 3 = 7 với bài 2(x+3)=14)
            const leftParenMatch = cleanExpr(probParts[0]).match(/^([+-]?\d*)(?:\*|\.)?\(/);
            let multiplier = 1;
            if (leftParenMatch) {
              if (leftParenMatch[1] === '-' || leftParenMatch[1] === '-1') multiplier = -1;
              else if (leftParenMatch[1] === '+' || leftParenMatch[1] === '') multiplier = 1;
              else multiplier = parseFloat(leftParenMatch[1]);
            }

            const isDividedByMultiplier =
              multiplier !== 0 &&
              multiplier !== 1 &&
              ((Math.abs(stepLeft.a - origLeft.a / multiplier) < 1e-6 &&
                Math.abs(stepLeft.b - origLeft.b / multiplier) < 1e-6 &&
                Math.abs(stepRight.a - origRight.a / multiplier) < 1e-6 &&
                Math.abs(stepRight.b - origRight.b / multiplier) < 1e-6) ||
               (Math.abs(stepLeft.a - origRight.a / multiplier) < 1e-6 &&
                Math.abs(stepLeft.b - origRight.b / multiplier) < 1e-6 &&
                Math.abs(stepRight.a - origLeft.a / multiplier) < 1e-6 &&
                Math.abs(stepRight.b - origLeft.b / multiplier) < 1e-6));

            if (isDividedByMultiplier) {
              const multLabel = multiplier !== 1 ? `${multiplier}` : 'hệ số';
              return {
                status: 'uncertain',
                stepType: 'intermediate_transformation',
                originalRoot: null,
                proposedRoot: null,
                explanation: `Em đã thực hiện một phép biến đổi tương đương, nhưng nhiệm vụ hiện tại là sửa bước nhân phân phối. Em hãy thử nhân ${multLabel} với từng số hạng trong ngoặc nhé.`,
                notes: [
                  `Phương trình gốc: ${problemText}.`,
                  `Phương trình bước sửa: ${trimmedStep}.`,
                  'Học sinh chia cả hai vế cho hệ số thay vì thực hiện bước nhân phân phối được yêu cầu.',
                ],
              };
            }

            // Tình huống 2: Chuyển vế thu gọn hoặc nhảy cóc sang bước khác (ví dụ 2x = 8)
            const isTranspositionJump =
              (Math.abs(stepLeft.b) < 1e-6 && Math.abs(stepRight.a) < 1e-6) ||
              (Math.abs(stepRight.b) < 1e-6 && Math.abs(stepLeft.a) < 1e-6);

            if (isTranspositionJump) {
              return {
                status: 'uncertain',
                stepType: 'intermediate_transformation',
                originalRoot: null,
                proposedRoot: null,
                explanation: `Em đã thực hiện bước chuyển vế thu gọn, nhưng nhiệm vụ hiện tại là sửa bước nhân phân phối. Em hãy viết lại phương trình sau khi nhân phá ngoặc ở vế chứa ngoặc nhé.`,
                notes: [
                  `Phương trình gốc: ${problemText}.`,
                  `Phương trình bước sửa: ${trimmedStep}.`,
                  'Học sinh đã nhảy sang bước chuyển vế thay vì sửa phép nhân phân phối.',
                ],
              };
            }

            // Tình huống 3: Nhân tỉ lệ cả hai vế hoặc biến đổi khác (ví dụ 4x + 12 = 28, 10x = 40)
            return {
              status: 'uncertain',
              stepType: 'intermediate_transformation',
              originalRoot: null,
              proposedRoot: null,
              explanation: `Phương trình '${trimmedStep}' có cùng tập nghiệm với đề bài nhưng chưa đúng bước biến đổi đại số được yêu cầu. Phương trình này có các hệ số bị nhân tỉ lệ hoặc biến đổi khác thay vì thực hiện đúng phép nhân phân phối từ đề bài ban đầu. Em hãy viết lại phương trình sau khi thực hiện đúng bước phân phối nhé.`,
              notes: [
                `Phương trình gốc: ${problemText}.`,
                `Phương trình bước sửa: ${trimmedStep}.`,
                'Phương trình có cùng tập nghiệm nhưng chưa đúng cấu trúc bước nhân phân phối được yêu cầu.',
              ],
            };
          } else {
            // ==========================================
            // CÁC QUY TẮC KHÁC (Chuyển vế, chia hệ số, v.v.)
            // Không áp dụng nhầm quy tắc phân phối cho các bước này
            // ==========================================
            const isTranspositionError = Boolean(
              errorContext?.errorCategory?.toLowerCase().includes('chuyển vế') ||
              errorContext?.notes?.toLowerCase().includes('chuyển vế') ||
              errorContext?.errorCategory === 'transposition_rule'
            );

            if (isTranspositionError) {
              const netA = Math.abs(origLeft.a - origRight.a);
              const stepNetA = Math.abs(stepLeft.a - stepRight.a);
              const isXIsolated =
                (Math.abs(stepLeft.b) < 1e-6 && Math.abs(stepRight.a) < 1e-6) ||
                (Math.abs(stepRight.b) < 1e-6 && Math.abs(stepLeft.a) < 1e-6);

              if (Math.abs(stepNetA - netA) < 1e-6 && isXIsolated) {
                return {
                  status: 'verified_correct',
                  stepType: 'intermediate_transformation',
                  originalRoot: null,
                  proposedRoot: null,
                  explanation: `Bộ kiểm chứng đại số độc lập xác nhận: Bước sửa '${trimmedStep}' đã thực hiện chính xác quy tắc chuyển vế và đổi dấu.`,
                  notes: [
                    `Phương trình gốc: ${problemText}.`,
                    `Phương trình bước sửa: ${trimmedStep}.`,
                    'Quy tắc chuyển vế và đổi dấu được thực hiện đúng.',
                  ],
                };
              }
            }

            const isCoefficientDivisionError = Boolean(
              errorContext?.errorCategory?.toLowerCase().includes('chia') ||
              errorContext?.errorCategory?.toLowerCase().includes('hệ số') ||
              errorContext?.notes?.toLowerCase().includes('chia') ||
              errorContext?.errorCategory === 'coefficient_division'
            );

            if (isCoefficientDivisionError) {
              // ==========================================
              // BƯỚC CHIA CHO HỆ SỐ (XD-02B FIX-03)
              // Trong phương trình ax = b (a != 0):
              // Bước sửa hợp lệ phải biểu diễn phép chia x = b / a (hoặc b : a, b ÷ a)
              // ==========================================
              const coeffA = Math.abs(origLeft.a - origRight.a);
              const constB = Math.abs(origRight.b - origLeft.b);
              const cleanedStep = cleanExpr(trimmedStep);

              // Kiểm tra xem biến x đã được cô lập (x = ... hoặc ... = x)
              const isXIsolated =
                (Math.abs(stepLeft.a - 1) < 1e-6 && Math.abs(stepLeft.b) < 1e-6) ||
                (Math.abs(stepRight.a - 1) < 1e-6 && Math.abs(stepRight.b) < 1e-6);

              // Kiểm tra xem vế còn lại có biểu diễn phép chia
              const hasDivisionOp = cleanedStep.includes('/');

              if (isXIsolated && hasDivisionOp) {
                // Tách tử số và mẫu số của phép chia
                const divMatch = cleanedStep.match(/([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)/);
                if (divMatch) {
                  const num = Math.abs(parseFloat(divMatch[1]));
                  const den = Math.abs(parseFloat(divMatch[2]));

                  const isCoeffMatch =
                    (Math.abs(den - coeffA) < 1e-6 && Math.abs(num - constB) < 1e-6) ||
                    (Math.abs(num - coeffA) < 1e-6 && Math.abs(den - constB) < 1e-6);

                  if (isCoeffMatch) {
                    return {
                      status: 'verified_correct',
                      stepType: 'intermediate_transformation',
                      originalRoot: null,
                      proposedRoot: null,
                      explanation: `Bộ kiểm chứng đại số độc lập xác nhận: Bước sửa '${trimmedStep}' đã thực hiện chính xác phép chia cho hệ số của phương trình. Bây giờ em hãy tính toán để tìm ra giá trị của x nhé.`,
                      notes: [
                        `Phương trình gốc: ${problemText}.`,
                        `Phương trình bước sửa: ${trimmedStep}.`,
                        'Thực hiện đúng phép chia cả hai vế cho hệ số của x.',
                      ],
                    };
                  }
                }
              }

              // Nếu chia không đúng hệ số của bài
              return {
                status: 'uncertain',
                stepType: 'intermediate_transformation',
                originalRoot: null,
                proposedRoot: null,
                explanation: `Phương trình '${trimmedStep}' có cùng tập nghiệm với đề bài nhưng chưa đúng bước chia cho hệ số của bài toán. Em hãy lấy tích chia cho hệ số của $x$ nhé.`,
                notes: [
                  `Phương trình gốc: ${problemText}.`,
                  `Phương trình bước sửa: ${trimmedStep}.`,
                  'Bước sửa không khớp với phép chia cho hệ số của phương trình gốc.',
                ],
              };
            }

            const netA = Math.abs(origLeft.a - origRight.a);
            const stepNetA = Math.abs(stepLeft.a - stepRight.a);
            if (Math.abs(stepNetA - netA) < 1e-6) {
              return {
                status: 'verified_correct',
                stepType: 'intermediate_transformation',
                originalRoot: null,
                proposedRoot: null,
                explanation: `Bộ kiểm chứng đại số độc lập xác nhận: Bước sửa '${trimmedStep}' là phép biến đổi tương đương chính xác của phương trình ban đầu.`,
                notes: [
                  `Phương trình gốc: ${problemText}.`,
                  `Phương trình bước sửa: ${trimmedStep}.`,
                  'Phương trình tương đương và bảo toàn hệ số biến.',
                ],
              };
            }

            return {
              status: 'uncertain',
              stepType: 'intermediate_transformation',
              originalRoot: null,
              proposedRoot: null,
              explanation: `Phương trình '${trimmedStep}' có cùng tập nghiệm với đề bài nhưng các hệ số chưa tương ứng với bước biến đổi tiếp theo của bài toán.`,
              notes: [
                `Phương trình gốc: ${problemText}.`,
                `Phương trình bước sửa: ${trimmedStep}.`,
                'Hệ số của phương trình bước sửa không khớp với bước biến đổi dự kiến.',
              ],
            };
          }
        }
      }
    }
  }

  // 5. Trường hợp bước sửa là một biểu thức biến đổi vế (không có dấu '=')
  // Ví dụ: học sinh gõ '2x + 6' hoặc '2*x + 6' để sửa cho vế trái 2(x + 3)
  const leftSide = problemText.split('=')[0];
  const originalLeftExpr = parseLinearExpression(leftSide);
  const stepExpr = parseLinearExpression(trimmedStep);

  if (originalLeftExpr && stepExpr) {
    const isExprEquivalent =
      Math.abs(originalLeftExpr.a - stepExpr.a) < 1e-6 &&
      Math.abs(originalLeftExpr.b - stepExpr.b) < 1e-6;

    if (isExprEquivalent) {
      return {
        status: 'verified_correct',
        stepType: 'expression',
        originalRoot: null,
        proposedRoot: null,
        explanation: `Bộ kiểm chứng đại số độc lập xác nhận: Biểu thức '${trimmedStep}' tương đương chính xác với vế ban đầu.`,
        notes: [
          `Vế ban đầu có dạng: ${originalLeftExpr.a}x + ${originalLeftExpr.b}.`,
          `Biểu thức đề xuất: ${stepExpr.a}x + ${stepExpr.b}.`,
          'Hai biểu thức tương đương.',
        ],
      };
    } else {
      return {
        status: 'verified_incorrect',
        stepType: 'expression',
        originalRoot: null,
        proposedRoot: null,
        explanation: `Bộ kiểm chứng đại số độc lập phát hiện: Biểu thức '${trimmedStep}' chưa tương đương với vế ban đầu. Em hãy kiểm tra lại phép nhân hệ số và quy tắc dấu nhé.`,
        notes: [
          `Biểu thức ban đầu: ${originalLeftExpr.a}x + ${originalLeftExpr.b}.`,
          `Biểu thức đề xuất: ${stepExpr.a}x + ${stepExpr.b}.`,
        ],
      };
    }
  }

  return {
    status: 'unsupported',
    originalRoot: null,
    proposedRoot: null,
    explanation: `Bước sửa '${trimmedStep}' nằm ngoài định dạng đại số mà bộ kiểm chứng tự động hỗ trợ.`,
    notes: ['Không thể phân tích cú pháp biểu thức hoặc phương trình.'],
  };
}
