import { useEffect, useRef, useState } from "react";
import { EMPLOYEE_GRID_ROWS, HEADER } from "../data";
import { STEPS } from "../steps";
import FormulaPanel from "./FormulaPanel";
import GridPanel from "./GridPanel";
import NarrationPanel from "./NarrationPanel";
import StepControls from "./StepControls";

const LAST_INDEX = STEPS.length - 1;

export default function Walkthrough() {
  const [current, setCurrent] = useState(0);
  const [clickedCell, setClickedCell] = useState<string | null>(null);
  const [wrongCells, setWrongCells] = useState<string[]>([]);
  const step = STEPS[current];
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const prevDisabled = current === 0;
  const canAdvance = !step.requireClick || clickedCell === step.requireClick.correctCellId;
  const nextDisabled = current === LAST_INDEX || !canAdvance;

  const goPrev = () => setCurrent((index) => Math.max(0, index - 1));
  const goNext = () => {
    if (canAdvance) setCurrent((index) => Math.min(LAST_INDEX, index + 1));
  };
  const goRestart = () => setCurrent(0);

  useEffect(() => {
    setClickedCell(null);
    setWrongCells([]);
  }, [current]);

  const handleCellClick = (cellId: string) => {
    if (!step.requireClick || clickedCell) return;
    if (cellId === step.requireClick.correctCellId) {
      setClickedCell(cellId);
    } else if (!wrongCells.includes(cellId)) {
      setWrongCells((cells) => [...cells, cellId]);
    }
  };

  const effectiveHighlights = { ...step.gridHighlights };
  for (const cellId of wrongCells) effectiveHighlights[cellId] = "checked";
  if (clickedCell) effectiveHighlights[clickedCell] = "match";

  // A disabled button drops focus to <body> the instant it becomes disabled.
  // At the first/last step that's exactly what happens to prev/next, so move
  // focus to whichever nav button is still enabled instead of losing it.
  // Guard on an actual change to `current` (not just "is this the first
  // effect firing") — StrictMode double-invokes mount effects in dev with
  // the same value, and a naive "ran once already" flag doesn't survive
  // that, letting the second invocation steal focus from a fresh page load.
  const lastHandledRef = useRef(current);
  useEffect(() => {
    if (lastHandledRef.current === current) return;
    lastHandledRef.current = current;
    if (document.activeElement !== document.body) return;
    if (current === 0) {
      nextRef.current?.focus();
    } else if (current === LAST_INDEX) {
      prevRef.current?.focus();
    }
  }, [current]);

  // goNext reads `canAdvance`, which changes across renders, so the handler
  // is kept in a ref rather than re-subscribing the listener every render.
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const active = document.activeElement;
      if (active?.closest(".grid-scroll")) return;

      if (event.key === "ArrowRight") {
        goNextRef.current();
      } else if (event.key === "ArrowLeft") {
        setCurrent((index) => Math.max(0, index - 1));
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="walkthrough">
      <FormulaPanel
        key={`formula-${current}`}
        activeArgs={step.activeArgs}
        result={step.result}
        resultState={step.resultState}
      />
      <NarrationPanel
        key={`narration-${current}`}
        progress={step.progress}
        title={step.title}
        copy={step.copy}
      />
      <StepControls
        onPrev={goPrev}
        onNext={goNext}
        onRestart={goRestart}
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        prevRef={prevRef}
        nextRef={nextRef}
      />
      <GridPanel
        header={HEADER}
        rows={EMPLOYEE_GRID_ROWS}
        ariaLabel="Employee table"
        highlights={effectiveHighlights}
        colBadges={step.colBadges}
        dimHeaderRow={step.dimHeaderRow}
        onCellClick={step.requireClick && !clickedCell ? handleCellClick : undefined}
        feedback={
          step.requireClick
            ? clickedCell
              ? "Correct — that's the matching cell."
              : wrongCells.length > 0
                ? "Not a match — keep scanning column A."
                : undefined
            : undefined
        }
      />
    </div>
  );
}
