import type { Cell } from "../brainfuck/core/cell";
import { makeCell } from "../brainfuck/core/cell";
import { createWorkerRuntimeClient, type RuntimeClient } from "../runtime/client";
import { createInitialMachineSnapshot } from "../runtime/snapshot";
import type { WorkerEvent, WorkerRequest } from "../runtime/worker-protocol";
import { renderControls } from "./controls";
import { PROGRAM_EXAMPLES } from "./examples";
import { renderOutputView } from "./output-view";
import { renderProgramView } from "./program-view";
import { renderStatusView } from "./status-view";

const bytesToText = (bytes: readonly number[]): string =>
  bytes.map((byte) => String.fromCharCode(byte)).join("");

const textToCells = (text: string): readonly Cell[] =>
  Array.from(text, (char) => makeCell(char.charCodeAt(0)));

export interface AppHandle {
  dispose: () => void;
}

type PlaybackMode = "idle" | "playing" | "paused" | "stepping";

const createIntro = (): HTMLElement => {
  const intro = document.createElement("header");
  intro.className = "hero";

  const title = document.createElement("h1");
  title.textContent = "Brainfuck Mirror";

  const lead = document.createElement("p");
  lead.className = "hero__lead";
  lead.textContent =
    "Explore a validated Brainfuck program in a browser shell that mirrors the formal Lean model and keeps execution off the main thread.";

  const learnMore = document.createElement("p");
  learnMore.className = "hero__link";
  learnMore.append("New to Brainfuck? Start with the Wikipedia overview: ");

  const link = document.createElement("a");
  link.href = "https://en.wikipedia.org/wiki/Brainfuck";
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.textContent = "Brainfuck on Wikipedia";

  learnMore.append(link);
  intro.append(title, lead, learnMore);
  return intro;
};

const makeUiSessionKey = (source: string, input: string): string => `${source}\u0000${input}`;

export const mountApp = (
  root: HTMLElement,
  runtimeClient: RuntimeClient = createWorkerRuntimeClient()
): AppHandle => {
  root.replaceChildren();

  const intro = createIntro();
  const controls = renderControls();
  const output = renderOutputView();
  const status = renderStatusView();
  const programView = renderProgramView();
  let totalSteps = 0;
  let resetRequested = false;
  let resetPendingStop = false;
  let playbackMode: PlaybackMode = "idle";
  let currentSessionKey: string | null = null;
  let currentSessionFinished = false;
  let lastProgress: { pc: number; pointer: number; steps: number } | null = null;

  const workspace = document.createElement("div");
  workspace.className = "workspace";

  const controlStack = document.createElement("div");
  controlStack.className = "workspace__controls";
  controlStack.append(controls.examplesSection, controls.runPanel, output.element);
  controls.sourceStatusSlot.append(status.element);

  const resultsStack = document.createElement("div");
  resultsStack.className = "workspace__results";
  resultsStack.append(programView.element);

  workspace.append(controlStack, resultsStack);

  root.append(
    intro,
    workspace
  );

  const syncProgramSource = (): void => {
    programView.setSource(controls.source.value);
    programView.setProgramCounter(null);
  };

  const resetVisibleSessionState = (): void => {
    totalSteps = 0;
    output.setOutput("", []);
    programView.setSource(controls.source.value);
    programView.setProgramCounter(null);
    programView.setSnapshot(createInitialMachineSnapshot(textToCells(controls.input.value)));
  };

  const ensureSessionForCurrentInputs = (): void => {
    const nextSessionKey = makeUiSessionKey(controls.source.value, controls.input.value);
    if (currentSessionKey !== nextSessionKey || currentSessionFinished) {
      currentSessionKey = nextSessionKey;
      currentSessionFinished = false;
      resetVisibleSessionState();
    }
  };

  const unsubscribe = runtimeClient.subscribe((event: WorkerEvent): void => {
    if (resetPendingStop && event.tag !== "stopped") {
      return;
    }

    switch (event.tag) {
      case "validationError":
        playbackMode = "idle";
        currentSessionFinished = true;
        lastProgress = null;
        status.setStatus("Validation error", event.error.tag, "error");
        programView.setProgramCounter(null);
        break;
      case "runtimeError":
        playbackMode = "idle";
        currentSessionFinished = true;
        lastProgress = null;
        status.setStatus("Runtime error", event.error.tag, "error");
        break;
      case "protocolError":
        playbackMode = "idle";
        status.setStatus("Protocol error", event.error.tag, "error");
        break;
      case "paused":
        playbackMode = "paused";
        if (lastProgress !== null) {
          status.setProgressStatus("Paused", lastProgress);
        } else {
          status.setStatus("Paused");
        }
        break;
      case "stopped":
        lastProgress = null;
        status.setStatus(resetRequested ? "Reset" : "Stopped");
        resetRequested = false;
        resetPendingStop = false;
        playbackMode = "idle";
        break;
      case "progress":
        totalSteps += event.stepsExecuted;
        currentSessionFinished = event.done;
        lastProgress = {
          pc: event.snapshot.pc,
          pointer: event.snapshot.pointer,
          steps: totalSteps
        };
        status.setProgressStatus(
          event.done ? "Finished" : playbackMode === "playing" ? "Running" : "Paused",
          lastProgress
        );
        programView.setProgramCounter(event.snapshot.pc);
        programView.setSnapshot(event.snapshot);
        output.setOutput(bytesToText(event.output), event.output);
        if (event.done) {
          playbackMode = "idle";
        } else if (playbackMode === "stepping") {
          playbackMode = "paused";
        }
        break;
    }
  });

  controls.play.addEventListener("click", () => {
    resetRequested = false;
    ensureSessionForCurrentInputs();
    playbackMode = "playing";
    if (lastProgress !== null) {
      status.setProgressStatus("Running", lastProgress);
    } else {
      status.setStatus("Running");
    }

    const request: WorkerRequest = {
      tag: "play",
      source: controls.source.value,
      input: textToCells(controls.input.value)
    };
    runtimeClient.send(request);
  });

  controls.step.addEventListener("click", () => {
    resetRequested = false;
    ensureSessionForCurrentInputs();
    playbackMode = "stepping";
    runtimeClient.send({
      tag: "step",
      source: controls.source.value,
      input: textToCells(controls.input.value)
    } satisfies WorkerRequest);
  });

  controls.pause.addEventListener("click", () => {
    playbackMode = "paused";
    runtimeClient.send({ tag: "pause" } satisfies WorkerRequest);
  });

  controls.reset.addEventListener("click", () => {
    resetRequested = true;
    resetPendingStop = true;
    playbackMode = "idle";
    currentSessionKey = null;
    currentSessionFinished = false;
    lastProgress = null;
    resetVisibleSessionState();
    status.setStatus("Reset");
    runtimeClient.send({ tag: "stop" } satisfies WorkerRequest);
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
    controls.setSelectedExample(example);
    programView.setSource(example.source);
    programView.setProgramCounter(null);
    currentSessionKey = null;
    currentSessionFinished = false;
    lastProgress = null;
    totalSteps = 0;
    output.setOutput("", []);
    programView.setSnapshot(createInitialMachineSnapshot(textToCells(example.input)));
    status.setStatus("Example loaded", `Ready to run ${example.label}`);
  });

  controls.source.addEventListener("input", () => {
    currentSessionFinished = false;
    currentSessionKey = null;
    lastProgress = null;
    resetVisibleSessionState();
    status.setStatus("Waiting to start");
  });

  controls.input.addEventListener("input", () => {
    currentSessionFinished = false;
    currentSessionKey = null;
    lastProgress = null;
    resetVisibleSessionState();
    status.setStatus("Waiting to start");
  });

  controls.setSelectedExample(null);
  syncProgramSource();
  programView.setSnapshot(createInitialMachineSnapshot());
  output.setOutput("", []);
  status.setStatus("Waiting to start");

  return {
    dispose() {
      unsubscribe();
      runtimeClient.dispose();
      root.replaceChildren();
    }
  };
};
