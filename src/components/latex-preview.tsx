"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window { MathJax: any }
}

export function LatexPreview({ 
  content, 
  enabled = true,
  inline = false,
  className = ""
}: { 
  content: string; 
  enabled?: boolean;
  inline?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const ensureMathJax = () => {
      if (typeof window === 'undefined') return Promise.resolve();
      if (window.MathJax) return Promise.resolve();
      return new Promise<void>((resolve) => {
        // Define MathJax configuration BEFORE loading the script
        window.MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            processEscapes: true
          },
          options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
          },
          startup: {
            ready: () => {
              window.MathJax.startup.defaultReady();
              resolve();
            }
          }
        };

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.async = true;
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    };

    ensureMathJax().then(() => {
      if (window.MathJax && containerRef.current) {
        window.MathJax.typesetClear?.([containerRef.current]);
        window.MathJax.typesetPromise?.([containerRef.current]);
      }
    });
  }, [content, enabled]);

  if (!enabled) {
    if (inline) {
      return <span className={className}>{content}</span>;
    }
    return <div className={className}>{content}</div>;
  }

  if (inline) {
    return (
      <span className={className} ref={containerRef as any}>
        {content}
      </span>
    );
  }

  return (
    <div className={`prose max-w-none border rounded p-3 bg-muted/30 ${className}`} ref={containerRef as any}>
      {content}
    </div>
  );
}
