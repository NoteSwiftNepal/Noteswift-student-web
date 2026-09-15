import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

// Renders mixed plain-text + LaTeX via KaTeX directly in the DOM — no
// WebView/sandbox layer (that complexity in mobile's Test/components/
// MathView.tsx exists only to bridge RN's native/JS boundary; it doesn't
// apply on web, see blueprint §4/§9). Matches the same delimiters mobile's
// MathText.tsx recognizes: $...$, $$...$$, \(...\), \[...\].
//
// Deliberately does NOT port MathText.tsx's ~400-line hand-rolled LaTeX
// -> Unicode approximation engine — that exists purely to avoid mobile's
// WebView render cost for "simple" formulas, a tradeoff that doesn't exist
// here (KaTeX in the DOM is cheap). Every hasLatex segment here renders
// through real KaTeX instead of two divergent rendering paths.

type Segment =
  | { type: "text"; content: string }
  | { type: "math"; content: string; display: boolean };

const DELIMITER_RE = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$([^\$\n]+?)\$/g;

function splitSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  DELIMITER_RE.lastIndex = 0;
  while ((match = DELIMITER_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const [, blockDollar, blockBracket, inlineParen, inlineDollar] = match;
    if (blockDollar !== undefined) {
      segments.push({ type: "math", content: blockDollar, display: true });
    } else if (blockBracket !== undefined) {
      segments.push({ type: "math", content: blockBracket, display: true });
    } else if (inlineParen !== undefined) {
      segments.push({ type: "math", content: inlineParen, display: false });
    } else if (inlineDollar !== undefined) {
      segments.push({ type: "math", content: inlineDollar, display: false });
    }
    lastIndex = DELIMITER_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

function renderMath(content: string, display: boolean): string {
  try {
    return katex.renderToString(content, {
      displayMode: display,
      throwOnError: false,
      errorColor: "#dc2626",
    });
  } catch {
    return content;
  }
}

export function LatexText({
  content,
  hasLatex = false,
  className,
}: {
  content?: string | null;
  hasLatex?: boolean;
  className?: string;
}) {
  const text = content ?? "";

  if (!hasLatex) {
    return <span className={className}>{text}</span>;
  }

  const segments = splitSegments(text);

  return (
    <span className={className}>
      {segments.map((segment, i) =>
        segment.type === "text" ? (
          <span key={i}>{segment.content}</span>
        ) : (
          <span
            key={i}
            className={segment.display ? "block my-1" : undefined}
            dangerouslySetInnerHTML={{ __html: renderMath(segment.content, segment.display) }}
          />
        )
      )}
    </span>
  );
}

// Kept as the previously-established name for this component so existing
// intended call sites don't need to change.
export function LatexPreview({
  content,
  enabled = true,
  className,
}: {
  content: string;
  enabled?: boolean;
  inline?: boolean;
  className?: string;
}) {
  return <LatexText content={content} hasLatex={enabled} className={cn(className)} />;
}
