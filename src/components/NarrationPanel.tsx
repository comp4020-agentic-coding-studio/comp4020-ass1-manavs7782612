import type { ReactNode } from "react";

interface NarrationPanelProps {
  progress: string;
  title: string;
  copy: string;
}

// Splits on `backtick` spans so step copy can mark up an inline code term
// (e.g. a value like 106) without resorting to dangerouslySetInnerHTML.
function renderCopy(copy: string): ReactNode[] {
  return copy.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function NarrationPanel({ progress, title, copy }: NarrationPanelProps) {
  return (
    <section className="narration-panel" aria-live="polite" aria-atomic="true">
      <p className="narration-progress">{progress}</p>
      <h2>{title}</h2>
      <p>{renderCopy(copy)}</p>
    </section>
  );
}
