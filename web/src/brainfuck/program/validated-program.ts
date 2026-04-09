import type { ValidationError } from "../core/error";
import { err, ok, type Result } from "../core/result";

declare const jumpTargetBrand: unique symbol;

export type JumpTarget = number & { readonly [jumpTargetBrand]: "JumpTarget" };

export type ValidatedInstruction =
  | { readonly tag: "moveRight" }
  | { readonly tag: "moveLeft" }
  | { readonly tag: "increment" }
  | { readonly tag: "decrement" }
  | { readonly tag: "output" }
  | { readonly tag: "input" }
  | { readonly tag: "jumpIfZero"; readonly target: JumpTarget }
  | { readonly tag: "jumpIfNonZero"; readonly target: JumpTarget };

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
  pc: number
): ValidatedInstruction => program.instructions[pc] as ValidatedInstruction;

export const makeJumpTarget = (
  value: number,
  length: number,
  sourceIndex: number
): Result<JumpTarget, ValidationError> =>
  value >= 0 && value <= length
    ? ok<JumpTarget, ValidationError>(value as JumpTarget)
    : err<JumpTarget, ValidationError>({
        tag: "invalidJumpTarget",
        index: sourceIndex,
        target: value
      });
