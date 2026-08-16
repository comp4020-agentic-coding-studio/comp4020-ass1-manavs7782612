import { columnLetter } from "../vlookup";

interface GridPanelProps {
  header: readonly string[];
  rows: readonly string[][];
  highlights: Record<string, string>;
  colBadges?: Record<string, number>;
  dimHeaderRow?: boolean;
  ariaLabel?: string;
  onCellClick?: (cellId: string) => void;
  feedback?: string;
}

export default function GridPanel({
  header,
  rows,
  highlights,
  colBadges,
  dimHeaderRow,
  ariaLabel = "Data table",
  onCellClick,
  feedback,
}: GridPanelProps) {
  const columnLetters = header.map((_, index) => columnLetter(index));

  return (
    <section className="grid-panel" aria-label={ariaLabel}>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/prefer-tag-over-role -- tabIndex/role="group" implement the WAI-ARIA scrollable-region pattern so keyboard users can reach the horizontal scroll at narrow widths; no semantic HTML tag covers that. */}
      <div className="grid-scroll" tabIndex={0} role="group" aria-label={`${ariaLabel}, scrollable`}>
        <table>
          <thead>
            <tr aria-hidden="true" className="grid-letters">
              <th aria-label="Row number column" />
              {columnLetters.map((col) => (
                <th key={col}>
                  {col}
                  {colBadges?.[col] !== undefined && (
                    <span className="col-badge">{colBadges[col]}</span>
                  )}
                </th>
              ))}
            </tr>
            <tr className={dimHeaderRow ? "grid-header grid-header-dim" : "grid-header"}>
              <th scope="col" aria-hidden="true">
                1
              </th>
              {header.map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowNumber = rowIndex + 2;
              return (
                <tr key={rowNumber}>
                  <th scope="row" aria-hidden="true">
                    {rowNumber}
                  </th>
                  {columnLetters.map((col, colIndex) => {
                    const cellId = `${col}${rowNumber}`;
                    const state = highlights[cellId];
                    const value = row[colIndex];
                    return (
                      <td key={cellId} data-col={col} data-row={rowNumber} data-state={state}>
                        {onCellClick ? (
                          <button type="button" className="cell-button" onClick={() => onCellClick(cellId)}>
                            {value}
                          </button>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {feedback && (
        <p className="grid-feedback" aria-live="polite">
          {feedback}
        </p>
      )}
    </section>
  );
}
