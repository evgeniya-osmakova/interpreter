import type { ValidationError } from "../core/error";
import { err, ok, type Result } from "../core/result";
import type { InstructionToken } from "../core/instruction";
import type { RawProgram } from "./raw-program";
import {
  type ProgramCounter,
  makeValidatedTarget,
  makeValidatedProgram,
  type ValidatedInstruction,
  type ValidatedProgram
} from "./validated-program";

const DEFAULT_JUMP_TARGET_OFFSET = 0;
const LOOP_START_NEXT_INSTRUCTION_OFFSET = 1;

const buildJumpMap = (
  instructions: readonly InstructionToken[]
): Result<Map<number, number>, ValidationError> => {
  const stack: number[] = [];
  const jumps = new Map<number, number>();

  for (const [index, token] of instructions.entries()) {
    if (token === "loopStart") {
      stack.push(index);
      continue;
    }

    if (token === "loopEnd") {
      const start = stack.pop();
      if (start === undefined) {
        return err<Map<number, number>, ValidationError>({ tag: "unmatchedLoopEnd", index });
      }
      jumps.set(start, index);
      jumps.set(index, start);
    }
  }

  const unmatchedStart = stack.pop();
  if (unmatchedStart !== undefined) {
    return err<Map<number, number>, ValidationError>({
      tag: "unmatchedLoopStart",
      index: unmatchedStart
    });
  }

  return ok<Map<number, number>, ValidationError>(jumps);
};

const resolveTarget = (
  jumps: Map<number, number>,
  sourceIndex: number,
  length: number,
  offset = DEFAULT_JUMP_TARGET_OFFSET
): Result<ProgramCounter, ValidationError> => {
  const target = jumps.get(sourceIndex);
  if (target === undefined) {
    return err<ProgramCounter, ValidationError>({
      tag: "invalidJumpTarget",
      index: sourceIndex,
      target: sourceIndex
    });
  }

  return makeValidatedTarget(target + offset, length, sourceIndex);
};

const tokenToValidatedInstruction = (
  token: InstructionToken,
  index: number,
  length: number,
  jumps: Map<number, number>
): Result<ValidatedInstruction, ValidationError> => {
  switch (token) {
    case "moveRight":
      return ok({ tag: "moveRight" });
    case "moveLeft":
      return ok({ tag: "moveLeft" });
    case "increment":
      return ok({ tag: "increment" });
    case "decrement":
      return ok({ tag: "decrement" });
    case "output":
      return ok({ tag: "output" });
    case "input":
      return ok({ tag: "input" });
    case "loopStart": {
      const target = resolveTarget(jumps, index, length, LOOP_START_NEXT_INSTRUCTION_OFFSET);
      return target.tag === "ok"
        ? ok({ tag: "jumpIfZero", target: target.value })
        : err(target.error);
    }
    case "loopEnd": {
      const target = resolveTarget(jumps, index, length);
      return target.tag === "ok"
        ? ok({ tag: "jumpIfNonZero", target: target.value })
        : err(target.error);
    }
  }
};

export const validate = (program: RawProgram): Result<ValidatedProgram, ValidationError> => {
  const jumpMapResult = buildJumpMap(program.instructions);
  if (jumpMapResult.tag === "err") {
    return jumpMapResult;
  }

  const instructions: ValidatedInstruction[] = [];

  for (const [index, token] of program.instructions.entries()) {
    const instruction = tokenToValidatedInstruction(
      token,
      index,
      program.instructions.length,
      jumpMapResult.value
    );

    if (instruction.tag === "err") {
      return instruction;
    }

    instructions.push(instruction.value);
  }

  return ok(makeValidatedProgram(instructions));
};
