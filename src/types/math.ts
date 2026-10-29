/**
 * AI MATH TUTOR - Data Architecture (XD-01)
 * Khẩu hiệu: Học từ lỗi sai — Tiến bộ qua từng bước
 */

export type MathTopic = 'expression' | 'equation';

export type ErrorCategory =
  | 'distributive_property'     // Lỗi phân phối phép nhân
  | 'bracket_sign'              // Lỗi dấu khi bỏ ngoặc
  | 'transposition_rule'        // Lỗi chuyển vế
  | 'coefficient_division'      // Lỗi chia hệ số
  | 'combine_like_terms';       // Lỗi thu gọn đơn thức đồng dạng

export interface SolutionStep {
  stepNumber: number;
  latex: string;
  textExplanation: string;
  isErrorStep?: boolean;
  consequentialExplanation?: string; // Diễn đạt rõ hệ quả kéo theo từ lỗi gốc trước đó
}

export type HintLevel = 1 | 2 | 3;

export interface ProblemHint {
  level: HintLevel;
  title: string;
  content: string; // Hỗ trợ text + LaTeX delimiters
  promptQuestion?: string;
}

export interface PracticeProblem {
  id: string;
  topic: MathTopic;
  topicLabel: string;
  title: string;
  gradeLevel: 'Lớp 7' | 'Lớp 8';
  originalProblemLatex: string;
  contextDescription: string;
  sampleSteps: SolutionStep[];
  errorStepIndex: number; // 0-indexed step that contains the error
  errorCategory: ErrorCategory;
  errorCategoryName: string;
  errorExplanation: string; // Giải thích ngắn gọn lỗi
  hints: {
    level1: ProblemHint; // Câu hỏi gợi mở
    level2: ProblemHint; // Nhắc lại quy tắc
    level3: ProblemHint; // Hướng dẫn cụ thể (không lộ toàn bộ đáp án)
  };
  correctNextStepLatex: string;
  finalAnswerLatex: string;
  validCorrectionPatterns: string[]; // Các biểu thức hợp lệ sau chuẩn hóa
  sampleCorrectExplanation: string;
}

export type EvaluationStatus = 'correct' | 'incorrect' | 'unsupported_format' | 'needs_clarification';

export interface FeedbackResult {
  status: EvaluationStatus;
  message: string;
  detectedErrorExplanation?: string;
  revealedHintLevel: HintLevel | 0;
  matchingScore?: number;
  stepType?: 'intermediate_transformation' | 'final_root' | 'expression';
}

export interface PracticeAttempt {
  problemId: string;
  timestamp: number;
  userInput: string;
  status: EvaluationStatus;
  hintsUsedCount: number;
}

export interface LearningProgress {
  problemsAttempted: string[]; // problem IDs
  problemsSolved: string[];    // problem IDs where user corrected successfully
  correctAttemptsCount: number;
  totalAttemptsCount: number;
  hintsUsedTotal: number;
  encounteredErrors: Record<ErrorCategory, number>;
  rulesToReview: {
    category: ErrorCategory;
    ruleName: string;
    description: string;
    reviewCount: number;
  }[];
}

// ========================
// XD-02A: AI SOLUTION ANALYSIS
// ========================

export type StepAnalysisStatus = 'valid' | 'original_error' | 'consequential' | 'uncertain';
export type VerificationStatus = 'verified' | 'partially_verified' | 'unverified';

export interface AnalysisRequest {
  problemText: string;
  solutionSteps: string[];
  grade?: number;
  topic?: string;
}

export interface AnalysisStepResult {
  index: number;
  status: StepAnalysisStatus;
  explanation: string;
}

export interface AnalysisResponse {
  status: 'completed' | 'uncertain';
  firstErrorStepIndex: number | null;
  steps: AnalysisStepResult[];
  errorCategory: string | null;
  hints: string[];
  verificationStatus: VerificationStatus;
  verificationNotes: string[];
  studentMessage: string;
}

// ========================
// XD-02B & FIX-01: MULTI-TURN AI TUTOR DIALOGUE & STEP VERIFICATION
// ========================

export type StepVerificationStatus = 'verified_correct' | 'verified_incorrect' | 'uncertain' | 'unsupported';
export type ResponseSource = 'gemini' | 'fallback';

export interface StepVerificationDetail {
  status: StepVerificationStatus;
  originalRoot?: number | null;
  proposedRoot?: number | null;
  explanation: string;
  notes: string[];
  stepType?: 'intermediate_transformation' | 'final_root' | 'expression';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestedFollowUps?: string[];
  isGuidingQuestion?: boolean;
  responseSource?: ResponseSource;
  verification?: StepVerificationDetail;
  isCorrectionAttempt?: boolean;
  correctionStep?: string;
}

export interface TutorChatContext {
  problemText: string;
  solutionSteps?: string[];
  errorStepIndex?: number | null;
  errorCategory?: string | null;
  notes?: string;
}

export interface TutorChatRequest {
  problemText: string;
  solutionSteps?: string[];
  errorContext?: {
    errorStepIndex?: number | null;
    errorCategory?: string | null;
    notes?: string;
  };
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userMessage: string;
  messageType?: 'chat' | 'correction';
  correctionStep?: string;
}

export interface TutorChatResponse {
  reply: string;
  suggestedFollowUps: string[];
  recommendedRule?: string;
  responseSource: ResponseSource;
  verification?: StepVerificationDetail;
}


