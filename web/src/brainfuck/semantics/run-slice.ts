import type { RuntimeError } from "../core/error";
import { ok, type Result } from "../core/result";
import type { ExecState } from "../core/state";
import type { ValidatedProgram } from "../program/validated-program";
import { isTerminated, step } from "./step";

export interface SliceProgress {
  readonly state: ExecState;
  readonly stepsExecuted: number;
  readonly done: boolean;
}

export const runSlice = (
  program: ValidatedProgram,
  initialState: ExecState,
  budget: number
): Result<SliceProgress, RuntimeError> => {
  let current = initialState;
  let stepsExecuted = 0;

  while (stepsExecuted < budget && !isTerminated(program, current)) {
    const stepped = step(program, current);
    if (stepped.tag === "err") {
      return stepped;
    }

    current = stepped.value;
    stepsExecuted += 1;
  }

  return ok({
    state: current,
    stepsExecuted,
    done: isTerminated(program, current)
  });
};
