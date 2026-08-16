import DefinitionSection from "./components/DefinitionSection";
import PracticeEditor from "./components/PracticeEditor";
import Walkthrough from "./components/Walkthrough";

export default function App() {
  return (
    <>
      <div className="top-row">
        <DefinitionSection />
        <div id="walkthrough-root">
          <section aria-labelledby="walkthrough-heading">
            <h2 id="walkthrough-heading">Guided walkthrough</h2>
            <Walkthrough />
          </section>
        </div>
      </div>
      <section className="practice-section" aria-labelledby="practice-heading">
        <h2 id="practice-heading">Practice: build your own formula</h2>
        <p className="practice-intro">
          Now try it yourself on a different table — an orders sheet, not the employee table
          above — using the same VLOOKUP idea.
        </p>
        <PracticeEditor />
      </section>
    </>
  );
}
