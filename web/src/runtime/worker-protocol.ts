import type { Cell } from "../brainfuck/core/cell";
import type { RuntimeError, ValidationError } from "../brainfuck/core/error";
import type { ExecState } from "../brainfuck/core/state";

export type WorkerRequest =
  | { readonly tag: "run"; readonly source: string; readonly input: readonly Cell[]; readonly budget: number }
  | { readonly tag: "stop" };

export type WorkerEvent =
  | { readonly tag: "validationError"; readonly error: ValidationError }
  | { readonly tag: "runtimeError"; readonly error: RuntimeError }
  | { readonly tag: "progress"; readonly state: ExecState; readonly done: boolean; readonly stepsExecuted: number }
  | { readonly tag: "stopped" };
