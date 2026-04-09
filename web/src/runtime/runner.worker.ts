/// <reference lib="webworker" />

import { parse } from "../brainfuck/program/parse";
import { validate } from "../brainfuck/program/validate";
import { initialExecState } from "../brainfuck/core/state";
import { runSlice } from "../brainfuck/semantics/run-slice";
import type { WorkerEvent, WorkerRequest } from "./worker-protocol";

let stopped = false;

const emit = (event: WorkerEvent): void => {
  self.postMessage(event);
};

self.onmessage = (message: MessageEvent<WorkerRequest>): void => {
  if (message.data.tag === "stop") {
    stopped = true;
    emit({ tag: "stopped" });
    return;
  }

  stopped = false;

  const parsed = parse(message.data.source);
  if (parsed.tag === "err") {
    emit({ tag: "validationError", error: parsed.error });
    return;
  }

  const validated = validate(parsed.value);
  if (validated.tag === "err") {
    emit({ tag: "validationError", error: validated.error });
    return;
  }

  let current = initialExecState(message.data.input);

  while (!stopped) {
    const slice = runSlice(validated.value, current, message.data.budget);
    if (slice.tag === "err") {
      emit({ tag: "runtimeError", error: slice.error });
      return;
    }

    current = slice.value.state;
    emit({
      tag: "progress",
      state: current,
      done: slice.value.done,
      stepsExecuted: slice.value.stepsExecuted
    });

    if (slice.value.done) {
      return;
    }
  }
};
