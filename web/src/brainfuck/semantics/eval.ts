import type { Cell } from "../core/cell";
import type { RuntimeError } from "../core/error";
import { mapResult, type Result } from "../core/result";
import type { ExecState } from "../core/state";
import { initialExecState } from "../core/state";
import type { ValidatedProgram } from "../program/validated-program";
import { runSlice } from "./run-slice";

export const runFuel = (
  program: ValidatedProgram,
  fuel: number,
  initialState: ExecState
): Result<ExecState, RuntimeError> =>
  mapResult(runSlice(program, initialState, fuel), (progress) => progress.state);

export const runWithInput = (
  program: ValidatedProgram,
  fuel: number,
  input: readonly Cell[] = []
): Result<ExecState, RuntimeError> => runFuel(program, fuel, initialExecState(input));
