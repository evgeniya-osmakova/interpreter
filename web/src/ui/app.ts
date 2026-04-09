import type { Cell } from "../brainfuck/core/cell";
import { makeCell } from "../brainfuck/core/cell";
import type { WorkerEvent, WorkerRequest } from "../runtime/worker-protocol";
import { renderControls } from "./controls";
import { renderOutputView } from "./output-view";
import { renderStatusView } from "./status-view";

const worker = new Worker(new URL("../runtime/runner.worker.ts", import.meta.url), {
  type: "module"
});

const bytesToText = (bytes: readonly Cell[]): string =>
  bytes.map((byte) => String.fromCharCode(byte as number)).join("");

const textToCells = (text: string): readonly Cell[] =>
  Array.from(text, (char) => makeCell(char.charCodeAt(0)));

export const mountApp = (root: HTMLElement): void => {
  const title = document.createElement("h1");
  title.textContent = "Brainfuck Mirror";

  const controls = renderControls();
  const output = renderOutputView();
  const status = renderStatusView();

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(controls.run, controls.stop);

  root.append(title, controls.source, controls.input, actions, status.element, output.element);

  worker.onmessage = (message: MessageEvent<WorkerEvent>): void => {
    switch (message.data.tag) {
      case "validationError":
        status.setStatus(`Validation error: ${message.data.error.tag}`);
        break;
      case "runtimeError":
        status.setStatus(`Runtime error: ${message.data.error.tag}`);
        break;
      case "stopped":
        status.setStatus("Stopped");
        break;
      case "progress":
        status.setStatus(message.data.done ? "Finished" : "Running");
        output.setOutput(bytesToText(message.data.state.machine.output));
        break;
    }
  };

  controls.run.addEventListener("click", () => {
    const request: WorkerRequest = {
      tag: "run",
      source: controls.source.value,
      input: textToCells(controls.input.value),
      budget: 1000
    };
    status.setStatus("Starting");
    worker.postMessage(request);
  });

  controls.stop.addEventListener("click", () => {
    worker.postMessage({ tag: "stop" } satisfies WorkerRequest);
  });
};
