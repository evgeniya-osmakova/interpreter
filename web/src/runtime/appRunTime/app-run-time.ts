import { RuntimeClient } from '../client/runtime-client'
import type { AppUi } from '../../ui'
import { resolveInputMode } from '../../helpers/input-mode'
import { createInitialMachineSnapshot } from '../runner/snapshot'
import { decodeBytesToText, encodeTextToCells } from '../../helpers/text-codec'
import type { WorkerEvent, WorkerRequest } from '../protocol/worker-protocol'
import { formatProtocolError, formatRuntimeError, formatValidationError } from '../../helpers/runtime-messages'
import { PROGRAM_EXAMPLES } from '../../helpers/examples'

type PlaybackState = "inactive" | "playing" | "paused" | "stepping";
type StopReason = "reset" | "replaceSession" | null;

interface ProgressState {
  readonly pc: number;
  readonly pointer: number;
  readonly steps: number;
}

export interface AppRuntimeHandle {
  dispose: () => void;
}

const makeUiSessionKey = (source: string, input: string): string => `${source}\u0000${input}`;

export const bindAppRuntime = (
  runtimeClient: RuntimeClient,
  views: Pick<AppUi, "controls" | "output" | "programView" | "status">
): AppRuntimeHandle => {
  const { controls, output, programView, status } = views;
  let totalSteps = 0;
  let pendingStopReason: StopReason = null;
  let ignoreEventsUntilStopped = false;
  let playbackState: PlaybackState = "inactive";
  let currentSessionKey: string | null = null;
  let currentSessionFinished = false;
  let lastProgress: ProgressState | null = null;

  const syncInputMode = (): void => {
    controls.setInputMode(resolveInputMode(controls.source.value, controls.input.value));
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

  const hasActiveSession = (): boolean => currentSessionKey !== null && !currentSessionFinished;

  const requestStop = (reason: StopReason): void => {
    pendingStopReason = reason;
    ignoreEventsUntilStopped = true;
    playbackState = "inactive";
    runtimeClient.send({ tag: "stop" } satisfies WorkerRequest);
  };

  const discardCurrentSession = (): void => {
    if (!hasActiveSession()) {
      playbackState = "inactive";
      currentSessionKey = null;
      return;
    }

    currentSessionKey = null;
    currentSessionFinished = false;
    requestStop("replaceSession");
  };

  const unsubscribe = runtimeClient.subscribe((event: WorkerEvent): void => {
    if (ignoreEventsUntilStopped && event.tag !== "stopped") {
      return;
    }

    switch (event.tag) {
      case "validationError":
        playbackState = "inactive";
        currentSessionFinished = true;
        lastProgress = null;
        status.setStatus("Validation error", formatValidationError(event.error), "error");
        programView.setProgramCounter(null);
        break;
      case "runtimeError":
        playbackState = "inactive";
        currentSessionFinished = true;
        lastProgress = null;
        status.setStatus("Runtime error", formatRuntimeError(event.error), "error");
        break;
      case "protocolError":
        playbackState = "inactive";
        status.setStatus("Protocol error", formatProtocolError(event.error), "error");
        break;
      case "paused":
        playbackState = "paused";
        if (lastProgress !== null) {
          status.setProgressStatus("Paused", lastProgress);
        } else {
          status.setStatus("Paused");
        }
        break;
      case "stopped":
        lastProgress = null;
        if (pendingStopReason === "reset") {
          status.setStatus("Reset");
        } else if (pendingStopReason === null) {
          status.setStatus("Stopped");
        }
        pendingStopReason = null;
        ignoreEventsUntilStopped = false;
        playbackState = "inactive";
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
          event.done ? "Finished" : playbackState === "playing" ? "Running" : "Paused",
          lastProgress
        );
        programView.setProgramCounter(event.snapshot.pc);
        programView.setSnapshot(event.snapshot);
        output.setOutput(decodeBytesToText(event.output));
        if (event.done) {
          playbackState = "inactive";
        } else if (playbackState === "stepping") {
          playbackState = "paused";
        }
        break;
    }
  });

  controls.play.addEventListener("click", () => {
    pendingStopReason = null;
    ensureSessionForCurrentInputs();
    playbackState = "playing";
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
    pendingStopReason = null;
    ensureSessionForCurrentInputs();
    playbackState = "stepping";
    runtimeClient.send({
      tag: "step",
      source: controls.source.value,
      input: encodeTextToCells(controls.input.value)
    } satisfies WorkerRequest);
  });

  controls.pause.addEventListener("click", () => {
    playbackState = "paused";
    runtimeClient.send({ tag: "pause" } satisfies WorkerRequest);
  });

  controls.reset.addEventListener("click", () => {
    requestStop("reset");
    currentSessionKey = null;
    currentSessionFinished = false;
    lastProgress = null;
    resetVisibleSessionState();
    status.setStatus("Reset");
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

    discardCurrentSession();
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
    discardCurrentSession();
    syncInputMode();
    currentSessionFinished = false;
    lastProgress = null;
    resetVisibleSessionState();
    status.setStatus("Waiting to start");
  });

  controls.input.addEventListener("input", () => {
    discardCurrentSession();
    syncInputMode();
    currentSessionFinished = false;
    lastProgress = null;
    resetVisibleSessionState();
    status.setStatus("Waiting to start");
  });

  controls.setSelectedExample(null);
  syncInputMode();
  programView.setSource(controls.source.value);
  programView.setProgramCounter(null);
  programView.setSnapshot(createInitialMachineSnapshot());
  output.setOutput("");
  status.setStatus("Waiting to start");

  return {
    dispose() {
      unsubscribe();
      runtimeClient.dispose();
    }
  };
};
