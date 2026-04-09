import type { ValidationError } from "../core/error";
import { err, ok, type Result } from "../core/result";
import type { ProgramCounter } from "../core/program-counter";

export type ValidatedInstruction =
  | { readonly tag: "moveRight" }
  | { readonly tag: "moveLeft" }
  | { readonly tag: "increment" }
  | { readonly tag: "decrement" }
  | { readonly tag: "output" }
  | { readonly tag: "input" }
  | { readonly tag: "jumpIfZero"; readonly target: ProgramCounter }
  | { readonly tag: "jumpIfNonZero"; readonly target: ProgramCounter };

export interface ValidatedProgram {
  readonly length: number;
  readonly instructions: readonly ValidatedInstruction[];
}

export const makeValidatedProgram = (
  instructions: readonly ValidatedInstruction[]
): ValidatedProgram => ({
  length: instructions.length,
  instructions
});

export const getValidatedInstruction = (
  program: ValidatedProgram,
  pc: ProgramCounter
): ValidatedInstruction => program.instructions[pc as number] as ValidatedInstruction;

export const makeValidatedTarget = (
  value: number,
  length: number,
  sourceIndex: number
): Result<ProgramCounter, ValidationError> =>
  value >= 0 && value <= length
    ? ok<ProgramCounter, ValidationError>(value as ProgramCounter)
    : err<ProgramCounter, ValidationError>({
        tag: "invalidJumpTarget",
        index: sourceIndex,
        target: value
      });
