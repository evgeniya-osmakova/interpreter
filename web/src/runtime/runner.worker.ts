/// <reference lib="webworker" />

import { parse } from "../brainfuck/program/parse";
import { validate } from "../brainfuck/program/validate";
import { initialExecState } from "../brainfuck/core/state";
import { runSlice } from "../brainfuck/semantics/run-slice";
import type { WorkerEvent, WorkerRequest } from "./worker-protocol";

let stopped = false;
let activeRunId = 0;

const emit = (event: WorkerEvent): void => {
  self.postMessage(event);
};

const pause = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const isCurrentRun = (runId: number): boolean => !stopped && activeRunId === runId;

const runProgram = async (
  runId: number,
  source: string,
  input: WorkerRequest & { tag: "run" }
): Promise<void> => {
  stopped = false;

  const parsed = parse(source);
  if (parsed.tag === "err") {
    if (activeRunId === runId) {
      emit({ tag: "validationError", error: parsed.error });
    }
    return;
  }

  const validated = validate(parsed.value);
  if (validated.tag === "err") {
    if (activeRunId === runId) {
      emit({ tag: "validationError", error: validated.error });
    }
    return;
  }

  let current = initialExecState(input.input);

  while (isCurrentRun(runId)) {
    const slice = runSlice(validated.value, current, input.budget);
    if (slice.tag === "err") {
      if (activeRunId === runId) {
        emit({ tag: "runtimeError", error: slice.error });
      }
      return;
    }

    current = slice.value.state;
    if (!isCurrentRun(runId)) {
      return;
    }

    emit({
      tag: "progress",
      state: current,
      done: slice.value.done,
      stepsExecuted: slice.value.stepsExecuted
    });

    if (slice.value.done) {
      return;
    }

    await pause();
  }
};

self.onmessage = (message: MessageEvent<WorkerRequest>): void => {
  if (message.data.tag === "stop") {
    stopped = true;
    activeRunId += 1;
    emit({ tag: "stopped" });
    return;
  }

  activeRunId += 1;
  const runId = activeRunId;
  void runProgram(runId, message.data.source, message.data);
};
