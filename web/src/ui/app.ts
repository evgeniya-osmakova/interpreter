import type { Cell } from "../brainfuck/core/cell";
import { makeCell } from "../brainfuck/core/cell";
import type { MachineSnapshot, WorkerEvent, WorkerRequest } from "../runtime/worker-protocol";
import { renderControls } from "./controls";
import { PROGRAM_EXAMPLES } from "./examples";
import { renderInspectorView } from "./inspector-view";
import { renderOutputView } from "./output-view";
import { renderStatusView } from "./status-view";

const worker = new Worker(new URL("../runtime/runner.worker.ts", import.meta.url), {
  type: "module"
});

const bytesToText = (bytes: readonly Cell[]): string =>
  bytes.map((byte) => String.fromCharCode(byte as number)).join("");

const textToCells = (text: string): readonly Cell[] =>
  Array.from(text, (char) => makeCell(char.charCodeAt(0)));

const readBudget = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
};

const createInitialSnapshot = (inputLength: number): MachineSnapshot => ({
  pc: 0,
  pointer: 0,
  currentCell: 0,
  inputLength,
  outputLength: 0,
  tapeWindow: Array.from({ length: 5 }, (_, offset) => ({
    index: offset,
    value: 0,
    isPointer: offset === 0
  }))
});

export const mountApp = (root: HTMLElement): void => {
  const title = document.createElement("h1");
  title.textContent = "Brainfuck Mirror";

  const controls = renderControls();
  const output = renderOutputView();
  const status = renderStatusView();
  const inspector = renderInspectorView();
  let totalSteps = 0;
  let resetRequested = false;

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(controls.run, controls.stop, controls.reset);

  root.append(
    title,
    controls.examples,
    controls.source,
    controls.input,
    controls.budget,
    actions,
    status.element,
    inspector.element,
    output.element
  );

  worker.onmessage = (message: MessageEvent<WorkerEvent>): void => {
    switch (message.data.tag) {
      case "validationError":
        status.setStatus("Validation error", message.data.error.tag);
        break;
      case "runtimeError":
        status.setStatus("Runtime error", message.data.error.tag);
        break;
      case "stopped":
        status.setStatus(resetRequested ? "Reset" : "Stopped");
        resetRequested = false;
        break;
      case "progress":
        totalSteps += message.data.stepsExecuted;
        status.setStatus(
          message.data.done ? "Finished" : "Running",
          `PC ${message.data.snapshot.pc} · Pointer ${message.data.snapshot.pointer} · Steps ${totalSteps}`
        );
        inspector.setSnapshot(message.data.snapshot);
        output.setOutput(
          bytesToText(message.data.state.machine.output),
          message.data.state.machine.output.map((byte) => byte as number)
        );
        break;
    }
  };

  controls.run.addEventListener("click", () => {
    totalSteps = 0;
    resetRequested = false;
    output.setOutput("", []);
    inspector.setSnapshot(createInitialSnapshot(textToCells(controls.input.value).length));

    const request: WorkerRequest = {
      tag: "run",
      source: controls.source.value,
      input: textToCells(controls.input.value),
      budget: readBudget(controls.budget.value)
    };
    status.setStatus("Starting", "Worker request dispatched");
    worker.postMessage(request);
  });

  controls.stop.addEventListener("click", () => {
    worker.postMessage({ tag: "stop" } satisfies WorkerRequest);
  });

  controls.reset.addEventListener("click", () => {
    resetRequested = true;
    totalSteps = 0;
    output.setOutput("", []);
    inspector.setSnapshot(createInitialSnapshot(textToCells(controls.input.value).length));
    status.setStatus("Reset", "State cleared in UI");
    worker.postMessage({ tag: "stop" } satisfies WorkerRequest);
  });

  controls.examples.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const example = PROGRAM_EXAMPLES.find((item) => item.id === target.dataset.exampleId);
    if (example === undefined) {
      return;
    }

    controls.source.value = example.source;
    controls.input.value = example.input;
    status.setStatus("Example loaded", example.description);
  });

  inspector.setSnapshot(createInitialSnapshot(0));
  output.setOutput("", []);
  status.setStatus("Idle", "Ready to validate and run a Brainfuck program");
};
