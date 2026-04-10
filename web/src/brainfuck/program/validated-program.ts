import type { ValidationError } from "../core/error";
import { err, ok, type Result } from "../core/result";

const validatedProgramBrand = Symbol("validatedProgram");
export const MIN_PROGRAM_COUNTER = 0;
export const PROGRAM_COUNTER_STEP = 1;

declare const programCounterBrand: unique symbol;

export type ProgramCounter = number & { readonly [programCounterBrand]: "ProgramCounter" };

const brandProgramCounter = (value: number): ProgramCounter => value as ProgramCounter;

export const zeroProgramCounter = (): ProgramCounter => brandProgramCounter(MIN_PROGRAM_COUNTER);

export const makeProgramCounter = (
  value: number,
  programLength: number
): ProgramCounter | null =>
  Number.isInteger(value) && value >= MIN_PROGRAM_COUNTER && value <= programLength
    ? brandProgramCounter(value)
    : null;

export const nextProgramCounter = (
  program: { readonly length: number },
  pc: ProgramCounter
): ProgramCounter =>
  brandProgramCounter(Math.min((pc as number) + PROGRAM_COUNTER_STEP, program.length));

export const isProgramCounterTerminated = (
  program: { readonly length: number },
  pc: ProgramCounter
): boolean => (pc as number) >= program.length;

export const programCounterValue = (pc: ProgramCounter): number => pc as number;

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
