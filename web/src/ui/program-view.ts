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

  const cursorSection = document.createElement("section");
  cursorSection.className = "execution-subsection";

  const cursorHeading = document.createElement("h3");
  cursorHeading.className = "control-field__label";
  cursorHeading.textContent = "Instruction cursor";

  const cursorDescription = document.createElement("p");
  cursorDescription.className = "control-field__description";
  cursorDescription.textContent =
    "This stream shows executable Brainfuck instructions only. The highlighted character is the current instruction pointer.";

  const meta = document.createElement("p");
  meta.className = "program-visualizer__meta";

  const code = document.createElement("pre");
  code.className = "program-visualizer__code";

  cursorSection.append(cursorHeading, cursorDescription, meta, code);

  const tapeSection = document.createElement("section");
  tapeSection.className = "execution-subsection";

  const tapeHeading = document.createElement("h3");
  tapeHeading.className = "control-field__label";
  tapeHeading.textContent = "Tape near the pointer";

  const tapeDescription = document.createElement("p");
  tapeDescription.className = "control-field__description";
  tapeDescription.textContent =
    "This moving window shows the cells around the current pointer. The highlighted cell is the one the current instruction reads or writes.";

  const tape = document.createElement("div");
  tape.className = "tape-window";

  tapeSection.append(tapeHeading, tapeDescription, tape);

  let instructions: ReturnType<typeof scanInstructions> = [];
  let tokenNodes: HTMLSpanElement[] = [];
  let source = "";
  let currentPc: number | null = null;
  let currentSnapshot: MachineSnapshot | null = null;
  let renderedPc: number | null = null;

  const updateTape = (): void => {
    tape.innerHTML = renderTapeWindow(currentSnapshot);
  };

  const updateMeta = (): void => {
    meta.textContent =
      instructions.length === 0
        ? "No executable instructions yet."
        : currentPc === null
          ? `${instructions.length} executable instructions`
          : `PC ${Math.min(currentPc, instructions.length)} / ${instructions.length}`;
  };

  const applyFullProgramCounterState = (): void => {
    tokenNodes.forEach((token, index) => {
      token.classList.toggle("program-visualizer__char--past", currentPc !== null && index < currentPc);
      token.classList.toggle(
        "program-visualizer__char--current",
        currentPc !== null && currentPc < instructions.length && index === currentPc
      );
    });
    renderedPc = currentPc;
  };

  const updateProgramCounter = (): void => {
    updateMeta();

    if (instructions.length === 0 || tokenNodes.length === 0) {
      renderedPc = currentPc;
      return;
    }

    if (renderedPc === currentPc) {
      return;
    }

    if (
      renderedPc !== null &&
      currentPc !== null &&
      currentPc === renderedPc + 1 &&
      renderedPc < tokenNodes.length
    ) {
      tokenNodes[renderedPc]?.classList.remove("program-visualizer__char--current");
      tokenNodes[renderedPc]?.classList.add("program-visualizer__char--past");

      if (currentPc < tokenNodes.length) {
        tokenNodes[currentPc]?.classList.add("program-visualizer__char--current");
      }

      renderedPc = currentPc;
      return;
    }

    applyFullProgramCounterState();
  };

  const rebuildCode = (): void => {
    instructions = scanInstructions(source);
    tokenNodes = [];
    code.replaceChildren();

    if (instructions.length === 0) {
      code.textContent = "Add Brainfuck code to see the execution stream.";
      renderedPc = null;
      updateProgramCounter();
      return;
    }

    instructions.forEach((instruction, index) => {
      const token = document.createElement("span");
      token.className = "program-visualizer__char";
      token.textContent = instruction.char;
      tokenNodes[index] = token;
      code.append(token);
    });

    applyFullProgramCounterState();
  };

  element.append(heading, cursorSection, tapeSection);
  rebuildCode();
  updateTape();

  return {
    element,
    setSource(nextSource) {
      source = nextSource;
      rebuildCode();
    },
    setProgramCounter(nextPc) {
      currentPc = nextPc;
      updateProgramCounter();
    },
    setSnapshot(snapshot) {
      currentSnapshot = snapshot;
      updateTape();
    }
  };
};
