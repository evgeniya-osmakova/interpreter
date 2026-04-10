import {
  decrementCell,
  incrementCell,
  makeCell,
  MIN_CELL_VALUE,
  zeroCell,
  type Cell
} from "./cell";
import { MIN_POINTER_INDEX, TAPE_LENGTH, type Pointer } from "./pointer";

const bufferKey = Symbol("buffer");
const WINDOW_RADIUS_DIAMETER = 2;
const WINDOW_CENTER_CELL_COUNT = 1;

export type Tape = {
  readonly [bufferKey]: Uint8Array;
};

const fromBuffer = (buffer: Uint8Array): Tape => ({ [bufferKey]: buffer });

const cloneBuffer = (tape: Tape): Uint8Array => new Uint8Array(tape[bufferKey]);

export const blankTape = (): Tape => {
  const buffer = new Uint8Array(TAPE_LENGTH);
  buffer.fill(zeroCell() as number);
  return fromBuffer(buffer);
};

export const readTape = (tape: Tape, pointer: Pointer): Cell =>
  makeCell(tape[bufferKey][pointer as number] ?? MIN_CELL_VALUE);

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
  const windowSize = radius * WINDOW_RADIUS_DIAMETER + WINDOW_CENTER_CELL_COUNT;
  const maxStart = Math.max(MIN_POINTER_INDEX, TAPE_LENGTH - windowSize);
  const start = Math.max(MIN_POINTER_INDEX, Math.min(center - radius, maxStart));
  const end = start + windowSize - WINDOW_CENTER_CELL_COUNT;
  const cells: TapeWindowCell[] = [];

  for (let index = start; index <= end; index += 1) {
    cells.push({
      index,
      value: tape[bufferKey][index] ?? MIN_CELL_VALUE,
      isPointer: index === center
    });
  }

  return cells;
};
