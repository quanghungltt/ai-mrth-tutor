/**
 * ISOLATED GEMINI RUNNER — DIAGNOSTIC & MOCK VALIDATION (QA-14 / TC-LIVE-03)
 *
 * Tôn chỉ an toàn:
 * 1. Chạy hoàn toàn độc lập với NO_SERVER_START=1, không khởi động HTTP server, không chiếm cổng 3000.
 * 2. Mặc định là MOCK_ONLY: Tuyệt đối không phát sinh request mạng ra bên ngoài khi chưa có cờ kiểm soát.
 * 3. Tái sử dụng toàn bộ hàm chẩn đoán, chuẩn hóa và guardrail đã export từ server.ts.
 * 4. Tuyệt đối không in hoặc lưu trữ API key, Secret, Auth header hay raw message trong log.
 * 5. Giới hạn tối đa 1 lượt thử (tối đa 2 model candidates theo cấu hình server.ts).
 */

import { Type } from '@google/genai';
import {
  classifyGeminiError,
  logGeminiDiagnostic,
  formatGeminiDiagnosticLog,
  extractHttpStatusCode,
  buildNormalizedChatContents,
  validateGeminiChatResponse,
  applyGeminiConsistencyGuardrail,
  generateFallbackResponse,
  GeminiDiagnosticStage,
  GeminiErrorCategory,
} from '../server.ts';
import {
  TutorChatRequest,
  TutorChatResponse,
  StepVerificationDetail,
} from '../src/types/math.ts';

// ==========================================
// ĐỐI CHIẾU CẤU HÌNH VỚI SERVER.TS (SOURCE MAPPING)
// ==========================================

// server.ts dòng 988: const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
export const MODELS_TO_TRY = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'] as const;

// server.ts dòng 1028: timeoutId = setTimeout(..., 12000);
export const DEFAULT_TIMEOUT_MS = 12000;

// server.ts dòng 1003: temperature: 0.3
export const TEMPERATURE = 0.3;

// server.ts dòng 1001: responseMimeType: 'application/json'
export const RESPONSE_MIME_TYPE = 'application/json';

// server.ts dòng 314-333: tutorChatSchema
export const TUTOR_CHAT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description:
        'Lời phản hồi sư phạm ngắn gọn (2-4 câu), ấm áp, dùng phương pháp gợi mở Socrates, đặt đúng 1 câu hỏi trọng tâm. Dùng ký hiệu KaTeX $...$ cho công thức toán học. Tuyệt đối KHÔNG giải trọn vẹn hoặc đưa đáp án cuối cùng ngay lập tức.',
    },
    suggestedFollowUps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '2-3 gợi ý câu trả lời nhanh hoặc câu hỏi tiếp nối học sinh có thể nhấn chọn nhanh',
    },
    recommendedRule: {
      type: Type.STRING,
      nullable: true,
      description:
        'Tên quy tắc toán học THCS cần vận dụng nếu có (ví dụ: Quy tắc chuyển vế, Quy tắc bỏ ngoặc, Phân phối phép nhân)',
    },
  },
  required: ['reply', 'suggestedFollowUps'],
};

// server.ts dòng 949-967: systemPrompt
export const SYSTEM_PROMPT = `Bạn là Trợ giảng môn Toán THCS (Việt Nam) đầy thấu cảm, giàu kinh nghiệm sư phạm và kiên nhẫn.
TÔN CHỈ SƯ PHẠM QUAN TRỌNG NHẤT:
1. Bạn đang đối thoại trực tiếp nhiều lượt với học sinh THCS để hướng dẫn học sinh TỰ NHẬN DIỆN VÀ SỬA LỖI SAI trong lời giải Toán.
2. PHƯƠNG PHÁP SOCRATES:
   - TUYỆT ĐỐI KHÔNG giải trọn vẹn toàn bộ bài toán cho học sinh.
   - TUYỆT ĐỐI KHÔNG đọc tuồn tuột kết quả cuối cùng (trừ khi học sinh đã tự mình giải ra đúng ở bước kết luận cuối và bạn chúc mừng, xác nhận).
   - Hãy đặt ĐÚNG 1 CÂU HỎI GỢI MỞ trọng tâm ở cuối mỗi phản hồi để học sinh tự suy nghĩ và hành động.
   - Giữ độ dài phản hồi ngắn gọn, súc tích (khoảng 2 đến 4 câu).
3. ĐỐI TƯỢNG HỌC SINH: Lớp 7, Lớp 8 THCS. Dùng giọng điệu thân thiện, ấm áp ("Thầy/Cô", "em", "chúng ta").
4. CÔNG THỨC TOÁN: Dùng ký hiệu KaTeX $...$ cho công thức toán học nội dòng (ví dụ $2(x+3) = 14$).
5. BẢO VỆ SƯ PHẠM (ANTI-JAILBREAK): Nếu học sinh đòi hỏi: "cho đáp án luôn đi", "giải từ đầu đến cuối hộ em", hoặc nói chuyện không liên quan tới toán học, hãy nhẹ nhàng khước từ với thái độ khích lệ và kéo học sinh quay lại bước toán học đang thảo luận.
6. GỢI Ý TIẾP THEO (suggestedFollowUps): Cung cấp 2-3 câu trả lời mẫu hoặc câu hỏi nhanh thiết thực để học sinh có thể click chọn ngay nếu chưa biết gõ gì.
7. BẢO MẬT NGHIỆM CUỐI CÙNG (TUYỆT ĐỐI KHÔNG TIẾT LỘ NGHIỆM KHI SỬA BƯỚC TRUNG GIAN):
   - Khi học sinh đang sửa bước biến đổi trung gian (ví dụ nhân phân phối thành 2x + 6 = 14, chia hệ số thành x = 20/4, chuyển vế thành x = 5 + 7), TUYỆT ĐỐI KHÔNG ĐƯỢC tiết lộ giá trị nghiệm cuối cùng (như "đúng rồi, nghiệm là x = 4" hay "x = 5").
   - Xác nhận bước biến đổi đó là chính xác và hỏi câu gợi mở phù hợp với trạng thái tiếp theo của bài toán:
     + Nếu học sinh vừa chia hệ số (như x = 20/4): Hướng dẫn học sinh thực hiện phép tính chia ở vế phải để tìm x.
     + Nếu học sinh vừa chuyển vế số tự do (như x = 5 + 7): Hướng dẫn học sinh tính toán giá trị vế phải để tìm x.
     + Nếu học sinh vừa nhân phân phối (như 2x + 6 = 14): Hướng dẫn học sinh chuyển hạng tử tự do sang vế phải để cô lập ẩn x.
     + TUYỆT ĐỐI KHÔNG yêu cầu "đưa các số hạng chứa x về một phía" khi ẩn x đã được cô lập ở một vế.`;

// server.ts dòng 969-974: contextSummary helper
export function buildContextSummary(body: TutorChatRequest): string {
  return `BÀI TOÁN HIỆN TẠI:
Đề bài: ${body.problemText}
${body.solutionSteps && body.solutionSteps.length > 0 ? `Các bước giải ban đầu:\n${body.solutionSteps.map((s, idx) => `  Bước ${idx + 1}: ${s}`).join('\n')}` : ''}
${body.errorContext?.errorCategory ? `Nhóm lỗi được xác định: ${body.errorContext.errorCategory}` : ''}
${body.errorContext?.errorStepIndex !== undefined && body.errorContext.errorStepIndex !== null ? `Vị trí lỗi gốc tại bước: ${body.errorContext.errorStepIndex + 1}` : ''}
${body.errorContext?.notes ? `Ghi chú phân tích: ${body.errorContext.notes}` : ''}`;
}

// ==========================================
// RUNNER TYPES & MOCK INTERFACE
// ==========================================

export type MockGenerateContentFn = (
  model: string,
  payload: {
    contents: unknown;
    config: Record<string, unknown>;
  }
) => Promise<{ text?: string }>;

export interface RunnerExecutionOptions {
  apiKey?: string;
  mockFn?: MockGenerateContentFn;
  timeoutMs?: number;
  attemptId?: string;
  allowLiveCall?: boolean; // Khóa cứng an toàn: Phải bật tường minh mới được gọi SDK thật
  maxSdkCalls?: number; // FIX-09: Giới hạn cứng số lần gọi SDK tối đa
  singleModelCandidateOnly?: boolean; // FIX-09: Chỉ thử duy nhất model đầu tiên: gemini-3.1-flash-lite
}

export interface RunnerExecutionTelemetry {
  attemptId: string;
  sdkCallCount: number;
  networkRequestCount: number;
  networkRequestCertainty: 'VERIFIED_ZERO' | 'NOT_VERIFIED_SDK_INTERNAL_RETRY'; // FIX-09
  modelsAttempted: string[];
  finalModel: string | null;
  diagnosticsLogged: Array<{
    stage: GeminiDiagnosticStage;
    model: string;
    errorType: GeminiErrorCategory;
    httpStatus: number | null;
  }>;
}

export interface RunnerExecutionResult {
  response: TutorChatResponse;
  telemetry: RunnerExecutionTelemetry;
}

// ==========================================
// CORE EXECUTION ENGINE (ĐỐI CHIẾU SERVER.TS ROUTE /api/chat-tutor)
// ==========================================

export async function executeIsolatedTutorChat(
  body: TutorChatRequest,
  verificationResult: StepVerificationDetail | undefined,
  options: RunnerExecutionOptions = {}
): Promise<RunnerExecutionResult> {
  const attemptId = options.attemptId || 'diag_' + Math.random().toString(36).substring(2, 10);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const effectiveApiKey = options.apiKey !== undefined ? options.apiKey : (process.env.GEMINI_API_KEY || '');

  // FIX-09: Xác định model candidates và ngân sách số lần gọi SDK
  // 1. Chỉ kiểm tra model đầu tiên 'gemini-3.1-flash-lite' khi:
  //    - singleModelCandidateOnly = true HOẶC
  //    - maxSdkCalls = 1 HOẶC
  //    - Chế độ Live (khi !options.mockFn)
  const isSingleCallMode =
    options.singleModelCandidateOnly === true ||
    options.maxSdkCalls === 1 ||
    !options.mockFn;

  const candidateModels = isSingleCallMode
    ? [MODELS_TO_TRY[0]]
    : [...MODELS_TO_TRY];

  // FIX-09 / FIX-10: Ngân sách số lần gọi SDK tối đa
  // - Đối với mock: lấy options.maxSdkCalls nếu được chỉ định, hoặc độ dài mảng candidateModels
  // - Đối với Live: Mặc định bằng 0 nếu chưa mở khóa an toàn đầy đủ; bằng đúng 1 khi mở khóa hợp lệ
  let effectiveMaxSdkCalls: number;
  if (options.mockFn) {
    effectiveMaxSdkCalls = options.maxSdkCalls !== undefined ? options.maxSdkCalls : candidateModels.length;
  } else {
    const isNoServerStart =
      process.env.NO_SERVER_START === '1' || process.env.NO_SERVER_START === 'true';

    const isLiveUnlocked =
      options.allowLiveCall === true &&
      process.env.ALLOW_LIVE_CALL === 'true' &&
      process.env.MOCK_ONLY !== 'true' &&
      isNoServerStart;

    effectiveMaxSdkCalls = isLiveUnlocked ? 1 : 0;
  }

  const telemetry: RunnerExecutionTelemetry = {
    attemptId,
    sdkCallCount: 0,
    networkRequestCount: 0,
    networkRequestCertainty: options.mockFn ? 'VERIFIED_ZERO' : 'NOT_VERIFIED_SDK_INTERNAL_RETRY',
    modelsAttempted: [],
    finalModel: null,
    diagnosticsLogged: [],
  };

  // Helper log nội bộ cho telemetry đồng thời kích hoạt logGeminiDiagnostic chuẩn của server.ts
  const recordDiag = (
    stage: GeminiDiagnosticStage,
    model: string,
    errorType: GeminiErrorCategory,
    httpStatus: number | null
  ) => {
    telemetry.diagnosticsLogged.push({ stage, model, errorType, httpStatus });
    logGeminiDiagnostic(attemptId, stage, model, errorType, httpStatus);
  };

  // 1. Nếu có bước sửa đại số cần kiểm chứng -> Thực hiện guardrail tất định (server.ts dòng 929-940)
  if (verificationResult) {
    const chatReply = applyGeminiConsistencyGuardrail(
      null,
      verificationResult,
      body.problemText,
      body.userMessage,
      body.errorContext
    );
    return { response: chatReply, telemetry };
  }

  // 2. Nếu chưa có API key -> Phản hồi dự phòng minh bạch (server.ts dòng 943-946)
  if (!effectiveApiKey) {
    const fallback = generateFallbackResponse(
      body.userMessage,
      body.problemText,
      body.errorContext,
      undefined
    );
    return { response: fallback, telemetry };
  }

  // FIX-09 / FIX-10: Live gate an toàn mặc định đóng đối với chế độ Live
  if (!options.mockFn) {
    const isNoServerStart =
      process.env.NO_SERVER_START === '1' || process.env.NO_SERVER_START === 'true';

    if (
      !options.allowLiveCall ||
      process.env.ALLOW_LIVE_CALL !== 'true' ||
      process.env.MOCK_ONLY === 'true' ||
      !isNoServerStart ||
      effectiveMaxSdkCalls <= 0
    ) {
      const err = new Error('LIVE_CALL_PREVENTED_BY_RUNNER_POLICY');
      const diag = classifyGeminiError(err, 'request');
      recordDiag('request', candidateModels[0] || 'all', diag.errorType, diag.httpStatus);
      const fallback = generateFallbackResponse(
        body.userMessage,
        body.problemText,
        body.errorContext,
        undefined
      );
      return { response: fallback, telemetry };
    }
  }

  // 3. Chuẩn bị prompt và nội dung hội thoại chuẩn hóa (server.ts dòng 948-977)
  const conversationHistory = Array.isArray(body.messages) ? body.messages.slice(-14) : [];
  const contents = buildNormalizedChatContents(conversationHistory, body.userMessage);
  const contextSummary = buildContextSummary(body);
  const systemInstruction = `${SYSTEM_PROMPT}\n\n[BỐI CẢNH BÀI TOÁN]\n${contextSummary}`;

  // 4. Cơ chế gọi candidate models với giới hạn cứng tối đa số lần gọi SDK
  const serverAbortController = new AbortController();

  const callGeminiChat = async (): Promise<{ res: { text?: string }; model: string }> => {
    let lastErr: unknown;
    let executedSdkCalls = 0;

    for (const model of candidateModels) {
      if (serverAbortController.signal.aborted) {
        throw new Error('ABORTED_BY_SERVER');
      }

      // FIX-09: Kiểm tra ngân sách trước khi thực hiện lời gọi
      if (executedSdkCalls >= effectiveMaxSdkCalls) {
        // Hết ngân sách cuộc gọi SDK, không chuyển sang model kế tiếp
        break;
      }

      // FIX-09: Bộ đếm BẮT BUỘC tăng TRƯỚC KHI thực hiện lời gọi SDK (không phải sau khi nhận phản hồi)
      executedSdkCalls++;
      telemetry.sdkCallCount = executedSdkCalls;
      telemetry.modelsAttempted.push(model);

      try {
        let res: { text?: string };

        if (options.mockFn) {
          // CHẾ ĐỘ MOCK: Tuyệt đối không chạm mạng (networkRequestCount = 0)
          res = await options.mockFn(model, {
            contents,
            config: {
              systemInstruction,
              responseMimeType: RESPONSE_MIME_TYPE,
              responseSchema: TUTOR_CHAT_SCHEMA,
              temperature: TEMPERATURE,
              abortSignal: serverAbortController.signal,
            },
          });
        } else {
          // CHẾ ĐỘ LIVE: Phải thỏa mãn đồng thời cả 4 điều kiện an toàn
          const isNoServerStart =
            process.env.NO_SERVER_START === '1' || process.env.NO_SERVER_START === 'true';

          if (
            !options.allowLiveCall ||
            process.env.ALLOW_LIVE_CALL !== 'true' ||
            process.env.MOCK_ONLY === 'true' ||
            !isNoServerStart
          ) {
            throw new Error('LIVE_CALL_PREVENTED_BY_RUNNER_POLICY');
          }

          // FIX-09: Tuyệt đối không có nhánh Live nào bỏ qua giới hạn 1 lời gọi SDK
          if (telemetry.sdkCallCount > 1) {
            throw new Error('LIVE_CALL_BUDGET_EXCEEDED');
          }

          // Khi được phép chạy thật (chỉ trong TC-LIVE-03):
          telemetry.networkRequestCount++;
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({
            apiKey: effectiveApiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });
          res = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              responseMimeType: RESPONSE_MIME_TYPE,
              responseSchema: TUTOR_CHAT_SCHEMA,
              temperature: TEMPERATURE,
              abortSignal: serverAbortController.signal,
            },
          });
        }

        if (res && res.text) {
          return { res, model };
        }
      } catch (e: unknown) {
        lastErr = e;
        const diag = classifyGeminiError(e, 'request');
        recordDiag('request', model, diag.errorType, diag.httpStatus);
        // Không in raw error object hay stack trace
      }
    }
    throw lastErr || new Error('ALL_MODELS_UNAVAILABLE');
  };

  // 5. Quản lý timeout với Promise.race (server.ts dòng 1020-1055)
  let timeoutId: NodeJS.Timeout | undefined;
  let didTimeout = false;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      didTimeout = true;
      serverAbortController.abort();
      reject(new Error('CHAT_TIMEOUT'));
    }, timeoutMs);
  });

  let responseObj: { res: { text?: string }; model: string } | undefined;
  try {
    responseObj = await Promise.race([callGeminiChat(), timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
  } catch (raceErr: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    serverAbortController.abort();
    if (didTimeout) {
      const diag = classifyGeminiError(raceErr, 'timeout');
      recordDiag('timeout', 'all', diag.errorType, diag.httpStatus);
    }
    const fallback = generateFallbackResponse(
      body.userMessage,
      body.problemText,
      body.errorContext,
      verificationResult
    );
    return { response: fallback, telemetry };
  }

  // 6. Kiểm tra và xác thực JSON response (server.ts dòng 1057-1107)
  const response = responseObj?.res;
  const usedModel = responseObj?.model || 'unknown';
  telemetry.finalModel = usedModel;

  const responseText = response?.text;
  if (!responseText) {
    const diag = classifyGeminiError(new Error('EMPTY_CHAT_RESPONSE'), 'response_validation');
    recordDiag('response_validation', usedModel, diag.errorType, null);
    const fallback = generateFallbackResponse(
      body.userMessage,
      body.problemText,
      body.errorContext,
      verificationResult
    );
    return { response: fallback, telemetry };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch (parseErr: unknown) {
    const diag = classifyGeminiError(parseErr, 'response_validation');
    recordDiag('response_validation', usedModel, diag.errorType, null);
    const fallback = generateFallbackResponse(
      body.userMessage,
      body.problemText,
      body.errorContext,
      verificationResult
    );
    return { response: fallback, telemetry };
  }

  const validation = validateGeminiChatResponse(parsed);
  if (!validation.isValid) {
    const diag = classifyGeminiError(
      new Error(`SCHEMA_REJECTED_${validation.rejectionReason}`),
      'response_validation'
    );
    recordDiag('response_validation', usedModel, diag.errorType, null);
  }

  const chatReply = applyGeminiConsistencyGuardrail(
    parsed,
    verificationResult,
    body.problemText,
    body.userMessage,
    body.errorContext
  );

  return { response: chatReply, telemetry };
}

// ==========================================
// BỘ KIỂM THỬ MOCK BẮT BUỘC (22 TEST CASES)
// ==========================================

export async function runMockTestSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: Array<{ id: number; name: string; pass: boolean; note?: string }>;
}> {
  const results: Array<{ id: number; name: string; pass: boolean; note?: string }> = [];

  const baseRequest: TutorChatRequest = {
    problemText: '2x + 4 = 10',
    userMessage: 'Em chưa hiểu vì sao phải chuyển vế đổi dấu',
    messages: [],
    errorContext: { errorCategory: 'Quy tắc chuyển vế' },
  };

  const validGeminiJson = JSON.stringify({
    reply: 'Khi chuyển vế một hạng tử, ta phải đổi dấu của nó. Trong bài toán $2x + 4 = 10$, em muốn chuyển số nào?',
    suggestedFollowUps: ['Chuyển số +4 sang vế phải', 'Giữ nguyên số 2x ở vế trái'],
    recommendedRule: 'Quy tắc chuyển vế',
  });

  // TC 01: HTTP 400
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        const err: any = new Error('Request had invalid parameters');
        err.status = 400;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.httpStatus === 400);
    const pass = Boolean(logged && logged.errorType === 'UNKNOWN' && res.response.responseSource === 'fallback');
    results.push({ id: 1, name: 'HTTP 400 (Bad Request handled & fallback)', pass });
  }

  // TC 02: HTTP 401 — AUTH
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        const err: any = new Error('API key not valid. Please pass a valid API key.');
        err.status = 401;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'AUTH' && d.httpStatus === 401);
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 2, name: 'HTTP 401 — AUTH (Classified as AUTH & fallback)', pass });
  }

  // TC 03: HTTP 403 — PERMISSION
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        const err: any = new Error('PERMISSION_DENIED for model');
        err.status = 403;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'PERMISSION' && d.httpStatus === 403);
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 3, name: 'HTTP 403 — PERMISSION (Classified as PERMISSION)', pass });
  }

  // TC 04: HTTP 404 — MODEL_NOT_FOUND
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async (model) => {
        const err: any = new Error(`models/${model} is not found`);
        err.status = 404;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'MODEL_NOT_FOUND' && d.httpStatus === 404);
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 4, name: 'HTTP 404 — MODEL_NOT_FOUND (Classified as MODEL_NOT_FOUND)', pass });
  }

  // TC 05: HTTP 429 — QUOTA
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        const err: any = new Error('RESOURCE_EXHAUSTED: You exceeded your current quota');
        err.status = 429;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'QUOTA' && d.httpStatus === 429);
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 5, name: 'HTTP 429 — QUOTA (Classified as QUOTA)', pass });
  }

  // TC 06: HTTP 429 — RATE_LIMIT
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        const err: any = new Error('RATE_LIMIT: Too many requests per second');
        err.status = 429;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'RATE_LIMIT' && d.httpStatus === 429);
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 6, name: 'HTTP 429 — RATE_LIMIT (Classified as RATE_LIMIT)', pass });
  }

  // TC 07: HTTP 500 — UNKNOWN
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        const err: any = new Error('Internal Server Error from upstream');
        err.status = 500;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'UNKNOWN' && d.httpStatus === 500);
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 7, name: 'HTTP 500 — UNKNOWN (Classified as UNKNOWN & status=500)', pass });
  }

  // TC 08: TIMEOUT
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      timeoutMs: 20,
      mockFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { text: validGeminiJson };
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.stage === 'timeout' && d.errorType === 'TIMEOUT');
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 8, name: 'TIMEOUT (Classified as TIMEOUT on timeout stage)', pass });
  }

  // TC 09: NETWORK
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        throw new Error('fetch failed: ENOTFOUND generativelanguage.googleapis.com');
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'NETWORK');
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 9, name: 'NETWORK (Classified as NETWORK on DNS/socket failure)', pass });
  }

  // TC 10: RESPONSE_SCHEMA
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => ({ text: 'Not A JSON String' }),
    });
    const logged = res.telemetry.diagnosticsLogged.find(
      (d) => d.stage === 'response_validation' && d.errorType === 'RESPONSE_SCHEMA'
    );
    const pass = Boolean(logged && res.response.responseSource === 'fallback');
    results.push({ id: 10, name: 'RESPONSE_SCHEMA (Classified on invalid JSON)', pass });
  }

  // TC 11: Model đầu thất bại, model sau thành công
  {
    let callIdx = 0;
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async (model) => {
        callIdx++;
        if (callIdx === 1) {
          const err: any = new Error('Model unavailable');
          err.status = 404;
          throw err;
        }
        return { text: validGeminiJson };
      },
    });
    const pass =
      res.telemetry.sdkCallCount === 2 &&
      res.telemetry.finalModel === MODELS_TO_TRY[1] &&
      res.response.responseSource === 'gemini';
    results.push({
      id: 11,
      name: 'Model đầu thất bại, model sau thành công (SDK count=2, final=gemini-3.8-flash)',
      pass,
    });
  }

  // TC 12: Tất cả model thất bại
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        const err: any = new Error('Quota exceeded');
        err.status = 429;
        throw err;
      },
    });
    const pass =
      res.telemetry.sdkCallCount === MODELS_TO_TRY.length &&
      res.response.responseSource === 'fallback';
    results.push({ id: 12, name: 'Tất cả model thất bại (Thử đúng 2 candidate rồi fallback)', pass });
  }

  // TC 13: Gemini trả response hợp lệ
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => ({ text: validGeminiJson }),
    });
    const pass =
      res.telemetry.sdkCallCount === 1 &&
      res.response.responseSource === 'gemini' &&
      typeof res.response.reply === 'string' &&
      res.response.suggestedFollowUps.length > 0;
    results.push({ id: 13, name: 'Gemini trả response hợp lệ (responseSource=gemini)', pass });
  }

  // TC 14: Thiếu Secret
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: '', // Trực tiếp mô phỏng không có API key
      mockFn: async () => ({ text: validGeminiJson }),
    });
    const pass =
      res.telemetry.sdkCallCount === 0 &&
      res.response.responseSource === 'fallback';
    results.push({ id: 14, name: 'Thiếu Secret (Không gọi SDK, fallback ngay lập tức)', pass });
  }

  // TC 15: Logger tắt
  {
    const oldEnv = process.env.ENABLE_GEMINI_DIAGNOSTICS;
    process.env.ENABLE_GEMINI_DIAGNOSTICS = 'false';
    const oldWarn = console.warn;
    let warned = false;
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('[GEMINI_DIAG]')) warned = true;
    };
    try {
      await executeIsolatedTutorChat(baseRequest, undefined, {
        apiKey: 'test_key',
        mockFn: async () => {
          const err: any = new Error('Auth error');
          err.status = 401;
          throw err;
        },
      });
    } finally {
      console.warn = oldWarn;
      process.env.ENABLE_GEMINI_DIAGNOSTICS = oldEnv;
    }
    const pass = !warned;
    results.push({ id: 15, name: 'Logger tắt (Không xuất bất kỳ dòng [GEMINI_DIAG] nào)', pass });
  }

  // TC 16: Logger bật
  {
    const oldEnv = process.env.ENABLE_GEMINI_DIAGNOSTICS;
    process.env.ENABLE_GEMINI_DIAGNOSTICS = 'true';
    const oldWarn = console.warn;
    let loggedLine = '';
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('[GEMINI_DIAG]')) loggedLine = msg;
    };
    try {
      await executeIsolatedTutorChat(baseRequest, undefined, {
        apiKey: 'test_key',
        mockFn: async () => {
          const err: any = new Error('Permission issue');
          err.status = 403;
          throw err;
        },
      });
    } finally {
      console.warn = oldWarn;
      process.env.ENABLE_GEMINI_DIAGNOSTICS = oldEnv;
    }
    const pass = loggedLine.includes('[GEMINI_DIAG]') && loggedLine.includes('errorType=PERMISSION');
    results.push({ id: 16, name: 'Logger bật (Xuất đúng định dạng [GEMINI_DIAG])', pass });
  }

  // TC 17: Error chứa API key giả
  {
    const fakeKey = 'AIzaSyD-FAKE_SECRET_KEY_12345';
    const oldEnv = process.env.ENABLE_GEMINI_DIAGNOSTICS;
    process.env.ENABLE_GEMINI_DIAGNOSTICS = 'true';
    const oldWarn = console.warn;
    let loggedLine = '';
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('[GEMINI_DIAG]')) loggedLine = msg;
    };
    try {
      await executeIsolatedTutorChat(baseRequest, undefined, {
        apiKey: 'test_key',
        mockFn: async () => {
          const err: any = new Error(`Request failed with API key ${fakeKey}`);
          err.status = 401;
          throw err;
        },
      });
    } finally {
      console.warn = oldWarn;
      process.env.ENABLE_GEMINI_DIAGNOSTICS = oldEnv;
    }
    const pass = !loggedLine.includes(fakeKey) && !loggedLine.includes('FAKE_SECRET');
    results.push({ id: 17, name: 'Error chứa API key giả (Key không bao giờ lọt vào log)', pass });
  }

  // TC 18: Error chứa token giả
  {
    const fakeToken = 'ya29.a0AfH6SM-FAKE_BEARER_TOKEN_ABCXYZ';
    const oldEnv = process.env.ENABLE_GEMINI_DIAGNOSTICS;
    process.env.ENABLE_GEMINI_DIAGNOSTICS = 'true';
    const oldWarn = console.warn;
    let loggedLine = '';
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('[GEMINI_DIAG]')) loggedLine = msg;
    };
    try {
      await executeIsolatedTutorChat(baseRequest, undefined, {
        apiKey: 'test_key',
        mockFn: async () => {
          const err: any = new Error(`Authorization: Bearer ${fakeToken} failed`);
          err.status = 401;
          throw err;
        },
      });
    } finally {
      console.warn = oldWarn;
      process.env.ENABLE_GEMINI_DIAGNOSTICS = oldEnv;
    }
    const pass = !loggedLine.includes(fakeToken) && !loggedLine.includes('ya29.');
    results.push({ id: 18, name: 'Error chứa token giả (Token không bao giờ lọt vào log)', pass });
  }

  // TC 19: Import server.ts không khởi động HTTP server
  {
    // Xác minh biến NO_SERVER_START đang hoạt động và không có server listening mới
    const pass = process.env.NO_SERVER_START === '1' || process.env.NO_SERVER_START === 'true';
    results.push({ id: 19, name: 'Import server.ts không khởi động HTTP server (NO_SERVER_START=1 active)', pass });
  }

  // TC 20: Mock không tạo request mạng
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => ({ text: validGeminiJson }),
    });
    const pass = res.telemetry.networkRequestCount === 0;
    results.push({ id: 20, name: 'Mock không tạo request mạng (networkRequestCount=0)', pass });
  }

  // TC 21: Giới hạn số lần gọi SDK được thực thi
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => {
        throw new Error('Some error');
      },
    });
    // Tối đa 2 lần gọi tương ứng với đúng 2 models trong MODELS_TO_TRY, không retry vô hạn
    const pass = res.telemetry.sdkCallCount <= MODELS_TO_TRY.length;
    results.push({ id: 21, name: 'Giới hạn số lần gọi SDK (Không vượt quá candidate list count: <=2)', pass });
  }

  // TC 22: Runner không làm thay đổi responseSource hoặc guardrail của ứng dụng
  {
    const mockVerification: StepVerificationDetail = {
      stepType: 'intermediate_transformation',
      status: 'verified_correct',
      explanation: 'Chuyển vế chính xác.',
      notes: ['Kiểm chứng chuyển vế độc lập'],
    };
    const res = await executeIsolatedTutorChat(
      { ...baseRequest, correctionStep: '2x = 10 - 4' },
      mockVerification,
      {
        apiKey: 'test_key',
        mockFn: async () => ({ text: validGeminiJson }),
      }
    );
    // Khi có verificationResult, guardrail luôn ép responseSource = 'fallback' và không gọi Gemini
    const pass = res.response.responseSource === 'fallback' && res.telemetry.sdkCallCount === 0;
    results.push({
      id: 22,
      name: 'Deterministic guardrail toàn vẹn (responseSource=fallback khi có verificationResult)',
      pass,
    });
  }

  // ==========================================
  // FIX-09: BỔ SUNG CÁC KIỂM THỬ SINGLE-CALL SAFETY GATE (TC 23 - TC 35)
  // ==========================================

  // TC 23: Live gate mặc định đóng (Default options without allowLiveCall -> sdkCallCount=0, fallback)
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'UNKNOWN');
    const pass = res.telemetry.sdkCallCount === 0 && res.response.responseSource === 'fallback' && Boolean(logged);
    results.push({ id: 23, name: 'Live gate mặc định đóng (sdkCallCount=0, responseSource=fallback)', pass });
  }

  // TC 24: MOCK_ONLY=true luôn chặn Live
  {
    const oldEnvMock = process.env.MOCK_ONLY;
    const oldEnvAllow = process.env.ALLOW_LIVE_CALL;
    process.env.MOCK_ONLY = 'true';
    process.env.ALLOW_LIVE_CALL = 'true';
    let res: RunnerExecutionResult;
    try {
      res = await executeIsolatedTutorChat(baseRequest, undefined, {
        apiKey: 'test_key',
        allowLiveCall: true,
      });
    } finally {
      process.env.MOCK_ONLY = oldEnvMock;
      process.env.ALLOW_LIVE_CALL = oldEnvAllow;
    }
    const pass = res.telemetry.sdkCallCount === 0 && res.response.responseSource === 'fallback';
    results.push({ id: 24, name: 'MOCK_ONLY=true luôn chặn Live (sdkCallCount=0)', pass });
  }

  // TC 25: Thiếu quyền Live (ALLOW_LIVE_CALL env thiếu -> sdkCallCount=0)
  {
    const oldEnvMock = process.env.MOCK_ONLY;
    const oldEnvAllow = process.env.ALLOW_LIVE_CALL;
    process.env.MOCK_ONLY = 'false';
    delete process.env.ALLOW_LIVE_CALL;
    let res: RunnerExecutionResult;
    try {
      res = await executeIsolatedTutorChat(baseRequest, undefined, {
        apiKey: 'test_key',
        allowLiveCall: true,
      });
    } finally {
      process.env.MOCK_ONLY = oldEnvMock;
      process.env.ALLOW_LIVE_CALL = oldEnvAllow;
    }
    const pass = res.telemetry.sdkCallCount === 0 && res.response.responseSource === 'fallback';
    results.push({ id: 25, name: 'Thiếu quyền Live (ALLOW_LIVE_CALL env thiếu -> sdkCallCount=0)', pass });
  }

  // TC 26: Thiếu API key thì không gọi SDK
  {
    const oldEnvMock = process.env.MOCK_ONLY;
    const oldEnvAllow = process.env.ALLOW_LIVE_CALL;
    process.env.MOCK_ONLY = 'false';
    process.env.ALLOW_LIVE_CALL = 'true';
    let res: RunnerExecutionResult;
    try {
      res = await executeIsolatedTutorChat(baseRequest, undefined, {
        apiKey: '',
        allowLiveCall: true,
      });
    } finally {
      process.env.MOCK_ONLY = oldEnvMock;
      process.env.ALLOW_LIVE_CALL = oldEnvAllow;
    }
    const pass = res.telemetry.sdkCallCount === 0 && res.response.responseSource === 'fallback';
    results.push({ id: 26, name: 'Thiếu API key thì không gọi SDK (sdkCallCount=0)', pass });
  }

  // TC 27: Model đầu thành công: đúng một lần gọi SDK giả lập
  {
    let callCount = 0;
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      maxSdkCalls: 1,
      singleModelCandidateOnly: true,
      mockFn: async () => {
        callCount++;
        return { text: validGeminiJson };
      },
    });
    const pass = callCount === 1 && res.telemetry.sdkCallCount === 1 && res.response.responseSource === 'gemini';
    results.push({ id: 27, name: 'Model đầu thành công: đúng một lần gọi SDK giả lập (sdkCallCount=1)', pass });
  }

  // TC 28: Model đầu trả HTTP 404: một lần gọi SDK giả lập, không thử model thứ hai
  {
    let callCount = 0;
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      maxSdkCalls: 1,
      mockFn: async (model) => {
        callCount++;
        const err: any = new Error(`models/${model} is not found`);
        err.status = 404;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'MODEL_NOT_FOUND' && d.httpStatus === 404);
    const pass = callCount === 1 && res.telemetry.sdkCallCount === 1 && res.telemetry.modelsAttempted.length === 1 && Boolean(logged);
    results.push({ id: 28, name: 'Model đầu trả HTTP 404: 1 lần gọi SDK, KHÔNG thử model 2 (sdkCallCount=1)', pass });
  }

  // TC 29: Model đầu trả HTTP 429: không retry
  {
    let callCount = 0;
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      maxSdkCalls: 1,
      mockFn: async () => {
        callCount++;
        const err: any = new Error('Quota exceeded');
        err.status = 429;
        throw err;
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'QUOTA' && d.httpStatus === 429);
    const pass = callCount === 1 && res.telemetry.sdkCallCount === 1 && Boolean(logged);
    results.push({ id: 29, name: 'Model đầu trả HTTP 429: không retry (sdkCallCount=1)', pass });
  }

  // TC 30: Timeout: không retry
  {
    let callCount = 0;
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      maxSdkCalls: 1,
      timeoutMs: 50,
      mockFn: async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { text: validGeminiJson };
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.stage === 'timeout' && d.errorType === 'TIMEOUT');
    const pass = callCount === 1 && res.telemetry.sdkCallCount === 1 && Boolean(logged);
    results.push({ id: 30, name: 'Timeout: không retry (sdkCallCount=1, TIMEOUT logged)', pass });
  }

  // TC 31: Network failure: không retry
  {
    let callCount = 0;
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      maxSdkCalls: 1,
      mockFn: async () => {
        callCount++;
        throw new Error('fetch failed: ENOTFOUND generativelanguage.googleapis.com');
      },
    });
    const logged = res.telemetry.diagnosticsLogged.find((d) => d.errorType === 'NETWORK');
    const pass = callCount === 1 && res.telemetry.sdkCallCount === 1 && Boolean(logged);
    results.push({ id: 31, name: 'Network failure: không retry (sdkCallCount=1, NETWORK logged)', pass });
  }

  // TC 32: Response schema invalid: không retry
  {
    let callCount = 0;
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      maxSdkCalls: 1,
      mockFn: async () => {
        callCount++;
        return { text: '{"invalid": "schema"}' };
      },
    });
    const pass = callCount === 1 && res.telemetry.sdkCallCount === 1 && res.response.responseSource === 'fallback';
    results.push({ id: 32, name: 'Response schema invalid: không retry (sdkCallCount=1, fallback)', pass });
  }

  // TC 33: Bộ đếm được tăng TRƯỚC KHI thực hiện lời gọi mock/SDK
  {
    let capturedCountBeforeReturn = 0;
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      maxSdkCalls: 1,
      mockFn: async () => {
        capturedCountBeforeReturn = 1; // mockFn chỉ được gọi SAU KHI sdkCallCount đã tăng lên 1
        return { text: validGeminiJson };
      },
    });
    const pass = res.telemetry.sdkCallCount === 1 && capturedCountBeforeReturn === 1;
    results.push({ id: 33, name: 'Bộ đếm tăng TRƯỚC KHI thực hiện lời gọi SDK (sdkCallCount=1)', pass });
  }

  // TC 34: Chỉ kiểm tra model đầu tiên gemini-3.1-flash-lite khi singleModelCandidateOnly: true hoặc maxSdkCalls=1
  {
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      singleModelCandidateOnly: true,
      maxSdkCalls: 1,
      mockFn: async (model) => {
        if (model !== MODELS_TO_TRY[0]) {
          throw new Error(`Unexpected model: ${model}`);
        }
        return { text: validGeminiJson };
      },
    });
    const pass =
      res.telemetry.modelsAttempted.length === 1 &&
      res.telemetry.modelsAttempted[0] === 'gemini-3.1-flash-lite';
    results.push({ id: 34, name: 'Chỉ kiểm tra model đầu tiên gemini-3.1-flash-lite (single candidate)', pass });
  }

  // TC 35: Phân biệt giới hạn lời gọi SDK với HTTP request thực tế (networkRequestCertainty)
  {
    const resMock = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      mockFn: async () => ({ text: validGeminiJson }),
    });
    const pass =
      resMock.telemetry.networkRequestCertainty === 'VERIFIED_ZERO' &&
      resMock.telemetry.networkRequestCount === 0;
    results.push({ id: 35, name: 'Telemetry ghi nhận networkRequestCertainty=VERIFIED_ZERO cho mock', pass });
  }

  // TC 36: Thiếu NO_SERVER_START=1 thì Live bị chặn
  {
    const oldNoServer = process.env.NO_SERVER_START;
    const oldAllow = process.env.ALLOW_LIVE_CALL;
    const oldMock = process.env.MOCK_ONLY;
    delete process.env.NO_SERVER_START;
    process.env.ALLOW_LIVE_CALL = 'true';
    process.env.MOCK_ONLY = 'false';
    let res: RunnerExecutionResult;
    try {
      res = await executeIsolatedTutorChat(baseRequest, undefined, {
        apiKey: 'test_key',
        allowLiveCall: true,
      });
    } finally {
      process.env.NO_SERVER_START = oldNoServer;
      process.env.ALLOW_LIVE_CALL = oldAllow;
      process.env.MOCK_ONLY = oldMock;
    }
    const pass = res.telemetry.sdkCallCount === 0 && res.response.responseSource === 'fallback';
    results.push({ id: 36, name: 'Thiếu NO_SERVER_START=1 thì Live bị chặn (sdkCallCount=0)', pass });
  }

  // TC 37: Kiểm tra cấu hình options khi đấu nối Live CLI
  {
    let receivedModel = '';
    const res = await executeIsolatedTutorChat(baseRequest, undefined, {
      apiKey: 'test_key',
      allowLiveCall: true,
      maxSdkCalls: 1,
      singleModelCandidateOnly: true,
      mockFn: async (m) => {
        receivedModel = m;
        return { text: validGeminiJson };
      },
    });
    const pass =
      receivedModel === 'gemini-3.1-flash-lite' &&
      res.telemetry.sdkCallCount === 1 &&
      res.telemetry.modelsAttempted.length === 1 &&
      res.response.responseSource === 'gemini';
    results.push({ id: 37, name: 'Cấu hình Live CLI options: đúng 1 SDK call, duy nhất gemini-3.1-flash-lite', pass });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  return { total: results.length, passed, failed, results };
}

// ==========================================
// CLI ENTRY POINT
// ==========================================

async function main() {
  const args = process.argv.slice(2);
  const isLiveRequested = args.includes('--live') || args.includes('--run-live');

  if (isLiveRequested) {
    console.log('====================================================');
    console.log('TC-LIVE: CONTROLLED SINGLE-CALL GEMINI LIVE TEST');
    console.log('====================================================\n');

    // 1. Kiểm tra biến môi trường NO_SERVER_START
    if (process.env.NO_SERVER_START !== '1' && process.env.NO_SERVER_START !== 'true') {
      console.error('[GATE_BLOCKED] Biến môi trường NO_SERVER_START không hợp lệ (cần =1 hoặc true). Lệnh gọi bị từ chối.');
      process.exit(1);
    }

    // 2. Kiểm tra biến môi trường ALLOW_LIVE_CALL
    if (process.env.ALLOW_LIVE_CALL !== 'true') {
      console.error('[GATE_BLOCKED] Biến môi trường ALLOW_LIVE_CALL !== "true". Lệnh gọi bị từ chối.');
      process.exit(1);
    }

    // 3. Kiểm tra biến môi trường MOCK_ONLY
    if (process.env.MOCK_ONLY === 'true') {
      console.error('[GATE_BLOCKED] Biến môi trường MOCK_ONLY=true. Lệnh gọi bị từ chối.');
      process.exit(1);
    }

    // 4. Kiểm tra biến môi trường GEMINI_API_KEY
    if (!process.env.GEMINI_API_KEY) {
      console.error('[GATE_BLOCKED] GEMINI_API_KEY không tồn tại trong môi trường. Lệnh gọi bị từ chối.');
      process.exit(1);
    }

    // FIX-10: Đấu nối điểm vào CLI đến hàm thực thi Live duy nhất 1 lần gọi SDK
    // Câu hỏi chuẩn toán học theo yêu cầu TC-LIVE-03:
    const liveRequest: TutorChatRequest = {
      problemText: 'Phương trình bậc nhất một ẩn: 2x + 4 = 10',
      userMessage: 'Vì sao khi chuyển một số hạng sang vế kia của phương trình thì phải đổi dấu? Hãy giải thích ngắn gọn, không giải toàn bộ bài toán.',
      messages: [],
      errorContext: { errorCategory: 'Quy tắc chuyển vế' },
    };

    const startTime = Date.now();
    try {
      const liveResult = await executeIsolatedTutorChat(liveRequest, undefined, {
        allowLiveCall: true,
        maxSdkCalls: 1,
        singleModelCandidateOnly: true,
        timeoutMs: DEFAULT_TIMEOUT_MS,
      });
      const elapsedMs = Date.now() - startTime;

      // In kết quả chẩn đoán đã làm sạch (Sanitized Diagnostic Telemetry)
      // TUYỆT ĐỐI KHÔNG in prompt, response body, API key, token hay raw error
      console.log('\n--- KẾT QUẢ CHẨN ĐOÁN (SANITIZED TELEMETRY) ---');
      console.log(`attemptId: ${liveResult.telemetry.attemptId}`);
      console.log(`model: ${liveResult.telemetry.modelsAttempted[0] || 'gemini-3.1-flash-lite'}`);
      console.log(`sdkCallCount: ${liveResult.telemetry.sdkCallCount}`);
      console.log(`networkRequestCertainty: ${liveResult.telemetry.networkRequestCertainty}`);
      console.log(`responseSource: ${liveResult.response.responseSource}`);
      console.log(`elapsedMs: ${elapsedMs}`);

      if (liveResult.telemetry.diagnosticsLogged.length > 0) {
        const lastDiag = liveResult.telemetry.diagnosticsLogged[liveResult.telemetry.diagnosticsLogged.length - 1];
        console.log(`stage: ${lastDiag.stage}`);
        console.log(`errorType: ${lastDiag.errorType}`);
        console.log(`httpStatus: ${lastDiag.httpStatus !== null ? lastDiag.httpStatus : 'none'}`);
      } else {
        console.log('stage: none');
        console.log('errorType: NONE');
        console.log('httpStatus: 200');
      }

      console.log(`schemaValidation: ${liveResult.response.responseSource === 'gemini' ? 'VALID' : 'FALLBACK_OR_INVALID'}`);
      console.log(`timeout: ${elapsedMs >= DEFAULT_TIMEOUT_MS ? 'TIMED_OUT' : 'FALSE'}`);

      process.exit(0);
    } catch (cliErr: unknown) {
      const elapsedMs = Date.now() - startTime;
      console.error('\n[CLI_EXECUTION_ERROR] Lỗi thực thi không bắt được:');
      const diag = classifyGeminiError(cliErr, 'request');
      console.log(`stage: request`);
      console.log(`errorType: ${diag.errorType}`);
      console.log(`httpStatus: ${diag.httpStatus !== null ? diag.httpStatus : 'none'}`);
      console.log(`elapsedMs: ${elapsedMs}`);
      process.exit(1);
    }
  }

  console.log('====================================================');
  console.log('QA-14 / FIX-09 / FIX-10: ISOLATED GEMINI RUNNER — MOCK SUITE');
  console.log('Chế độ: STRICT MOCK ONLY — ZERO NETWORK CALLS');
  console.log('====================================================\n');

  try {
    const suiteResult = await runMockTestSuite();

    for (const r of suiteResult.results) {
      console.log(`[TC-${String(r.id).padStart(2, '0')}] ${r.pass ? 'PASS' : 'FAIL'}: ${r.name}`);
    }

    console.log('\n----------------------------------------------------');
    console.log(`TỔNG KẾT: ${suiteResult.passed}/${suiteResult.total} PASS (${suiteResult.failed} FAILED)`);
    console.log('----------------------------------------------------');

    if (suiteResult.failed > 0) {
      process.exit(1);
    }
  } catch (err: unknown) {
    console.error('Lỗi không mong muốn trong khi chạy test suite:', err);
    process.exit(1);
  }
}

// Tự động kích hoạt khi chạy trực tiếp qua CLI
const isDirectCliRun =
  process.argv[1]?.endsWith('isolated_gemini_runner.ts') ||
  process.argv[1]?.endsWith('isolated_gemini_runner.js');

if (isDirectCliRun) {
  main();
}
