import { readTape, inspectTapeWindow } from "../brainfuck/core/tape";
import type { ExecState } from "../brainfuck/core/state";
import type { MachineSnapshot } from "./worker-protocol";

export const createMachineSnapshot = (state: ExecState): MachineSnapshot => ({
  pc: state.pc,
  pointer: state.machine.pointer as number,
  currentCell: readTape(state.machine.tape, state.machine.pointer) as number,
  inputLength: state.machine.input.length,
  outputLength: state.machine.output.length,
  tapeWindow: inspectTapeWindow(state.machine.tape, state.machine.pointer, 4)
});
