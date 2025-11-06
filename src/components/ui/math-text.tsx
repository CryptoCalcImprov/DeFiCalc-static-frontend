"use client";

import { useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  children: string;
  displayMode?: boolean;
  className?: string;
}

export function MathText({ children, displayMode = false, className = "" }: MathTextProps) {
  useEffect(() => {
    // Pre-render math on mount if needed for performance
  }, [children]);

  const renderMath = () => {
    try {
      return katex.renderToString(children, {
        displayMode,
        throwOnError: false,
        output: "html",
        strict: "ignore",
      });
    } catch (error) {
      console.error("KaTeX rendering error:", error);
      return children; // Fallback to plain text
    }
  };

  return (
    <span
      className={`math-text ${displayMode ? "block my-2" : "inline"} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMath() }}
    />
  );
}

interface MessageWithMathProps {
  content: string;
  className?: string;
}

export function MessageWithMath({ content, className = "" }: MessageWithMathProps) {
  // Parse content for inline math (between $ $) and block math (between $$ $$)
  const parseContent = () => {
    const parts: JSX.Element[] = [];
    let currentIndex = 0;
    let key = 0;

    // Regex to find math expressions
    // Block math: $$...$$ (supports escaped characters inside)
    // Inline math: $...$ (supports escaped characters inside)
    const mathRegex = /\$\$((?:\\.|[^$])+?)\$\$|\$((?:\\.|[^$])+?)\$/g;
    let match;
    let hasExplicitMath = false;

    while ((match = mathRegex.exec(content)) !== null) {
      hasExplicitMath = true;
      // Add text before the math
      if (match.index > currentIndex) {
        const textBefore = content.substring(currentIndex, match.index);
        parts.push(<span key={`text-${key++}`}>{textBefore}</span>);
      }

      // Add the math expression
      const isBlock = match[0].startsWith("$$");
      const mathContent = isBlock ? match[1] : match[2];
      
      parts.push(
        <MathText key={`math-${key++}`} displayMode={isBlock}>
          {mathContent.trim()}
        </MathText>
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < content.length) {
      parts.push(<span key={`text-${key++}`}>{content.substring(currentIndex)}</span>);
    }

    // If no explicit math found, render as plain text
    if (!hasExplicitMath) {
      return [<span key="original">{content}</span>];
    }

    return parts.length > 0 ? parts : [<span key="original">{content}</span>];
  };

  return <div className={className}>{parseContent()}</div>;
}
