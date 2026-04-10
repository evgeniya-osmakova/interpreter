import { TAPE_LAST_INDEX, MIN_POINTER_INDEX } from "../brainfuck/core/pointer";
import type { RuntimeError, ValidationError } from "../brainfuck/core/error";
import type { ProtocolError } from "../runtime/protocol/worker-protocol";

const formatTapeIndex = (value: number): string => new Intl.NumberFormat("en-US").format(value);

export const formatValidationError = (error: ValidationError): string => {
  switch (error.tag) {
    case "unmatchedLoopStart":
      return `A loop starts at instruction ${error.index}, but no matching ] was found.`;
    case "unmatchedLoopEnd":
      return `A ] appears at instruction ${error.index}, but there is no matching [.`;
    case "invalidJumpTarget":
      return `The validated loop jump at instruction ${error.index} points to invalid target ${error.target}.`;
  }
};

export const formatRuntimeError = (error: RuntimeError): string => {
  switch (error.tag) {
    case "pointerOutOfBounds":
      return `The pointer tried to move outside the tape. Valid cells are ${MIN_POINTER_INDEX} through ${formatTapeIndex(TAPE_LAST_INDEX)}.`;
    case "inputExhausted":
      return "The program tried to read another byte, but Program input has no bytes left.";
  }
};

export const formatProtocolError = (error: ProtocolError): string => {
  switch (error.tag) {
    case "invalidRequest":
      return "The browser and worker could not agree on a valid message shape.";
    case "invalidRunField":
      return `The ${error.field} field could not be decoded by the worker.`;
  }
};
