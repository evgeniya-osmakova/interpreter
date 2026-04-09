import type { JumpTarget } from "../program/validated-program";

declare const programCounterBrand: unique symbol;

export type ProgramCounter = number & { readonly [programCounterBrand]: "ProgramCounter" };

const brandProgramCounter = (value: number): ProgramCounter => value as ProgramCounter;

export const zeroProgramCounter = (): ProgramCounter => brandProgramCounter(0);

export const makeProgramCounter = (
  value: number,
  programLength: number
): ProgramCounter | null =>
  Number.isInteger(value) && value >= 0 && value <= programLength
    ? brandProgramCounter(value)
    : null;

export const nextProgramCounter = (
  program: { readonly length: number },
  pc: ProgramCounter
): ProgramCounter => brandProgramCounter(Math.min((pc as number) + 1, program.length));

export const isProgramCounterTerminated = (
  program: { readonly length: number },
  pc: ProgramCounter
): boolean => (pc as number) >= program.length;

export const programCounterFromJumpTarget = (target: JumpTarget): ProgramCounter =>
  brandProgramCounter(target as number);

export const programCounterValue = (pc: ProgramCounter): number => pc as number;
