export default function DefinitionSection() {
  return (
    <div className="definition-wrapper">
      <h2 id="definition-heading">What is VLOOKUP?</h2>
      <section className="definition-section" aria-labelledby="definition-heading">
        <p>
          VLOOKUP ("vertical lookup") finds a value in the first column of a table and returns a
          value from another column in that same row — like looking up a name in an index and
          reading across to the page number.
        </p>
        <pre className="syntax-box">
          <code>=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])</code>
        </pre>
        <p className="why-it-matters">
          It's the fastest way to pull a related value out of a table without scanning row by row
          by eye.
        </p>
      </section>
    </div>
  );
}
