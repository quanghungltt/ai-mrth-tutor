import { PracticeProblem, FeedbackResult, EvaluationStatus, HintLevel } from '../types/math';
import { verifyCorrectionStep } from './mathChecker';

/**
 * Chuẩn hóa chuỗi biểu thức toán học của người dùng:
 * - Chuyển chữ hoa thành thường
 * - Chuẩn hóa các dấu nhân (*, ×, ·, .)
 * - Chuẩn hóa dấu trừ unicode (–, —)
 * - Loại bỏ toàn bộ khoảng trắng thừa
 */
export function normalizeExpression(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/\s+/g, '') // Bỏ khoảng trắng
    .trim();
}

/**
 * Đánh giá bước sửa của học sinh trong phân hệ Luyện tập.
 * Sử dụng bộ kiểm chứng toán học độc lập (XD-02B) để đánh giá trung thực,
 * không tiết lộ nghiệm sớm và đảm bảo trải nghiệm học từng bước.
 */
export function evaluateCorrectionStep(
  userInput: string,
  problem: PracticeProblem,
  currentRevealedHintLevel: HintLevel | 0
): FeedbackResult {
  const rawInput = userInput.trim();

  if (!rawInput) {
    return {
      status: 'unsupported_format',
      message: 'Vui lòng nhập bước sửa của bạn trước khi bấm gửi.',
      revealedHintLevel: currentRevealedHintLevel,
    };
  }

  const normalizedUser = normalizeExpression(rawInput);
  const normalizedError = normalizeExpression(problem.sampleSteps[problem.errorStepIndex].latex);

  // 1. Kiểm tra xem học sinh có nhập lại chính bước sai hay không
  if (normalizedUser === normalizedError) {
    return {
      status: 'incorrect',
      message: 'Em đang nhập lại chính bước giải có lỗi sai ban đầu! Hãy quan sát kỹ gợi ý để sửa lại nhé.',
      detectedErrorExplanation: problem.errorExplanation,
      revealedHintLevel: currentRevealedHintLevel,
    };
  }

  // 2. Sử dụng bộ kiểm chứng toán học độc lập (XD-02B)
  const verification = verifyCorrectionStep(
    problem.originalProblemLatex,
    rawInput,
    {
      errorStepIndex: problem.errorStepIndex,
      errorCategory: problem.errorCategoryName,
      notes: problem.errorExplanation,
    }
  );

  if (verification.status === 'verified_correct') {
    let praiseMsg = 'Em đã sửa đúng bước biến đổi này.';
    if (problem.errorCategory === 'distributive_property') {
      praiseMsg = 'Em đã sửa đúng bước nhân phân phối.';
    } else if (problem.errorCategory === 'bracket_sign') {
      praiseMsg = 'Em đã sửa đúng bước bỏ dấu ngoặc.';
    } else if (problem.errorCategory === 'transposition_rule') {
      praiseMsg = 'Em đã sửa đúng bước chuyển vế đổi dấu.';
    } else if (problem.errorCategory === 'coefficient_division') {
      praiseMsg = 'Em đã sửa đúng bước chia cho hệ số.';
    } else if (problem.errorCategory === 'combine_like_terms') {
      praiseMsg = 'Em đã sửa đúng bước thu gọn đơn thức đồng dạng.';
    }

    return {
      status: 'correct',
      message: praiseMsg,
      detectedErrorExplanation: problem.sampleCorrectExplanation,
      revealedHintLevel: currentRevealedHintLevel,
      stepType: verification.stepType,
    };
  }

  if (verification.status === 'verified_incorrect') {
    return {
      status: 'incorrect',
      message: verification.explanation || 'Bước sửa chưa chính xác. Em hãy kiểm tra lại phép tính nhé.',
      detectedErrorExplanation: problem.errorExplanation,
      revealedHintLevel: currentRevealedHintLevel,
      stepType: verification.stepType,
    };
  }

  if (verification.status === 'uncertain') {
    // FIX-06: Phân biệt nghiệm đúng nhưng thiếu bước trình bày với các trường hợp cần làm rõ khác.
    // Nếu verification.stepType === 'final_root', bộ kiểm chứng đã xác minh nghiệm đúng về mặt đại số (isRootMatch: true),
    // nhưng học sinh nhập nghiệm cuối trong ngữ cảnh bước biến đổi trung gian (isIntermediateContext: true).
    if (verification.stepType === 'final_root') {
      return {
        status: 'needs_clarification',
        message: 'Em đã tìm được nghiệm đúng của phương trình. Tuy nhiên, ở bước này, em cần trình bày phép biến đổi đại số để đi đến nghiệm đó nhé.',
        detectedErrorExplanation: problem.errorExplanation,
        revealedHintLevel: currentRevealedHintLevel,
        stepType: 'final_root',
      };
    }

    // Các trường hợp uncertain khác (biểu thức nhập nhằng, phương trình đồng nhất, hoặc chưa đủ ngữ cảnh):
    // Sử dụng phản hồi trung tính, loại bỏ các ví dụ cố định không phù hợp ngữ cảnh bài toán (QA-08 / Section VII).
    let neutralMsg = verification.explanation || '';
    if (neutralMsg.includes('áp dụng đúng phép nhân phân phối hoặc quy tắc chuyển vế')) {
      neutralMsg = neutralMsg.replace(
        ' (ví dụ: áp dụng đúng phép nhân phân phối hoặc quy tắc chuyển vế)',
        ''
      );
    }

    return {
      status: 'needs_clarification',
      message: neutralMsg || 'Em hãy trình bày phép biến đổi đại số phù hợp để đi đến nghiệm nhé.',
      detectedErrorExplanation: problem.errorExplanation,
      revealedHintLevel: currentRevealedHintLevel,
      stepType: verification.stepType,
    };
  }

  // 3. Đối chiếu bổ sung với validCorrectionPatterns (nếu bộ kiểm chứng chưa hỗ trợ)
  const normalizedValidPatterns = problem.validCorrectionPatterns.map(normalizeExpression);
  const isMatch = normalizedValidPatterns.includes(normalizedUser);

  if (isMatch) {
    let praiseMsg = 'Làm tốt lắm! Em đã sửa đúng bước biến đổi này.';
    if (problem.errorCategory === 'distributive_property') {
      praiseMsg = 'Làm tốt lắm! Em đã sửa đúng bước nhân phân phối.';
    }
    return {
      status: 'correct',
      message: praiseMsg,
      detectedErrorExplanation: problem.sampleCorrectExplanation,
      revealedHintLevel: currentRevealedHintLevel,
      stepType: verification.stepType,
    };
  }

  if (verification.status === 'unsupported') {
    return {
      status: 'unsupported_format',
      message: verification.explanation || 'Bước sửa chưa phù hợp với định dạng đại số được hỗ trợ. Em hãy kiểm tra lại cú pháp toán học nhé.',
      detectedErrorExplanation: problem.errorExplanation,
      revealedHintLevel: currentRevealedHintLevel,
      stepType: verification.stepType,
    };
  }

  return {
    status: 'incorrect',
    message: 'Bước sửa chưa phù hợp với bước đang yêu cầu. Em hãy xem các gợi ý sư phạm để thực hiện đúng nhé.',
    detectedErrorExplanation: problem.errorExplanation,
    revealedHintLevel: currentRevealedHintLevel,
  };
}
