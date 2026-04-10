import {
  decrementCell,
  incrementCell,
  makeCell,
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

const createTapeFromBuffer = (buffer: Uint8Array): Tape => ({ [bufferKey]: buffer });

const getBufferAt = (tape: Tape, index: number): number => {
  const buffer = tape[bufferKey];
  if (!(buffer instanceof Uint8Array) || index < MIN_POINTER_INDEX || index >= buffer.length) {
    throw new Error(
      `Tape invariant violated: index ${index} is outside backing buffer length ${
        buffer instanceof Uint8Array ? buffer.length : 0
      }`
    );
  }

  return buffer[index] as number;
};

export const blankTape = (): Tape => {
  const buffer = new Uint8Array(TAPE_LENGTH);
  buffer.fill(zeroCell() as number);
  return createTapeFromBuffer(buffer);
};

export const readTape = (tape: Tape, pointer: Pointer): Cell =>
  makeCell(getBufferAt(tape, pointer as number));

export const writeTape = (tape: Tape, pointer: Pointer, cell: Cell): Tape => {
  getBufferAt(tape, pointer as number);
  const next = new Uint8Array(tape[bufferKey]);
  next[pointer as number] = cell as number;
  return createTapeFromBuffer(next);
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
      value: getBufferAt(tape, index),
      isPointer: index === center
    });
  }

  return cells;
};
