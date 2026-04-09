import type { InstructionToken } from "../core/instruction";

export interface RawProgram {
  readonly instructions: readonly InstructionToken[];
}
