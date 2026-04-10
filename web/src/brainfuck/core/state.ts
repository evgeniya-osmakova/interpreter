import type { Cell } from "./cell";
import type { Pointer } from "./pointer";
import { blankTape, type Tape } from "./tape";
import { zeroPointer } from "./pointer";
import { zeroProgramCounter, type ProgramCounter } from "../program/validated-program";

export interface MachineState {
  readonly tape: Tape;
  readonly pointer: Pointer;
  readonly input: readonly Cell[];
  readonly output: readonly Cell[];
}

export interface ExecState {
  readonly machine: MachineState;
  readonly pc: ProgramCounter;
}

export const initialMachineState = (input: readonly Cell[] = []): MachineState => ({
  tape: blankTape(),
  pointer: zeroPointer(),
  input,
  output: []
});

export const initialExecState = (input: readonly Cell[] = []): ExecState => ({
  machine: initialMachineState(input),
  pc: zeroProgramCounter()
});
