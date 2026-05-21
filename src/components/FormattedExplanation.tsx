import React from "react";

/**
 * Lightweight markdown-ish renderer specialized for AI explanations.
 * Supports:
 *  - **bold** spans
 *  - Section headings: a whole line wrapped in ** ** (rendered as a colored title with extra spacing)
 *  - Bullets starting with "- ", "* " or "• "
 *  - Numbered items starting with "1." "2)" etc.
 *  - Blank lines preserved as visual breaks
 */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={`b-${i++}`} className="font-semibold text-foreground">{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface Props {
  text: string;
  className?: string;
}

function sanitizeAiText(input: string): string {
  if (!input) return "";
  let s = input;
  // Remove LaTeX delimiters left over from the AI
  s = s.replace(/\\\(|\\\)|\\\[|\\\]/g, "");
  s = s.replace(/\${1,2}/g, "");
  // Strip pseudo XML tags like <eq>, <math>, <br>, </p>, and garbage runs like <>, <><>, <<>>
  s = s.replace(/<\/?(eq|math|br|p|span|div|tex|latex)\b[^>]*>/gi, "");
  s = s.replace(/<+\s*>+/g, "");        // <>, <<>>, < >
  s = s.replace(/[<>]{2,}/g, "");       // >>>, <<<, ><>
  // Collapse leftover stray angle brackets that aren't part of math (e.g. "x <> y" → "x  y")
  s = s.replace(/\s<>\s/g, " ");
  return s;
}

export function FormattedExplanation({ text, className = "" }: Props) {
  const lines = sanitizeAiText(text).replace(/\r\n/g, "\n").split("\n");

  type Block =
    | { kind: "heading"; text: string }
    | { kind: "paragraph"; text: string }
    | { kind: "list"; ordered: boolean; items: string[] }
    | { kind: "spacer" };

  const blocks: Block[] = [];
  let currentList: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      blocks.push({ kind: "list", ordered: currentList.ordered, items: currentList.items });
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      blocks.push({ kind: "spacer" });
      continue;
    }

    // Whole-line heading: **text** or **text**:
    const headingMatch = line.match(/^\*\*(.+?)\*\*:?$/);
    if (headingMatch) {
      flushList();
      blocks.push({ kind: "heading", text: headingMatch[1] });
      continue;
    }

    // Bullet
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.ordered) {
        flushList();
        currentList = { ordered: false, items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered
    const numMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      if (!currentList || !currentList.ordered) {
        flushList();
        currentList = { ordered: true, items: [] };
      }
      currentList.items.push(numMatch[2]);
      continue;
    }

    flushList();
    blocks.push({ kind: "paragraph", text: line });
  }
  flushList();

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((b, idx) => {
        if (b.kind === "spacer") return <div key={idx} className="h-1" />;
        if (b.kind === "heading") {
          return (
            <h4
              key={idx}
              className="font-display font-bold text-base md:text-lg text-section-steps mt-3 first:mt-0 leading-snug"
            >
              {renderInline(b.text)}
            </h4>
          );
        }
        if (b.kind === "paragraph") {
          return (
            <p key={idx} className="leading-relaxed text-foreground/90 text-sm md:text-base">
              {renderInline(b.text)}
            </p>
          );
        }
        // list
        const ListTag = b.ordered ? "ol" : "ul";
        return (
          <ListTag
            key={idx}
            className={`${b.ordered ? "list-decimal" : "list-disc"} pl-5 space-y-1.5 marker:text-section-steps`}
          >
            {b.items.map((item, i) => (
              <li key={i} className="leading-relaxed text-foreground/90 text-sm md:text-base pl-1">
                {renderInline(item)}
              </li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}
