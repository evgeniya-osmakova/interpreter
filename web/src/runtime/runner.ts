import { initialExecState } from "../brainfuck/core/state";
import { parse } from "../brainfuck/program/parse";
import { validate } from "../brainfuck/program/validate";
import { runSlice } from "../brainfuck/semantics/run-slice";
import { normalizeExecutionBudget } from "./budget";
import { createMachineSnapshot } from "./snapshot";
import type { WorkerEvent, WorkerRequest } from "./worker-protocol";

export interface RunnerDeps {
  readonly emit: (event: WorkerEvent) => void;
  readonly pause?: () => Promise<void>;
}

const defaultPause = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export const createRunner = (deps: RunnerDeps) => {
  let stopped = false;
  let activeRunId = 0;

  const pause = deps.pause ?? defaultPause;

  const isCurrentRun = (runId: number): boolean => !stopped && activeRunId === runId;

  const runProgram = async (
    runId: number,
    request: Extract<WorkerRequest, { tag: "run" }>
  ): Promise<void> => {
    stopped = false;
    const budget = normalizeExecutionBudget(request.budget);

    const parsed = parse(request.source);
    if (parsed.tag === "err") {
      if (activeRunId === runId) {
        deps.emit({ tag: "validationError", error: parsed.error });
      }
      return;
    }

    const validated = validate(parsed.value);
    if (validated.tag === "err") {
      if (activeRunId === runId) {
        deps.emit({ tag: "validationError", error: validated.error });
      }
      return;
    }

    let current = initialExecState(request.input);

    while (isCurrentRun(runId)) {
      const slice = runSlice(validated.value, current, budget);
      if (slice.tag === "err") {
        if (activeRunId === runId) {
          deps.emit({ tag: "runtimeError", error: slice.error });
        }
        return;
      }

      current = slice.value.state;
      if (!isCurrentRun(runId)) {
        return;
      }

      deps.emit({
        tag: "progress",
        snapshot: createMachineSnapshot(current),
        output: current.machine.output.map((byte) => byte as number),
        done: slice.value.done,
        stepsExecuted: slice.value.stepsExecuted
      });

      if (slice.value.done) {
        return;
      }

      await pause();
    }
  };

  return {
    handleRequest(request: WorkerRequest): Promise<void> {
      if (request.tag === "stop") {
        stopped = true;
        activeRunId += 1;
        deps.emit({ tag: "stopped" });
        return Promise.resolve();
      }

      activeRunId += 1;
      const runId = activeRunId;
      return runProgram(runId, request);
    }
  };
};
