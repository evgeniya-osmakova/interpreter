import { initialExecState } from "../brainfuck/core/state";
import { parse } from "../brainfuck/program/parse";
import { validate } from "../brainfuck/program/validate";
import { runSlice } from "../brainfuck/semantics/eval";
import { isTerminated } from "../brainfuck/semantics/step";
import type { ValidatedProgram } from "../brainfuck/program/validated-program";
import type { ExecState } from "../brainfuck/core/state";
import { createMachineSnapshot } from "./snapshot";
import { PLAYBACK_STEP_BUDGET, DEFAULT_PLAYBACK_DELAY_MS } from "./budget";
import type { WorkerEvent, WorkerRequest } from "./worker-protocol";

export interface RunnerDeps {
  readonly emit: (event: WorkerEvent) => void;
  readonly pause?: () => Promise<void>;
}

interface LoadedSession {
  readonly key: string;
  readonly program: ValidatedProgram;
  state: ExecState;
}

const defaultPause = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, DEFAULT_PLAYBACK_DELAY_MS));

const makeSessionKey = (
  request: Extract<WorkerRequest, { tag: "play" | "step" }>
): string => `${request.source}\u0000${request.input.map((cell) => cell as number).join(",")}`;

export const createRunner = (deps: RunnerDeps) => {
  let session: LoadedSession | null = null;
  let activePlaybackId = 0;
  let playing = false;

  const pause = deps.pause ?? defaultPause;

  const emitProgress = (
    currentSession: LoadedSession,
    stepsExecuted: number,
    done: boolean
  ): void => {
    deps.emit({
      tag: "progress",
      snapshot: createMachineSnapshot(currentSession.state),
      output: currentSession.state.machine.output.map((byte) => byte as number),
      done,
      stepsExecuted
    });
  };

  const loadSession = (
    request: Extract<WorkerRequest, { tag: "play" | "step" }>
  ): LoadedSession | null => {
    const sessionKey = makeSessionKey(request);

    if (session !== null && session.key === sessionKey && !isTerminated(session.program, session.state)) {
      return session;
    }

    const parsed = parse(request.source);
    if (parsed.tag === "err") {
      deps.emit({ tag: "validationError", error: parsed.error });
      return null;
    }

    const validated = validate(parsed.value);
    if (validated.tag === "err") {
      deps.emit({ tag: "validationError", error: validated.error });
      return null;
    }

    session = {
      key: sessionKey,
      program: validated.value,
      state: initialExecState(request.input)
    };

    return session;
  };

  const runSingleStep = (
    request: Extract<WorkerRequest, { tag: "play" | "step" }>
  ): boolean | null => {
    const currentSession = loadSession(request);
    if (currentSession === null) {
      return null;
    }

    const slice = runSlice(currentSession.program, currentSession.state, PLAYBACK_STEP_BUDGET);
    if (slice.tag === "err") {
      deps.emit({ tag: "runtimeError", error: slice.error });
      return null;
    }

    currentSession.state = slice.value.state;
    emitProgress(currentSession, slice.value.stepsExecuted, slice.value.done);
    return slice.value.done;
  };

  const playProgram = async (
    playbackId: number,
    request: Extract<WorkerRequest, { tag: "play" }>
  ): Promise<void> => {
    while (playing && activePlaybackId === playbackId) {
      const done = runSingleStep(request);
      if (done === null || done) {
        playing = false;
        return;
      }

      await pause();
    }
  };

  return {
    handleRequest(request: WorkerRequest): Promise<void> {
      if (request.tag === "pause") {
        playing = false;
        activePlaybackId += 1;
        deps.emit({ tag: "paused" });
        return Promise.resolve();
      }

      if (request.tag === "stop") {
        playing = false;
        activePlaybackId += 1;
        session = null;
        deps.emit({ tag: "stopped" });
        return Promise.resolve();
      }

      if (request.tag === "step") {
        playing = false;
        activePlaybackId += 1;
        runSingleStep(request);
        return Promise.resolve();
      }

      activePlaybackId += 1;
      const playbackId = activePlaybackId;
      playing = true;
      return playProgram(playbackId, request);
    }
  };
};
