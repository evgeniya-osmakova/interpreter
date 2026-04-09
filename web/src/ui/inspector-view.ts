import type { MachineSnapshot } from "../runtime/worker-protocol";

export interface InspectorView {
  readonly element: HTMLElement;
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

export const renderInspectorView = (): InspectorView => {
  const element = document.createElement("section");
  element.className = "inspector";

  const summary = document.createElement("div");
  summary.className = "inspector__summary";

  const tape = document.createElement("div");
  tape.className = "tape-window";

  element.append(summary, tape);

  const render = (snapshot: MachineSnapshot | null): void => {
    if (snapshot === null) {
      summary.innerHTML = `
        <div class="metric"><span class="metric__label">PC</span><strong class="metric__value">0</strong></div>
        <div class="metric"><span class="metric__label">Pointer</span><strong class="metric__value">0</strong></div>
        <div class="metric"><span class="metric__label">Cell</span><strong class="metric__value">0</strong></div>
        <div class="metric"><span class="metric__label">Input</span><strong class="metric__value">0</strong></div>
        <div class="metric"><span class="metric__label">Output</span><strong class="metric__value">0</strong></div>
      `;
      tape.innerHTML = "";
      return;
    }

    summary.innerHTML = `
      <div class="metric"><span class="metric__label">PC</span><strong class="metric__value">${snapshot.pc}</strong></div>
      <div class="metric"><span class="metric__label">Pointer</span><strong class="metric__value">${snapshot.pointer}</strong></div>
      <div class="metric"><span class="metric__label">Cell</span><strong class="metric__value">${snapshot.currentCell}</strong></div>
      <div class="metric"><span class="metric__label">Input</span><strong class="metric__value">${snapshot.inputLength}</strong></div>
      <div class="metric"><span class="metric__label">Output</span><strong class="metric__value">${snapshot.outputLength}</strong></div>
    `;
    tape.innerHTML = renderTapeWindow(snapshot);
  };

  render(null);

  return {
    element,
    setSnapshot: render
  };
};
