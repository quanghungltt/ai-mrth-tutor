import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, TutorChatContext, TutorChatResponse, StepVerificationDetail } from '../types/math';
import { MathView, FormattedMathText } from './MathView';
import {
  Sparkles,
  Send,
  RefreshCw,
  Lightbulb,
  Bot,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Bookmark,
  Check,
  XCircle,
  MessageSquare,
  PenTool,
  ShieldCheck,
} from 'lucide-react';

interface AiTutorChatViewProps {
  initialContext?: TutorChatContext;
  onSelectProblemContext?: (context: TutorChatContext) => void;
}

const DEFAULT_PROBLEM: TutorChatContext = {
  problemText: '2(x + 3) = 14',
  solutionSteps: ['2x + 3 = 14', '2x = 11', 'x = 11/2'],
  errorStepIndex: 0,
  errorCategory: 'Lỗi phân phối phép nhân',
  notes: 'Bước 1 sai khi nhân 2 với cụm (x + 3) thành 2x + 3 (quên nhân 2 với 3).',
};

const MATH_SHORTCUTS = [
  { label: 'x', value: 'x' },
  { label: '+', value: ' + ' },
  { label: '−', value: ' - ' },
  { label: '×', value: ' \\cdot ' },
  { label: ':', value: ' : ' },
  { label: '=', value: ' = ' },
  { label: '( )', value: '()' },
  { label: 'x²', value: 'x^2' },
];

export const CLIENT_TIMEOUT_MS = 15000;

export const AiTutorChatView: React.FC<AiTutorChatViewProps> = ({
  initialContext,
}) => {
  const [context, setContext] = useState<TutorChatContext>(
    initialContext || DEFAULT_PROBLEM
  );
  const [isContextExpanded, setIsContextExpanded] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [inputMode, setInputMode] = useState<'chat' | 'correction'>('chat');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cơ chế an toàn phiên: sessionGeneration và AbortController
  const sessionGenerationRef = useRef<number>(1);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cập nhật khi initialContext từ ngoài truyền vào thay đổi
  useEffect(() => {
    // Tăng thế hệ phiên và hủy yêu cầu API đang chạy của bài trước (nếu có)
    sessionGenerationRef.current += 1;
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort('USER_ABORT');
      activeAbortControllerRef.current = null;
    }
    setIsLoading(false);
    setErrorMsg(null);

    const targetCtx = initialContext || DEFAULT_PROBLEM;
    setContext(targetCtx);
    initConversation(targetCtx);
  }, [initialContext]);

  // Khởi tạo cuộc trò chuyện với thông điệp mở đầu sư phạm
  const initConversation = (ctx: TutorChatContext) => {
    const welcomeMsg: ChatMessage = {
      id: `msg-welcome-${sessionGenerationRef.current}`,
      role: 'assistant',
      content: `Chào em! Thầy/Cô là Trợ giảng môn Toán. Thầy/Cô đang cùng em xem bài toán $${ctx.problemText}$.
${
  ctx.errorStepIndex !== undefined && ctx.errorStepIndex !== null
    ? `Thầy/Cô thấy ở Bước ${ctx.errorStepIndex + 1} đang có một điểm cần chúng mình cùng soi kỹ lại. Em hãy thử nhìn lại bước đó xem mình đã thực hiện phép tính nào nhé?`
    : `Em đang muốn hỏi về bước giải nào hay cần thầy/cô gợi mở điều gì ở bài này?`
}`,
      timestamp: Date.now(),
      suggestedFollowUps: [
        'Em chưa hiểu tại sao bước đó lại sai',
        'Nhắc lại quy tắc giúp em với',
        'Thử sửa bước giải',
      ],
      isGuidingQuestion: true,
      responseSource: 'gemini',
    };
    setMessages([welcomeMsg]);
  };

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Gửi tin nhắn đến Trợ giảng AI hoặc gửi bước sửa kiểm chứng
  const handleSendMessage = async (customText?: string, forcedMode?: 'chat' | 'correction') => {
    const textToSend = (customText !== undefined ? customText : inputValue).trim();
    if (!textToSend) return;

    // Xác định chế độ gửi
    const currentMode = forcedMode || inputMode;
    const isCorrection = currentMode === 'correction';

    // Bắt thế hệ phiên hiện tại để kiểm tra an toàn bất đồng bộ
    const currentSession = sessionGenerationRef.current;

    // Hủy yêu cầu cũ nếu còn dang dở (đánh dấu lý do USER_ABORT)
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort('USER_ABORT');
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content: isCorrection ? `Thử sửa bước giải: ${textToSend}` : textToSend,
      timestamp: Date.now(),
      isCorrectionAttempt: isCorrection,
      correctionStep: isCorrection ? textToSend : undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setErrorMsg(null);
    setIsLoading(true);

    let isTimeout = false;
    const timeoutId = setTimeout(() => {
      isTimeout = true;
      abortController.abort('CLIENT_TIMEOUT');
    }, CLIENT_TIMEOUT_MS);

    try {
      const historyForApi = newMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const res = await fetch('/api/chat-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          problemText: context.problemText,
          solutionSteps: context.solutionSteps,
          errorContext: {
            errorStepIndex: context.errorStepIndex,
            errorCategory: context.errorCategory,
            notes: context.notes,
          },
          messages: historyForApi.slice(0, -1),
          userMessage: textToSend,
          messageType: currentMode,
          correctionStep: isCorrection ? textToSend : undefined,
        }),
      });

      // Nếu người dùng đã đổi bài toán hoặc reset trong lúc fetch đang xử lý: BỎ QUA PHẢN HỒI NÀY
      if (sessionGenerationRef.current !== currentSession) {
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Máy chủ bận, vui lòng thử lại sau.');
      }

      const replyData: TutorChatResponse = await res.json();

      // Kiểm tra lại lần nữa trước khi cập nhật state
      if (sessionGenerationRef.current !== currentSession) {
        return;
      }

      // Từ chối phản hồi API thiếu nội dung hoặc sai định dạng.
      if (
        !replyData ||
        typeof replyData !== 'object' ||
        typeof replyData.reply !== 'string' ||
        !replyData.reply.trim()
      ) {
        throw new Error(
          'Dữ liệu phản hồi từ Trợ giảng không đúng định dạng. Vui lòng thử lại.'
        );
      }

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        content: replyData.reply,
        timestamp: Date.now(),
        suggestedFollowUps: replyData.suggestedFollowUps,
        isGuidingQuestion: true,
        responseSource: replyData.responseSource,
        verification: replyData.verification,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      // Nếu phiên đã thay đổi (người dùng đổi bài / reset), bỏ qua mọi lỗi
      if (sessionGenerationRef.current !== currentSession) {
        return;
      }

      // Phân biệt timeout vs hủy bởi người dùng
      if (
        isTimeout ||
        (abortController.signal.aborted && abortController.signal.reason === 'CLIENT_TIMEOUT')
      ) {
        setErrorMsg('Trợ giảng phản hồi quá lâu. Em vui lòng kiểm tra kết nối và thử lại nhé!');
        return;
      }

      // Nếu tác vụ bị hủy có chủ đích do người dùng gửi tin nhắn mới hoặc đóng phiên
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const msg = err instanceof Error ? err.message : 'Không thể kết nối máy chủ.';
      setErrorMsg(msg);
    } finally {
      clearTimeout(timeoutId);
      if (sessionGenerationRef.current === currentSession) {
        setIsLoading(false);
        if (activeAbortControllerRef.current === abortController) {
          activeAbortControllerRef.current = null;
        }
      }
    }
  };

  // Chèn ký tự toán học vào ô nhập
  const handleInsertShortcut = (shortcut: string) => {
    setInputValue((prev) => prev + shortcut);
    inputRef.current?.focus();
  };

  // Đặt lại cuộc trò chuyện (Reset chat an toàn)
  const handleResetConversation = () => {
    if (window.confirm('Em có muốn bắt đầu lại cuộc trò chuyện từ đầu không?')) {
      // Tăng thế hệ phiên và hủy fetch đang xử lý
      sessionGenerationRef.current += 1;
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort('USER_ABORT');
        activeAbortControllerRef.current = null;
      }
      setIsLoading(false);
      setErrorMsg(null);
      setInputValue('');
      initConversation(context);
    }
  };

  // Render thẻ kết quả kiểm chứng toán học độc lập
  const renderVerificationCard = (verification: StepVerificationDetail) => {
    switch (verification.status) {
      case 'verified_correct':
        return (
          <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px] uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ĐÃ KIỂM CHỨNG ĐẠI SỐ ĐỘC LẬP: ĐÚNG</span>
            </div>
            <p className="leading-relaxed font-medium">
              {verification.explanation}
            </p>
          </div>
        );

      case 'verified_incorrect':
        return (
          <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px] uppercase tracking-wide">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>ĐÃ KIỂM CHỨNG ĐẠI SỐ ĐỘC LẬP: CHƯA ĐÚNG</span>
            </div>
            <p className="leading-relaxed font-medium">
              {verification.explanation}
            </p>
          </div>
        );

      case 'uncertain':
        return (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px] uppercase tracking-wide">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>CẦN LÀM RÕ / CHƯA ĐÚNG BƯỚC BIẾN ĐỔI</span>
            </div>
            <p className="leading-relaxed font-medium">
              {verification.explanation}
            </p>
          </div>
        );

      case 'unsupported':
      default:
        return (
          <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] uppercase tracking-wide">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>CHƯA HỖ TRỢ KIỂM CHỨNG TỰ ĐỘNG</span>
            </div>
            <p className="text-[11px]">
              {verification.explanation}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Trợ giảng AI Đối thoại nhiều lượt (XD-02B & FIX-01)</span>
              </span>
              <span className="text-xs text-blue-200/80 hidden sm:inline">•</span>
              <span className="text-xs text-blue-200/80 hidden sm:inline">Phương pháp gợi mở Socrates</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Đối thoại cùng Trợ giảng Toán THCS
            </h2>
          </div>

          <button
            type="button"
            onClick={handleResetConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/15 cursor-pointer"
            title="Bắt đầu lại cuộc hội thoại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Trò chuyện lại</span>
          </button>
        </div>
      </div>

      {/* Bối cảnh bài toán đang thảo luận (Collapsible Context Card) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div
          onClick={() => setIsContextExpanded(!isContextExpanded)}
          className="p-4 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-200/70"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bài toán đang trao đổi:
            </span>
            <span className="font-mono text-sm font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <MathView math={context.problemText} />
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span>{isContextExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết các bước'}</span>
            {isContextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isContextExpanded && (
          <div className="p-4 space-y-3 bg-white text-xs">
            {context.solutionSteps && context.solutionSteps.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-600">Các bước làm bài đã ghi nhận:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {context.solutionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                        context.errorStepIndex === idx
                          ? 'bg-rose-50 border-rose-300 text-rose-900 ring-1 ring-rose-200'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-white border text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <MathView math={step} />
                      </div>
                      {context.errorStepIndex === idx && (
                        <span className="ml-auto text-[10px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded shrink-0">
                          Lỗi gốc
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {context.errorCategory && (
              <div className="flex items-center gap-2 pt-1 text-slate-600">
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span>Nhóm lỗi trọng tâm: <strong>{context.errorCategory}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Khung chat tin nhắn */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col min-h-[480px] max-h-[600px]">
        {/* Vùng cuộn tin nhắn */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? msg.isCorrectionAttempt
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-indigo-600 text-white shadow-2xs'
                }`}
              >
                {msg.role === 'user' ? (
                  msg.isCorrectionAttempt ? <PenTool className="w-4 h-4" /> : <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Bong bóng tin nhắn */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? msg.isCorrectionAttempt
                      ? 'bg-emerald-700 text-white rounded-tr-none'
                      : 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-none shadow-2xs'
                }`}
              >
                {/* Header người gửi và nhãn nguồn minh bạch */}
                <div className="font-semibold text-[11px] mb-1.5 opacity-90 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span>
                      {msg.role === 'user'
                        ? msg.isCorrectionAttempt
                          ? 'Em (Thử sửa bước giải)'
                          : 'Em'
                        : 'Trợ giảng AI'}
                    </span>
                    <span className="text-[10px] opacity-60">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Minh bạch phản hồi: Gắn nhãn rõ Gemini, Kiểm chứng đại số hay Fallback */}
                  {msg.role === 'assistant' && (
                    <div>
                      {msg.responseSource === 'gemini' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-semibold border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Gemini AI</span>
                        </span>
                      ) : msg.responseSource === 'fallback' && msg.verification ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-semibold border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Kiểm chứng đại số độc lập</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-semibold border border-amber-300">
                          <AlertCircle className="w-3 h-3 text-amber-700" />
                          <span>Gợi ý mẫu — AI hiện không khả dụng</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Nội dung tin nhắn kèm định dạng công thức toán KaTeX */}
                <div className="space-y-2">
                  <FormattedMathText text={msg.content} />
                </div>

                {/* Kết quả kiểm chứng toán học độc lập (nếu học sinh vừa gửi bước sửa) */}
                {msg.role === 'assistant' && msg.verification && renderVerificationCard(msg.verification)}

                {/* Các gợi ý câu trả lời nhanh dưới tin nhắn của trợ giảng */}
                {msg.role === 'assistant' && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-slate-200/60 space-y-1.5">
                    <div className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      <span>Em có thể chọn nhanh:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((suggest, sIdx) => {
                        const isSuggestCorrection =
                          suggest.toLowerCase().includes('thử sửa') ||
                          suggest.toLowerCase().includes('bước sửa');
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                              if (isSuggestCorrection) {
                                setInputMode('correction');
                                inputRef.current?.focus();
                              } else {
                                handleSendMessage(suggest, 'chat');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs transition-colors text-left cursor-pointer disabled:opacity-50"
                          >
                            {suggest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Trạng thái đang gõ */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>
                  {inputMode === 'correction'
                    ? 'Bộ kiểm chứng độc lập & Trợ giảng AI đang phân tích bước sửa của em...'
                    : 'Trợ giảng đang suy nghĩ câu hỏi gợi mở cho em...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Lỗi nếu có */}
        {errorMsg && (
          <div className="mx-4 mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Chuyển đổi chế độ: Trò chuyện vs Thử sửa bước giải */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-0.5 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setInputMode('chat')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'chat'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Trao đổi gợi mở</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('correction')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'correction'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Thử sửa bước giải</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">Chèn nhanh:</span>
            {MATH_SHORTCUTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertShortcut(item.value)}
                className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded text-xs font-mono font-semibold text-slate-700 transition-colors shrink-0 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Khung nhập tin nhắn */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                inputMode === 'correction'
                  ? 'Nhập bước giải sửa (VD: 2x + 6 = 14 hoặc 2*x + 6 = 14)...'
                  : 'Nhập câu hỏi, suy nghĩ hoặc thắc mắc của em...'
              }
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 transition-all outline-none ${
                inputMode === 'correction'
                  ? 'border-emerald-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20'
              }`}
            />

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={`p-2.5 sm:px-4 sm:py-2.5 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                inputMode === 'correction'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {inputMode === 'correction' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">Kiểm chứng bước sửa</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">Gửi</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
