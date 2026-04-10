import { TAPE_LAST_INDEX, MIN_POINTER_INDEX } from "../brainfuck/core/pointer";
import type { RuntimeError, ValidationError } from "../brainfuck/core/error";
import { createWorkerRuntimeClient, type RuntimeClient } from "../runtime/client";
import { createInitialMachineSnapshot } from "../runtime/snapshot";
import type { ProtocolError, WorkerEvent, WorkerRequest } from "../runtime/worker-protocol";
import { renderControls } from "./controls";
import { PROGRAM_EXAMPLES } from "./examples";
import { renderOutputView } from "./output-view";
import { renderProgramView } from "./program-view";
import { renderStatusView } from "./status-view";
import {
  countTextCharacters,
  countUtf8Bytes,
  decodeBytesToText,
  encodeTextToCells
} from "./text-codec";

export interface AppHandle {
  dispose: () => void;
}

type PlaybackMode = "idle" | "playing" | "paused" | "stepping";
const INPUT_BYTES_PER_READ = 1;
const formatTapeIndex = (value: number): string => new Intl.NumberFormat("en-US").format(value);

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

const sourceUsesInputInstruction = (source: string): boolean =>
  source.includes(",");

const pluralize = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural;

const describeInputMode = (source: string, input: string): string => {
  if (!sourceUsesInputInstruction(source)) {
    return "";
  }

  const characterCount = countTextCharacters(input);
  const byteCount = countUtf8Bytes(input);

  if (input === "") {
    return `The browser turns text into UTF-8 bytes before execution. Most Latin letters use ${INPUT_BYTES_PER_READ} byte; emoji and many non-Latin characters use several.`;
  }

  return `Current input: ${characterCount} ${pluralize(characterCount, "character", "characters")} and ${byteCount} ${pluralize(byteCount, "byte", "bytes")}.`;
};

const formatValidationError = (error: ValidationError): string => {
  switch (error.tag) {
    case "unmatchedLoopStart":
      return `A loop starts at instruction ${error.index}, but no matching ] was found.`;
    case "unmatchedLoopEnd":
      return `A ] appears at instruction ${error.index}, but there is no matching [.`;
    case "invalidJumpTarget":
      return `The validated loop jump at instruction ${error.index} points to invalid target ${error.target}.`;
  }
};

const formatRuntimeError = (error: RuntimeError): string => {
  switch (error.tag) {
    case "pointerOutOfBounds":
      return `The pointer tried to move outside the tape. Valid cells are ${MIN_POINTER_INDEX} through ${formatTapeIndex(TAPE_LAST_INDEX)}.`;
    case "inputExhausted":
      return "The program tried to read another byte, but Program input has no bytes left.";
  }
};

const formatProtocolError = (error: ProtocolError): string => {
  switch (error.tag) {
    case "invalidRequest":
      return "The browser and worker could not agree on a valid message shape.";
    case "invalidRunField":
      return `The ${error.field} field could not be decoded by the worker.`;
  }
};

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
  controlStack.append(controls.examplesSection, controls.runPanel);
  controls.sourceStatusSlot.append(status.element);

  const resultsStack = document.createElement("div");
  resultsStack.className = "workspace__results";
  programView.element.append(output.element);
  resultsStack.append(programView.element);

  workspace.append(controlStack, resultsStack);

  root.append(
    intro,
    workspace
  );

  const syncInputMode = (): void => {
    controls.setInputMode(
      sourceUsesInputInstruction(controls.source.value),
      describeInputMode(controls.source.value, controls.input.value)
    );
  };

  const syncProgramSource = (): void => {
    programView.setSource(controls.source.value);
    programView.setProgramCounter(null);
  };

  const resetVisibleSessionState = (): void => {
    totalSteps = 0;
    output.setOutput("");
    programView.setSource(controls.source.value);
    programView.setProgramCounter(null);
    programView.setSnapshot(createInitialMachineSnapshot(encodeTextToCells(controls.input.value)));
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
        status.setStatus("Validation error", formatValidationError(event.error), "error");
        programView.setProgramCounter(null);
        break;
      case "runtimeError":
        playbackMode = "idle";
        currentSessionFinished = true;
        lastProgress = null;
        status.setStatus("Runtime error", formatRuntimeError(event.error), "error");
        break;
      case "protocolError":
        playbackMode = "idle";
        status.setStatus("Protocol error", formatProtocolError(event.error), "error");
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
        output.setOutput(decodeBytesToText(event.output));
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
      input: encodeTextToCells(controls.input.value)
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
      input: encodeTextToCells(controls.input.value)
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
    syncInputMode();
    programView.setSource(example.source);
    programView.setProgramCounter(null);
    currentSessionKey = null;
    currentSessionFinished = false;
    lastProgress = null;
    totalSteps = 0;
    output.setOutput("");
    programView.setSnapshot(createInitialMachineSnapshot(encodeTextToCells(example.input)));
    status.setStatus("Example loaded", `Ready to run ${example.label}`);
  });

  controls.source.addEventListener("input", () => {
    syncInputMode();
    currentSessionFinished = false;
    currentSessionKey = null;
    lastProgress = null;
    resetVisibleSessionState();
    status.setStatus("Waiting to start");
  });

  controls.input.addEventListener("input", () => {
    syncInputMode();
    currentSessionFinished = false;
    currentSessionKey = null;
    lastProgress = null;
    resetVisibleSessionState();
    status.setStatus("Waiting to start");
  });

  controls.setSelectedExample(null);
  syncInputMode();
  syncProgramSource();
  programView.setSnapshot(createInitialMachineSnapshot());
  output.setOutput("");
  status.setStatus("Waiting to start");

  return {
    dispose() {
      unsubscribe();
      runtimeClient.dispose();
      root.replaceChildren();
    }
  };
};
