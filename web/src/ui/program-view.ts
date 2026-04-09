import { scanInstructions } from "../brainfuck/program/parse";
import type { MachineSnapshot } from "../runtime/worker-protocol";

export interface ProgramView {
  readonly element: HTMLElement;
  setSource: (source: string) => void;
  setProgramCounter: (pc: number | null) => void;
  setSnapshot: (snapshot: MachineSnapshot | null) => void;
}

const renderTapeWindow = (snapshot: MachineSnapshot | null): string => {
  if (snapshot === null) {
    return "";
  }

  return snapshot.tapeWindow
    .map(
      (cell) =>
        `<div class="tape-cell${cell.isPointer ? " tape-cell--pointer" : ""}">
          <span class="tape-cell__index">${cell.index}</span>
          <span class="tape-cell__value">${cell.value}</span>
        </div>`
    )
    .join("");
};

export const renderProgramView = (): ProgramView => {
  const element = document.createElement("section");
  element.className = "program-visualizer";

  const heading = document.createElement("h2");
  heading.className = "panel-title";
  heading.textContent = "Execution view";

  const description = document.createElement("p");
  description.className = "panel-description";
  description.textContent =
    "The visualizer shows executable Brainfuck instructions only. The highlighted character is the current instruction pointer.";

  const meta = document.createElement("p");
  meta.className = "program-visualizer__meta";

  const code = document.createElement("pre");
  code.className = "program-visualizer__code";

  const tapeHeading = document.createElement("h3");
  tapeHeading.className = "panel-title panel-title--subsection";
  tapeHeading.textContent = "Tape near the pointer";

  const tapeDescription = document.createElement("p");
  tapeDescription.className = "panel-description";
  tapeDescription.textContent =
    "This moving window shows the cells around the current pointer. The highlighted cell is the one the current instruction reads or writes.";

  const tape = document.createElement("div");
  tape.className = "tape-window";

  let source = "";
  let currentPc: number | null = null;
  let currentSnapshot: MachineSnapshot | null = null;

  const render = (): void => {
    const instructions = scanInstructions(source);
    tape.innerHTML = renderTapeWindow(currentSnapshot);

    meta.textContent =
      instructions.length === 0
        ? "No executable instructions yet."
        : currentPc === null
          ? `${instructions.length} executable instructions`
          : `PC ${Math.min(currentPc, instructions.length)} / ${instructions.length}`;

    code.replaceChildren();

    if (instructions.length === 0) {
      code.textContent = "Add Brainfuck code to see the execution stream.";
      return;
    }

    instructions.forEach((instruction, index) => {
      const token = document.createElement("span");
      token.className = "program-visualizer__char";
      token.textContent = instruction.char;

      if (currentPc !== null) {
        if (index < currentPc) {
          token.classList.add("program-visualizer__char--past");
        }

        if (index === currentPc && currentPc < instructions.length) {
          token.classList.add("program-visualizer__char--current");
        }
      }

      code.append(token);
    });
  };

  element.append(heading, description, meta, code, tapeHeading, tapeDescription, tape);
  render();

  return {
    element,
    setSource(nextSource) {
      source = nextSource;
      render();
    },
    setProgramCounter(nextPc) {
      currentPc = nextPc;
      render();
    },
    setSnapshot(snapshot) {
      currentSnapshot = snapshot;
      render();
    }
  };
};
