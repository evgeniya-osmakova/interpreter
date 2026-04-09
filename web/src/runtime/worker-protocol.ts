import { makeCell, type Cell } from "../brainfuck/core/cell";
import { err, ok, type Result } from "../brainfuck/core/result";
import type { TapeWindowCell } from "../brainfuck/core/tape";
import type { RuntimeError, ValidationError } from "../brainfuck/core/error";

export type WorkerRequest =
  | { readonly tag: "play"; readonly source: string; readonly input: readonly Cell[] }
  | { readonly tag: "step"; readonly source: string; readonly input: readonly Cell[] }
  | { readonly tag: "pause" }
  | { readonly tag: "stop" };

export type ProtocolError =
  | { readonly tag: "invalidRequest"; readonly detail: string }
  | { readonly tag: "invalidRunField"; readonly field: "source" | "input"; readonly detail: string };

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
  | { readonly tag: "paused" }
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

const isFiniteInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);

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

const decodeOutputBytes = (value: unknown): Result<OutputBytes, ProtocolError> => {
  if (!Array.isArray(value)) {
    return err({
      tag: "invalidRequest",
      detail: "expected output to be an array of byte values"
    });
  }

  const bytes: number[] = [];
  for (const item of value) {
    if (!isFiniteInteger(item) || item < 0 || item > 255) {
      return err({
        tag: "invalidRequest",
        detail: "expected each output byte to be an integer in the range 0..255"
      });
    }

    bytes.push(item);
  }

  return ok(bytes);
};

const decodeMachineSnapshot = (value: unknown): Result<MachineSnapshot, ProtocolError> => {
  if (!isRecord(value)) {
    return err({
      tag: "invalidRequest",
      detail: "expected snapshot to be an object"
    });
  }

  if (
    !isFiniteInteger(value.pc) ||
    !isFiniteInteger(value.pointer) ||
    !isFiniteInteger(value.currentCell) ||
    !isFiniteInteger(value.inputLength) ||
    !isFiniteInteger(value.outputLength)
  ) {
    return err({
      tag: "invalidRequest",
      detail: "expected numeric snapshot fields"
    });
  }

  if (!Array.isArray(value.tapeWindow)) {
    return err({
      tag: "invalidRequest",
      detail: "expected tapeWindow to be an array"
    });
  }

  const tapeWindow = value.tapeWindow.map((cell) => {
    if (
      !isRecord(cell) ||
      !isFiniteInteger(cell.index) ||
      !isFiniteInteger(cell.value) ||
      typeof cell.isPointer !== "boolean"
    ) {
      return null;
    }

    return {
      index: cell.index,
      value: cell.value,
      isPointer: cell.isPointer
    };
  });

  if (tapeWindow.some((cell) => cell === null)) {
    return err({
      tag: "invalidRequest",
      detail: "expected tapeWindow cells to have numeric indices, numeric values, and boolean pointer flags"
    });
  }

  return ok({
    pc: value.pc,
    pointer: value.pointer,
    currentCell: value.currentCell,
    inputLength: value.inputLength,
    outputLength: value.outputLength,
    tapeWindow: tapeWindow as MachineSnapshot["tapeWindow"]
  });
};

const decodeValidationError = (value: unknown): Result<ValidationError, ProtocolError> => {
  if (!isRecord(value) || typeof value.tag !== "string") {
    return err({
      tag: "invalidRequest",
      detail: "expected validation error object"
    });
  }

  switch (value.tag) {
    case "unmatchedLoopStart":
    case "unmatchedLoopEnd":
      return isFiniteInteger(value.index)
        ? ok({ tag: value.tag, index: value.index })
        : err({ tag: "invalidRequest", detail: "expected validation error index" });
    case "invalidJumpTarget":
      return isFiniteInteger(value.index) && isFiniteInteger(value.target)
        ? ok({ tag: "invalidJumpTarget", index: value.index, target: value.target })
        : err({ tag: "invalidRequest", detail: "expected invalidJumpTarget indices" });
    default:
      return err({
        tag: "invalidRequest",
        detail: "unknown validation error tag"
      });
  }
};

const decodeRuntimeError = (value: unknown): Result<RuntimeError, ProtocolError> => {
  if (!isRecord(value) || typeof value.tag !== "string") {
    return err({
      tag: "invalidRequest",
      detail: "expected runtime error object"
    });
  }

  if (value.tag === "pointerOutOfBounds" || value.tag === "inputExhausted") {
    return ok({ tag: value.tag });
  }

  return err({
    tag: "invalidRequest",
    detail: "unknown runtime error tag"
  });
};

const decodeProtocolError = (value: unknown): Result<ProtocolError, ProtocolError> => {
  if (!isRecord(value) || typeof value.tag !== "string") {
    return err({
      tag: "invalidRequest",
      detail: "expected protocol error object"
    });
  }

  switch (value.tag) {
    case "invalidRequest":
      return typeof value.detail === "string"
        ? ok({ tag: "invalidRequest", detail: value.detail })
        : err({ tag: "invalidRequest", detail: "expected invalidRequest detail" });
    case "invalidRunField":
      return (value.field === "source" || value.field === "input") &&
          typeof value.detail === "string"
        ? ok({ tag: "invalidRunField", field: value.field, detail: value.detail })
        : err({ tag: "invalidRequest", detail: "expected invalidRunField payload" });
    default:
      return err({
        tag: "invalidRequest",
        detail: "unknown protocol error tag"
      });
  }
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

  if (value.tag === "pause") {
    return ok({ tag: "pause" });
  }

  if (value.tag !== "play" && value.tag !== "step") {
    return err({
      tag: "invalidRequest",
      detail: "expected request tag 'play', 'step', 'pause', or 'stop'"
    });
  }

  if (typeof value.source !== "string") {
    return err({
      tag: "invalidRunField",
      field: "source",
      detail: "expected source to be a string"
    });
  }

  const input = decodeInput(value.input);
  if (input.tag === "err") {
    return input;
  }

  return ok({
    tag: value.tag,
    source: value.source,
    input: input.value
  });
};

export const decodeWorkerEvent = (value: unknown): Result<WorkerEvent, ProtocolError> => {
  if (!isRecord(value) || typeof value.tag !== "string") {
    return err({
      tag: "invalidRequest",
      detail: "expected an event object"
    });
  }

  switch (value.tag) {
    case "validationError": {
      const decoded = decodeValidationError(value.error);
      return decoded.tag === "ok"
        ? ok({ tag: "validationError", error: decoded.value })
        : decoded;
    }
    case "runtimeError": {
      const decoded = decodeRuntimeError(value.error);
      return decoded.tag === "ok"
        ? ok({ tag: "runtimeError", error: decoded.value })
        : decoded;
    }
    case "protocolError": {
      const decoded = decodeProtocolError(value.error);
      return decoded.tag === "ok"
        ? ok({ tag: "protocolError", error: decoded.value })
        : decoded;
    }
    case "paused":
      return ok({ tag: "paused" });
    case "stopped":
      return ok({ tag: "stopped" });
    case "progress": {
      const snapshot = decodeMachineSnapshot(value.snapshot);
      if (snapshot.tag === "err") {
        return snapshot;
      }

      const output = decodeOutputBytes(value.output);
      if (output.tag === "err") {
        return output;
      }

      if (typeof value.done !== "boolean" || !isFiniteInteger(value.stepsExecuted)) {
        return err({
          tag: "invalidRequest",
          detail: "expected progress to include boolean done and integer stepsExecuted"
        });
      }

      return ok({
        tag: "progress",
        snapshot: snapshot.value,
        output: output.value,
        done: value.done,
        stepsExecuted: value.stepsExecuted
      });
    }
    default:
      return err({
        tag: "invalidRequest",
        detail: "unknown worker event tag"
      });
  }
};
