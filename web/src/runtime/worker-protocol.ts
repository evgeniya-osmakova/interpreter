import { makeCell, type Cell } from "../brainfuck/core/cell";
import { err, ok, type Result } from "../brainfuck/core/result";
import type { TapeWindowCell } from "../brainfuck/core/tape";
import type { RuntimeError, ValidationError } from "../brainfuck/core/error";

export type WorkerRequest =
  | { readonly tag: "run"; readonly source: string; readonly input: readonly Cell[]; readonly budget: number }
  | { readonly tag: "stop" };

export type ProtocolError =
  | { readonly tag: "invalidRequest"; readonly detail: string }
  | { readonly tag: "invalidRunField"; readonly field: "source" | "input" | "budget"; readonly detail: string };

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
  | { readonly tag: "protocolError"; readonly error: ProtocolError }
  | {
      readonly tag: "progress";
      readonly snapshot: MachineSnapshot;
      readonly output: OutputBytes;
      readonly done: boolean;
      readonly stepsExecuted: number;
    }
  | { readonly tag: "stopped" };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const decodeInput = (value: unknown): Result<readonly Cell[], ProtocolError> => {
  if (!Array.isArray(value)) {
    return err({
      tag: "invalidRunField",
      field: "input",
      detail: "expected an array of byte values"
    });
  }

  const cells: Cell[] = [];
  for (const item of value) {
    if (!Number.isInteger(item) || item < 0 || item > 255) {
      return err({
        tag: "invalidRunField",
        field: "input",
        detail: "expected each input byte to be an integer in the range 0..255"
      });
    }

    cells.push(makeCell(item));
  }

  return ok(cells);
};

export const decodeWorkerRequest = (value: unknown): Result<WorkerRequest, ProtocolError> => {
  if (!isRecord(value)) {
    return err({
      tag: "invalidRequest",
      detail: "expected a request object"
    });
  }

  if (value.tag === "stop") {
    return ok({ tag: "stop" });
  }

  if (value.tag !== "run") {
    return err({
      tag: "invalidRequest",
      detail: "expected request tag 'run' or 'stop'"
    });
  }

  if (typeof value.source !== "string") {
    return err({
      tag: "invalidRunField",
      field: "source",
      detail: "expected source to be a string"
    });
  }

  if (typeof value.budget !== "number" || !Number.isFinite(value.budget)) {
    return err({
      tag: "invalidRunField",
      field: "budget",
      detail: "expected budget to be a finite number"
    });
  }

  const input = decodeInput(value.input);
  if (input.tag === "err") {
    return input;
  }

  return ok({
    tag: "run",
    source: value.source,
    input: input.value,
    budget: value.budget
  });
};
