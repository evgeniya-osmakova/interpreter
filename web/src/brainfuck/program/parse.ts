import { ok, type Result } from "../core/result";
import type { ValidationError } from "../core/error";
import type { InstructionToken } from "../core/instruction";
import type { RawProgram } from "./raw-program";

export interface SourceInstruction {
  readonly sourceIndex: number;
  readonly token: InstructionToken;
  readonly char: string;
}

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

export const scanInstructions = (source: string): readonly SourceInstruction[] => {
  const instructions: SourceInstruction[] = [];

  Array.from(source).forEach((char, sourceIndex) => {
    const token = charToToken(char);
    if (token !== null) {
      instructions.push({ sourceIndex, token, char });
    }
  });

  return instructions;
};

export const parse = (source: string): Result<RawProgram, ValidationError> => {
  return ok<RawProgram, ValidationError>({
    instructions: scanInstructions(source).map((instruction) => instruction.token)
  });
};
