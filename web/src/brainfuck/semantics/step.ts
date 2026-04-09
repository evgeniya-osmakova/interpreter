import type { RuntimeError } from "../core/error";
import { movePointerLeft, movePointerRight } from "../core/pointer";
import { err, ok, type Result } from "../core/result";
import type { ExecState } from "../core/state";
import { decrementTapeCell, incrementTapeCell, readTape, writeTape } from "../core/tape";
import type { ValidatedProgram } from "../program/validated-program";

export const isTerminated = (program: ValidatedProgram, state: ExecState): boolean =>
  state.pc >= program.length;

const nextPc = (program: ValidatedProgram, pc: number): number =>
  Math.min(pc + 1, program.length);

export const step = (
  program: ValidatedProgram,
  state: ExecState
): Result<ExecState, RuntimeError> => {
  if (isTerminated(program, state)) {
    return ok(state);
  }

  const instruction = program.instructions[state.pc];
  if (instruction === undefined) {
    return ok(state);
  }

  switch (instruction.tag) {
    case "moveRight": {
      const pointer = movePointerRight(state.machine.pointer);
      return pointer.tag === "ok"
        ? ok({
            machine: { ...state.machine, pointer: pointer.value },
            pc: nextPc(program, state.pc)
          })
        : err(pointer.error);
    }
    case "moveLeft": {
      const pointer = movePointerLeft(state.machine.pointer);
      return pointer.tag === "ok"
        ? ok({
            machine: { ...state.machine, pointer: pointer.value },
            pc: nextPc(program, state.pc)
          })
        : err(pointer.error);
    }
    case "increment":
      return ok({
        machine: {
          ...state.machine,
          tape: incrementTapeCell(state.machine.tape, state.machine.pointer)
        },
        pc: nextPc(program, state.pc)
      });
    case "decrement":
      return ok({
        machine: {
          ...state.machine,
          tape: decrementTapeCell(state.machine.tape, state.machine.pointer)
        },
        pc: nextPc(program, state.pc)
      });
    case "output": {
      const cell = readTape(state.machine.tape, state.machine.pointer);
      return ok({
        machine: {
          ...state.machine,
          output: [...state.machine.output, cell]
        },
        pc: nextPc(program, state.pc)
      });
    }
    case "input": {
      const [head, ...tail] = state.machine.input;
      if (head === undefined) {
        return err({ tag: "inputExhausted" });
      }

      return ok({
        machine: {
          ...state.machine,
          tape: writeTape(state.machine.tape, state.machine.pointer, head),
          input: tail
        },
        pc: nextPc(program, state.pc)
      });
    }
    case "jumpIfZero": {
      const cell = readTape(state.machine.tape, state.machine.pointer);
      return ok({
        machine: state.machine,
        pc: (cell as number) === 0 ? (instruction.target as number) : nextPc(program, state.pc)
      });
    }
    case "jumpIfNonZero": {
      const cell = readTape(state.machine.tape, state.machine.pointer);
      return ok({
        machine: state.machine,
        pc: (cell as number) === 0 ? nextPc(program, state.pc) : (instruction.target as number)
      });
    }
  }
};
