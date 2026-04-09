import type { Cell } from "./cell";
import type { Pointer } from "./pointer";
import { blankTape, type Tape } from "./tape";
import { zeroPointer } from "./pointer";

export interface MachineState {
  readonly tape: Tape;
  readonly pointer: Pointer;
  readonly input: readonly Cell[];
  readonly output: readonly Cell[];
}

export interface ExecState {
  readonly machine: MachineState;
  readonly pc: number;
}

export const initialMachineState = (input: readonly Cell[] = []): MachineState => ({
  tape: blankTape(),
  pointer: zeroPointer(),
  input,
  output: []
});

export const initialExecState = (input: readonly Cell[] = []): ExecState => ({
  machine: initialMachineState(input),
  pc: 0
});
