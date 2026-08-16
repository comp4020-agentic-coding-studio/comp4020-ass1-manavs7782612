import type { RefObject } from "react";

interface StepControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  prevRef: RefObject<HTMLButtonElement | null>;
  nextRef: RefObject<HTMLButtonElement | null>;
}

export default function StepControls({
  onPrev,
  onNext,
  onRestart,
  prevDisabled,
  nextDisabled,
  prevRef,
  nextRef,
}: StepControlsProps) {
  return (
    <section className="step-controls" aria-label="Walkthrough controls">
      <button type="button" ref={prevRef} onClick={onPrev} disabled={prevDisabled}>
        ← Previous
      </button>
      <button type="button" className="primary" ref={nextRef} onClick={onNext} disabled={nextDisabled}>
        Next →
      </button>
      <button type="button" onClick={onRestart}>
        Restart
      </button>
    </section>
  );
}
