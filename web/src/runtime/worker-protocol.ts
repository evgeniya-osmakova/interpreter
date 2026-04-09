import type { Cell } from "../brainfuck/core/cell";
import type { TapeWindowCell } from "../brainfuck/core/tape";
import type { RuntimeError, ValidationError } from "../brainfuck/core/error";

export type WorkerRequest =
  | { readonly tag: "run"; readonly source: string; readonly input: readonly Cell[]; readonly budget: number }
  | { readonly tag: "stop" };

export interface MachineSnapshot {
  readonly pc: number;
  readonly pointer: number;
  readonly currentCell: number;
  readonly inputLength: number;
  readonly outputLength: number;
  readonly tapeWindow: readonly TapeWindowCell[];
}

export type OutputBytes = readonly number[];

export type WorkerEvent =
  | { readonly tag: "validationError"; readonly error: ValidationError }
  | { readonly tag: "runtimeError"; readonly error: RuntimeError }
  | {
      readonly tag: "progress";
      readonly snapshot: MachineSnapshot;
      readonly output: OutputBytes;
      readonly done: boolean;
      readonly stepsExecuted: number;
    }
  | { readonly tag: "stopped" };
