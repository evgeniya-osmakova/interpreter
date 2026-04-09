import type { Cell } from "../core/cell";
import type { RuntimeError } from "../core/error";
import { ok, type Result } from "../core/result";
import type { ExecState } from "../core/state";
import { initialExecState } from "../core/state";
import type { ValidatedProgram } from "../program/validated-program";
import { isTerminated, step } from "./step";

export const runFuel = (
  program: ValidatedProgram,
  fuel: number,
  initialState: ExecState
): Result<ExecState, RuntimeError> => {
  let current = initialState;
  let remaining = fuel;

  while (remaining > 0 && !isTerminated(program, current)) {
    const stepped = step(program, current);
    if (stepped.tag === "err") {
      return stepped;
    }

    current = stepped.value;
    remaining -= 1;
  }

  return ok(current);
};

export const runWithInput = (
  program: ValidatedProgram,
  fuel: number,
  input: readonly Cell[] = []
): Result<ExecState, RuntimeError> => runFuel(program, fuel, initialExecState(input));
