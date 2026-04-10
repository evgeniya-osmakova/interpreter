import { scanInstructions } from "../brainfuck/program/parse";
import type { MachineSnapshot } from "../runtime/worker-protocol";

const INSTRUCTION_WINDOW_RADIUS = 480;
const INSTRUCTION_WINDOW_SIZE = INSTRUCTION_WINDOW_RADIUS * 2 + 1;

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
  let renderedStartIndex = 0;
  let renderedEndIndex = -1;

  const updateTape = (): void => {
    tape.innerHTML = renderTapeWindow(currentSnapshot);
  };

  const getWindowBounds = (): { start: number; end: number } => {
    if (instructions.length === 0) {
      return { start: 0, end: -1 };
    }

    if (instructions.length <= INSTRUCTION_WINDOW_SIZE) {
      return { start: 0, end: instructions.length - 1 };
    }

    const focusIndex =
      currentPc === null
        ? 0
        : Math.min(currentPc, instructions.length - 1);

    const maxStart = instructions.length - INSTRUCTION_WINDOW_SIZE;
    const start = Math.max(0, Math.min(focusIndex - INSTRUCTION_WINDOW_RADIUS, maxStart));
    const end = Math.min(start + INSTRUCTION_WINDOW_SIZE - 1, instructions.length - 1);
    return { start, end };
  };

  const updateMeta = (): void => {
    if (instructions.length === 0) {
      meta.textContent = "No executable instructions yet.";
      return;
    }

    const positionText =
      currentPc === null
        ? `${instructions.length} executable instructions`
        : `PC ${Math.min(currentPc, instructions.length)} / ${instructions.length}`;

    if (renderedEndIndex < renderedStartIndex) {
      meta.textContent = positionText;
      return;
    }

    meta.textContent = `${positionText} · showing ${renderedStartIndex + 1}-${renderedEndIndex + 1}`;
  };

  const applyFullProgramCounterState = (): void => {
    tokenNodes.forEach((token, offset) => {
      const absoluteIndex = renderedStartIndex + offset;
      token.classList.toggle(
        "program-visualizer__char--past",
        currentPc !== null && absoluteIndex < currentPc
      );
      token.classList.toggle(
        "program-visualizer__char--current",
        currentPc !== null && currentPc < instructions.length && absoluteIndex === currentPc
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

    const nextWindow = getWindowBounds();
    if (nextWindow.start !== renderedStartIndex || nextWindow.end !== renderedEndIndex) {
      renderInstructionWindow();
      return;
    }

    if (renderedPc === currentPc) {
      return;
    }

    if (
      renderedPc !== null &&
      currentPc !== null &&
      currentPc === renderedPc + 1 &&
      renderedPc >= renderedStartIndex &&
      renderedPc <= renderedEndIndex
    ) {
      const previousOffset = renderedPc - renderedStartIndex;
      tokenNodes[previousOffset]?.classList.remove("program-visualizer__char--current");
      tokenNodes[previousOffset]?.classList.add("program-visualizer__char--past");

      if (currentPc >= renderedStartIndex && currentPc <= renderedEndIndex) {
        const currentOffset = currentPc - renderedStartIndex;
        tokenNodes[currentOffset]?.classList.add("program-visualizer__char--current");
      }

      renderedPc = currentPc;
      updateMeta();
      return;
    }

    applyFullProgramCounterState();
    updateMeta();
  };

  const renderInstructionWindow = (): void => {
    tokenNodes = [];
    code.replaceChildren();

    if (instructions.length === 0) {
      code.textContent = "Add Brainfuck code to see the execution stream.";
      renderedStartIndex = 0;
      renderedEndIndex = -1;
      renderedPc = null;
      updateProgramCounter();
      return;
    }

    const { start, end } = getWindowBounds();
    renderedStartIndex = start;
    renderedEndIndex = end;

    for (let index = start; index <= end; index += 1) {
      const instruction = instructions[index];
      if (instruction === undefined) {
        continue;
      }

      const token = document.createElement("span");
      token.className = "program-visualizer__char";
      token.textContent = instruction.char;
      tokenNodes.push(token);
      code.append(token);
    }

    applyFullProgramCounterState();
    updateMeta();
  };

  const rebuildCode = (): void => {
    instructions = scanInstructions(source);
    renderInstructionWindow();
  };

  element.append(heading, cursorSection, tapeSection);
  rebuildCode();
  updateTape();

  return {
    element,
    setSource(nextSource) {
      if (nextSource === source) {
        return;
      }
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
