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
