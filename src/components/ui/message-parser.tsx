"use client";

import { MathText } from "@/components/ui/math-text";
import { ImageDisplay } from "@/components/ui/image-display";

interface MessageParserProps {
  content: string;
  className?: string;
}

function normalizeMathContent(input: string) {
  return input
    .replace(/[\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/\u2011/g, "-")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"');
}

type PlainTextReplacement = [RegExp, string | ((...match: string[]) => string)];

const plainTextReplacements: PlainTextReplacement[] = [
  [/\\times/g, "\u00d7"],
  [/\\div/g, "\u00f7"],
  [/\\approx/g, "\u2248"],
  [/\\pm/g, "\u00b1"],
  [/\\geq/g, "\u2265"],
  [/\\leq/g, "\u2264"],
  [/\\cdot/g, "\u00b7"],
  [/\\deg/g, "\u00b0"],
  [/\\percent/g, "%"],
  [/\\_/g, "_"],
  [/\\left/g, ""],
  [/\\right/g, ""],
  [/\\,/g, ", "],
  [/\\;/g, "; "],
  [/\\!/g, ""],
  [/\\\s+/g, " "],
  [/\\\{/g, "{"],
  [/\\\}/g, "}"],
  [/\\\[/g, "["],
  [/\\\]/g, "]"],
  [/\\text\{([^}]*)\}/g, (_match, text) => text ?? ""],
  [/\\mathrm\{([^}]*)\}/g, (_match, text) => text ?? ""],
  [/\\operatorname\{([^}]*)\}/g, (_match, text) => text ?? ""],
  [/\\overline\{([^}]*)\}/g, (_match, text) => text ?? ""],
  [/\\sqrt\{([^}]*)\}/g, (_match, text) => `sqrt(${text ?? ""})`],
  [/\\frac\{([^}]*)\}\{([^}]*)\}/g, (_match, numerator, denominator) => `${numerator ?? ""}/${denominator ?? ""}`],
  [/\\\$/g, "$"],
  [/\\%/g, "%"],
  [/\\#/g, "#"],
  [/\\&/g, "&"],
  [/\\~/g, "\u00a0"],
  [/\\(?=[0-9.,+-])/g, ""],
];

function normalizePlainText(input: string) {
  if (!input) {
    return input;
  }

  const normalizedBase = normalizeMathContent(input);

  return plainTextReplacements.reduce((result, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    return result.replace(pattern, (...args) => {
      if (typeof replacement === "function") {
        return replacement(...args);
      }
      return replacement;
    });
  }, normalizedBase);
}

function sanitizeMathExpression(input: string) {
  return normalizeMathContent(input)
    .replace(/\u202f/g, " ")
    .trim();
}

export function MessageParser({ content, className = "" }: MessageParserProps) {
  const parseContent = () => {
    const parts: JSX.Element[] = [];
    let key = 0;

    // Combined regex to find images, HTML anchor tags with images, and math
    // Image pattern: @https://... or @http://...
    // HTML anchor pattern: <a href="(image-url)">...</a>
    // Math patterns: $$...$$ or $...$
    const combinedRegex =
      /@(https?:\/\/[^\s]+)|<a\s+href=["']([^"']+\.(png|jpg|jpeg|gif|webp|svg))["'][^>]*>[^<]*<\/a>|\$\$((?:\\.|[^$])+?)\$\$|\$((?:\\.|[^$])+?)\$/g;
    
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        const normalizedText = normalizePlainText(textBefore);
        if (normalizedText.trim()) {
          parts.push(<span key={`text-${key++}`}>{normalizedText}</span>);
        }
      }

      // Check what type of match we found
      if (match[1]) {
        // Image URL match (group 1 from @https://...)
        parts.push(
          <ImageDisplay key={`image-${key++}`} src={match[1]} />
        );
      } else if (match[2]) {
        // HTML anchor tag with image URL (group 2 from <a href="url">...</a>)
        parts.push(
          <ImageDisplay key={`image-${key++}`} src={match[2]} />
        );
      } else if (match[4] || match[5]) {
        // Math expression (block or inline)
        const mathContent = match[4] ?? match[5] ?? "";
        parts.push(
          <MathText key={`math-${key++}`} displayMode={Boolean(match[4])}>
            {sanitizeMathExpression(mathContent)}
          </MathText>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      const normalizedText = normalizePlainText(remainingText);
      if (normalizedText.trim()) {
        parts.push(<span key={`text-${key++}`}>{normalizedText}</span>);
      }
    }

    return parts.length > 0
      ? parts
      : [<span key="original">{normalizePlainText(content)}</span>];
  };

  return <div className={className}>{parseContent()}</div>;
}
