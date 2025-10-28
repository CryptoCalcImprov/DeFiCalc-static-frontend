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
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"');
}

export function MessageParser({ content, className = "" }: MessageParserProps) {
  const parseContent = () => {
    const parts: JSX.Element[] = [];
    let key = 0;

    // Combined regex to find images, HTML anchor tags with images, and math
    // Image pattern: @https://... or @http://...
    // HTML anchor pattern: <a href="(image-url)">...</a>
    // Math patterns: $$...$$ or $...$
    const combinedRegex = /@(https?:\/\/[^\s]+)|<a\s+href=["']([^"']+\.(png|jpg|jpeg|gif|webp|svg))["'][^>]*>[^<]*<\/a>|\$\$([^\$]+)\$\$|\$([^\$]+)\$/g;
    
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(<span key={`text-${key++}`}>{textBefore}</span>);
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
      } else if (match[4]) {
        // Block math (group 4 from $$...$$)
        parts.push(
          <MathText key={`math-${key++}`} displayMode={true}>
            {normalizeMathContent(match[4].trim())}
          </MathText>
        );
      } else if (match[5]) {
        // Inline math (group 5 from $...$)
        parts.push(
          <MathText key={`math-${key++}`} displayMode={false}>
            {normalizeMathContent(match[5].trim())}
          </MathText>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push(<span key={`text-${key++}`}>{remainingText}</span>);
      }
    }

    return parts.length > 0 ? parts : [<span key="original">{content}</span>];
  };

  return <div className={className}>{parseContent()}</div>;
}
