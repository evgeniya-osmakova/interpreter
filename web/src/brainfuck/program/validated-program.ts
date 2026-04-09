import type { ValidationError } from "../core/error";
import { makeProgramCounter, type ProgramCounter } from "../core/program-counter";
import { err, ok, type Result } from "../core/result";

const validatedProgramBrand = Symbol("validatedProgram");

export type ValidatedInstruction =
  | { readonly tag: "moveRight" }
  | { readonly tag: "moveLeft" }
  | { readonly tag: "increment" }
  | { readonly tag: "decrement" }
  | { readonly tag: "output" }
  | { readonly tag: "input" }
  | { readonly tag: "jumpIfZero"; readonly target: ProgramCounter }
  | { readonly tag: "jumpIfNonZero"; readonly target: ProgramCounter };

export type ValidatedProgram = {
  readonly length: number;
  readonly instructions: readonly ValidatedInstruction[];
  readonly [validatedProgramBrand]: "ValidatedProgram";
};

export const makeValidatedProgram = (
  instructions: readonly ValidatedInstruction[]
): ValidatedProgram => {
  const program = {
    length: instructions.length,
    instructions
  };

  return Object.defineProperty(program, validatedProgramBrand, {
    value: "ValidatedProgram"
  }) as ValidatedProgram;
};

export const getValidatedInstruction = (
  program: ValidatedProgram,
  pc: ProgramCounter
): ValidatedInstruction => program.instructions[pc as number] as ValidatedInstruction;

export const makeValidatedTarget = (
  value: number,
  length: number,
  sourceIndex: number
): Result<ProgramCounter, ValidationError> => {
  const target = makeProgramCounter(value, length);
  return target !== null
    ? ok<ProgramCounter, ValidationError>(target)
    : err<ProgramCounter, ValidationError>({
        tag: "invalidJumpTarget",
        index: sourceIndex,
        target: value
      });
};
