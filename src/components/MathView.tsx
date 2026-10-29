import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({
  math,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      console.warn('KaTeX rendering error:', err);
      return `<span class="text-rose-500 font-mono">${math}</span>`;
    }
  }, [math, displayMode]);

  return (
    <span
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Component render đoạn văn bản hỗn hợp chứa cả chữ thường và công thức toán trong dấu $...$
 */
export const FormattedMathText: React.FC<{ text: string; className?: string }> = ({
  text,
  className = '',
}) => {
  const segments = useMemo(() => {
    const safeText = typeof text === 'string' ? text : '';

    // Tách chuỗi theo dấu $...$
    const parts = safeText.split(/(\$[^$]+\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1);
        return <MathView key={index} math={formula} displayMode={false} className="mx-0.5" />;
      }
      return <span key={index}>{part}</span>;
    });
  }, [text]);

  return <span className={className}>{segments}</span>;
};
