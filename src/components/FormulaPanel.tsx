import type { FormulaArg, ResultState } from "../steps";

interface FormulaPanelProps {
  activeArgs: FormulaArg[];
  result: string;
  resultState: ResultState;
}

function arg(name: FormulaArg, text: string, activeArgs: FormulaArg[]) {
  return (
    <span className="formula-arg" data-arg={name} data-active={activeArgs.includes(name)}>
      {text}
    </span>
  );
}

export default function FormulaPanel({ activeArgs, result, resultState }: FormulaPanelProps) {
  return (
    <section className="formula-panel" aria-label="Formula">
      <p className="formula">
        <span className="formula-fn">=VLOOKUP(</span>
        {arg("lookup-value", "104", activeArgs)}
        <span>, </span>
        {arg("table-array", "A2:D6", activeArgs)}
        <span>, </span>
        {arg("col-index", "3", activeArgs)}
        <span>, </span>
        {arg("range-lookup", "FALSE", activeArgs)}
        <span className="formula-fn">)</span>
      </p>
      <p className={resultState === "error" ? "formula-result formula-result-error" : "formula-result"}>
        Result: <span>{result || "—"}</span>
      </p>
    </section>
  );
}
