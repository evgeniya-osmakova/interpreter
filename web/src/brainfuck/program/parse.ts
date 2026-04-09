import { ok, type Result } from "../core/result";
import type { ValidationError } from "../core/error";
import type { InstructionToken } from "../core/instruction";
import type { RawProgram } from "./raw-program";

const charToToken = (char: string): InstructionToken | null => {
  switch (char) {
    case ">":
      return "moveRight";
    case "<":
      return "moveLeft";
    case "+":
      return "increment";
    case "-":
      return "decrement";
    case ".":
      return "output";
    case ",":
      return "input";
    case "[":
      return "loopStart";
    case "]":
      return "loopEnd";
    default:
      return null;
  }
};

export const parse = (source: string): Result<RawProgram, ValidationError> => {
  const instructions: InstructionToken[] = [];

  for (const char of source) {
    const token = charToToken(char);
    if (token !== null) {
      instructions.push(token);
    }
  }

  return ok<RawProgram, ValidationError>({ instructions });
};
