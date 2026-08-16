import { useEffect, useState } from "react";
import { PRACTICE_CHALLENGES, checkChallenge } from "../practice-challenges";
import { PRACTICE_GRID_ROWS, PRACTICE_HEADER } from "../practice-data";
import { columnIndexFromLetter, columnLetter, evaluateVlookup, formatRange, parseRange } from "../vlookup";
import GridPanel from "./GridPanel";

type RangeMode = "idle" | "pick-start" | "pick-end";

const CELL_ID_PATTERN = /^([A-Za-z]+)(\d+)$/;

function cellIdParts(cellId: string): { col: number; row: number } {
  const match = CELL_ID_PATTERN.exec(cellId);
  return {
    col: columnIndexFromLetter(match?.[1] ?? "A"),
    row: Number.parseInt(match?.[2] ?? "2", 10),
  };
}

const INITIAL_COL_INDEX = 3;

export default function PracticeEditor() {
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [rangeMode, setRangeMode] = useState<RangeMode>("idle");
  const [lookupInput, setLookupInput] = useState("");
  const [colIndex, setColIndex] = useState(INITIAL_COL_INDEX);
  const [rangeLookup, setRangeLookup] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const rangeRef =
    rangeStart && rangeEnd
      ? (() => {
          const a = cellIdParts(rangeStart);
          const b = cellIdParts(rangeEnd);
          return formatRange({
            startCol: Math.min(a.col, b.col),
            endCol: Math.max(a.col, b.col),
            startRow: Math.min(a.row, b.row),
            endRow: Math.max(a.row, b.row),
          });
        })()
      : null;

  const parsedRange = rangeRef ? parseRange(rangeRef) : null;
  const keyCol = parsedRange?.startCol ?? 0;

  const outcome =
    rangeRef && lookupInput.trim() !== ""
      ? evaluateVlookup({ rows: PRACTICE_GRID_ROWS }, lookupInput, rangeRef, colIndex, rangeLookup)
      : null;

  const currentChallenge = PRACTICE_CHALLENGES[challengeIndex];
  const isLastChallenge = challengeIndex === PRACTICE_CHALLENGES.length - 1;
  const checkResult = currentChallenge ? checkChallenge(currentChallenge, outcome) : null;

  // Stale "Correct"/"Not quite" text (and a confirmed pass) shouldn't linger
  // once the learner has changed the very inputs it was judging.
  useEffect(() => {
    setFeedback(null);
    setConfirmed(false);
  }, [rangeRef, lookupInput, colIndex, rangeLookup, challengeIndex]);

  function handleCellClick(cellId: string) {
    if (rangeMode === "pick-start") {
      setRangeStart(cellId);
      setRangeEnd(null);
      setRangeMode("pick-end");
      return;
    }
    if (rangeMode === "pick-end") {
      setRangeEnd(cellId);
      setRangeMode("idle");
      return;
    }
    const { col, row } = cellIdParts(cellId);
    if (col !== keyCol) return;
    const value = PRACTICE_GRID_ROWS[row - 2]?.[col];
    if (value !== undefined) setLookupInput(value);
  }

  function handleSelectRange() {
    setRangeMode("pick-start");
    setRangeStart(null);
    setRangeEnd(null);
  }

  function handleWholeTable() {
    setRangeStart("A2");
    setRangeEnd("E7");
    setRangeMode("idle");
  }

  function handleCheck() {
    setFeedback(checkResult?.message ?? null);
    setConfirmed(checkResult?.pass ?? false);
  }

  function handleNextChallenge() {
    setChallengeIndex((index) => index + 1);
    setFeedback(null);
    setConfirmed(false);
  }

  function handleRestart() {
    setRangeStart(null);
    setRangeEnd(null);
    setRangeMode("idle");
    setLookupInput("");
    setColIndex(INITIAL_COL_INDEX);
    setRangeLookup(false);
    setChallengeIndex(0);
    setFeedback(null);
    setConfirmed(false);
  }

  const highlights: Record<string, string> = {};
  if (parsedRange) {
    for (let col = parsedRange.startCol; col <= parsedRange.endCol; col++) {
      for (let row = parsedRange.startRow; row <= parsedRange.endRow; row++) {
        highlights[`${columnLetter(col)}${row}`] = "range";
      }
    }
  }
  if (lookupInput.trim() !== "") {
    const rowIndex = PRACTICE_GRID_ROWS.findIndex((row) => row[keyCol] === lookupInput);
    if (rowIndex !== -1) {
      highlights[`${columnLetter(keyCol)}${rowIndex + 2}`] = "target";
    }
  }

  const gridFeedback =
    rangeMode === "pick-start"
      ? "Click the top-left corner of your range."
      : rangeMode === "pick-end"
        ? "Now click the bottom-right corner of your range."
        : undefined;

  return (
    <div className="practice-editor">
      <div className="practice-controls">
        <fieldset className="practice-field">
          <legend>Table range</legend>
          <div className="practice-field-row">
            <button type="button" onClick={handleSelectRange}>
              Select table range
            </button>
            <button type="button" onClick={handleWholeTable}>
              Use whole table (A2:E7)
            </button>
          </div>
          <p className="practice-hint">
            Range: <code>{rangeRef ?? "not set"}</code>
          </p>
        </fieldset>

        <fieldset className="practice-field">
          <legend>Lookup value</legend>
          <label htmlFor="practice-lookup-input">
            Type a value, or click a cell in column {columnLetter(keyCol)}
          </label>
          <input
            id="practice-lookup-input"
            type="text"
            value={lookupInput}
            onChange={(event) => setLookupInput(event.target.value)}
          />
        </fieldset>

        <fieldset className="practice-field">
          <legend>Column index</legend>
          <label htmlFor="practice-col-index">Which column to return, counting from 1</label>
          <input
            id="practice-col-index"
            type="number"
            value={colIndex}
            onChange={(event) => setColIndex(Number(event.target.value))}
          />
        </fieldset>

        <fieldset className="practice-field">
          <legend>Range lookup</legend>
          <p className="practice-hint">FALSE for exact match, TRUE for closest match ≤ it</p>
          <div className="toggle-group">
            <button
              type="button"
              className="toggle-btn"
              aria-pressed={rangeLookup === false}
              onClick={() => setRangeLookup(false)}
            >
              FALSE
            </button>
            <button
              type="button"
              className="toggle-btn"
              aria-pressed={rangeLookup === true}
              onClick={() => setRangeLookup(true)}
            >
              TRUE
            </button>
          </div>
        </fieldset>
      </div>

      {currentChallenge && (
        <section className="narration-panel practice-challenge" aria-live="polite">
          <p className="narration-progress">
            Challenge {challengeIndex + 1} of {PRACTICE_CHALLENGES.length}
          </p>
          <h3>{currentChallenge.title}</h3>
          <p>{currentChallenge.prompt}</p>
          <p className="practice-hint">Hint: {currentChallenge.hint}</p>
          {feedback && (
            <output
              className={
                checkResult?.pass
                  ? "answer-feedback answer-feedback-pass"
                  : checkResult
                    ? "answer-feedback answer-feedback-fail"
                    : "answer-feedback"
              }
            >
              {feedback}
            </output>
          )}
          <div className="step-controls">
            <button type="button" className={confirmed ? undefined : "primary"} onClick={handleCheck}>
              Check answer
            </button>
            <button
              type="button"
              className={confirmed ? "primary" : undefined}
              onClick={isLastChallenge ? handleRestart : handleNextChallenge}
              disabled={!confirmed}
            >
              {isLastChallenge ? "Restart challenges" : "Next challenge →"}
            </button>
          </div>
        </section>
      )}

      <section className="formula-panel practice-formula" aria-label="Your formula">
        <p className="formula">
          <span className="formula-fn">=VLOOKUP(</span>
          <span className="formula-arg" data-arg="lookup-value" data-active="true">
            {lookupInput || "?"}
          </span>
          <span>, </span>
          <span className="formula-arg" data-arg="table-array" data-active="true">
            {rangeRef ?? "?"}
          </span>
          <span>, </span>
          <span className="formula-arg" data-arg="col-index" data-active="true">
            {colIndex}
          </span>
          <span>, </span>
          <span className="formula-arg" data-arg="range-lookup" data-active="true">
            {rangeLookup ? "TRUE" : "FALSE"}
          </span>
          <span className="formula-fn">)</span>
        </p>
        <p className={outcome && !outcome.ok ? "formula-result formula-result-error" : "formula-result"}>
          Result: <span>{outcome ? (outcome.ok ? outcome.value : outcome.error) : "—"}</span>
        </p>
      </section>

      <GridPanel
        header={PRACTICE_HEADER}
        rows={PRACTICE_GRID_ROWS}
        ariaLabel="Orders table"
        highlights={highlights}
        onCellClick={handleCellClick}
        feedback={gridFeedback}
      />
    </div>
  );
}
