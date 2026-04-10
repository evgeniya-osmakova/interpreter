import { MIN_CELL_VALUE, type Cell } from "../../brainfuck/core/cell";
import { MIN_POINTER_INDEX } from "../../brainfuck/core/pointer";
import { readTape, inspectTapeWindow } from "../../brainfuck/core/tape";
import type { ExecState } from "../../brainfuck/core/state";
import { programCounterValue } from "../../brainfuck/program/validated-program";
import type { MachineSnapshot } from "../protocol/worker-protocol";

export const DEFAULT_SNAPSHOT_TAPE_WINDOW_RADIUS = 10;
const DEFAULT_SNAPSHOT_TAPE_WINDOW_SIZE = DEFAULT_SNAPSHOT_TAPE_WINDOW_RADIUS * 2 + 1;

const createBlankTapeWindow = (): MachineSnapshot["tapeWindow"] =>
  Array.from({ length: DEFAULT_SNAPSHOT_TAPE_WINDOW_SIZE }, (_, offset) => ({
    index: MIN_POINTER_INDEX + offset,
    value: MIN_CELL_VALUE,
    isPointer: offset === MIN_POINTER_INDEX
  }));

export const createMachineSnapshot = (state: ExecState): MachineSnapshot => ({
  pc: programCounterValue(state.pc),
  pointer: state.machine.pointer as number,
  currentCell: readTape(state.machine.tape, state.machine.pointer) as number,
  inputLength: state.machine.input.length,
  outputLength: state.machine.output.length,
  tapeWindow: inspectTapeWindow(
    state.machine.tape,
    state.machine.pointer,
    DEFAULT_SNAPSHOT_TAPE_WINDOW_RADIUS
  )
});

export const createInitialMachineSnapshot = (input: readonly Cell[] = []): MachineSnapshot => ({
  pc: 0,
  pointer: MIN_POINTER_INDEX,
  currentCell: MIN_CELL_VALUE,
  inputLength: input.length,
  outputLength: 0,
  tapeWindow: createBlankTapeWindow()
});
