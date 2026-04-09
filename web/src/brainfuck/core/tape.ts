import { decrementCell, incrementCell, makeCell, zeroCell, type Cell } from "./cell";
import type { Pointer } from "./pointer";

const bufferKey = Symbol("buffer");

export type Tape = {
  readonly [bufferKey]: Uint8Array;
};

const fromBuffer = (buffer: Uint8Array): Tape => ({ [bufferKey]: buffer });

const cloneBuffer = (tape: Tape): Uint8Array => new Uint8Array(tape[bufferKey]);

export const blankTape = (): Tape => {
  const buffer = new Uint8Array(30000);
  buffer.fill(zeroCell() as number);
  return fromBuffer(buffer);
};

export const readTape = (tape: Tape, pointer: Pointer): Cell =>
  makeCell(tape[bufferKey][pointer as number] ?? 0);

export const writeTape = (tape: Tape, pointer: Pointer, cell: Cell): Tape => {
  const next = cloneBuffer(tape);
  next[pointer as number] = cell as number;
  return fromBuffer(next);
};

export const mapTapeCell = (tape: Tape, pointer: Pointer, f: (cell: Cell) => Cell): Tape =>
  writeTape(tape, pointer, f(readTape(tape, pointer)));

export const incrementTapeCell = (tape: Tape, pointer: Pointer): Tape =>
  mapTapeCell(tape, pointer, incrementCell);

export const decrementTapeCell = (tape: Tape, pointer: Pointer): Tape =>
  mapTapeCell(tape, pointer, decrementCell);

export interface TapeWindowCell {
  readonly index: number;
  readonly value: number;
  readonly isPointer: boolean;
}

export const inspectTapeWindow = (
  tape: Tape,
  pointer: Pointer,
  radius: number
): readonly TapeWindowCell[] => {
  const center = pointer as number;
  const windowSize = radius * 2 + 1;
  const maxStart = Math.max(0, 30000 - windowSize);
  const start = Math.max(0, Math.min(center - radius, maxStart));
  const end = start + windowSize - 1;
  const cells: TapeWindowCell[] = [];

  for (let index = start; index <= end; index += 1) {
    cells.push({
      index,
      value: tape[bufferKey][index] ?? 0,
      isPointer: index === center
    });
  }

  return cells;
};
