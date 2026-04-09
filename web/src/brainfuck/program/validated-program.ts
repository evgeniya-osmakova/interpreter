import type { ValidationError } from "../core/error";
import { err, ok, type Result } from "../core/result";

declare const programIndexBrand: unique symbol;

export type ProgramIndex = number & { readonly [programIndexBrand]: "ProgramIndex" };

export type ValidatedInstruction =
  | { readonly tag: "moveRight" }
  | { readonly tag: "moveLeft" }
  | { readonly tag: "increment" }
  | { readonly tag: "decrement" }
  | { readonly tag: "output" }
  | { readonly tag: "input" }
  | { readonly tag: "jumpIfZero"; readonly target: ProgramIndex }
  | { readonly tag: "jumpIfNonZero"; readonly target: ProgramIndex };

export interface ValidatedProgram {
  readonly length: number;
  readonly instructions: readonly ValidatedInstruction[];
}

export const makeProgramIndex = (
  value: number,
  length: number,
  sourceIndex: number
): Result<ProgramIndex, ValidationError> =>
  value >= 0 && value < length
    ? ok<ProgramIndex, ValidationError>(value as ProgramIndex)
    : err<ProgramIndex, ValidationError>({
        tag: "invalidJumpTarget",
        index: sourceIndex,
        target: value
      });
