import {
  isProgramCounterTerminated,
  nextProgramCounter
} from "../core/program-counter";
import type { RuntimeError } from "../core/error";
import { movePointerLeft, movePointerRight } from "../core/pointer";
import { err, ok, type Result } from "../core/result";
import type { ExecState } from "../core/state";
import { decrementTapeCell, incrementTapeCell, readTape, writeTape } from "../core/tape";
import { getValidatedInstruction, type ValidatedProgram } from "../program/validated-program";

export const isTerminated = (program: ValidatedProgram, state: ExecState): boolean =>
  isProgramCounterTerminated(program, state.pc);

export const step = (
  program: ValidatedProgram,
  state: ExecState
): Result<ExecState, RuntimeError> => {
  if (isTerminated(program, state)) {
    return ok(state);
  }

  const instruction = getValidatedInstruction(program, state.pc);

  switch (instruction.tag) {
    case "moveRight": {
      const pointer = movePointerRight(state.machine.pointer);
      return pointer.tag === "ok"
        ? ok({
            machine: { ...state.machine, pointer: pointer.value },
            pc: nextProgramCounter(program, state.pc)
          })
        : err(pointer.error);
    }
    case "moveLeft": {
      const pointer = movePointerLeft(state.machine.pointer);
      return pointer.tag === "ok"
        ? ok({
            machine: { ...state.machine, pointer: pointer.value },
            pc: nextProgramCounter(program, state.pc)
          })
        : err(pointer.error);
    }
    case "increment":
      return ok({
        machine: {
          ...state.machine,
          tape: incrementTapeCell(state.machine.tape, state.machine.pointer)
        },
        pc: nextProgramCounter(program, state.pc)
      });
    case "decrement":
      return ok({
        machine: {
          ...state.machine,
          tape: decrementTapeCell(state.machine.tape, state.machine.pointer)
        },
        pc: nextProgramCounter(program, state.pc)
      });
    case "output": {
      const cell = readTape(state.machine.tape, state.machine.pointer);
      return ok({
        machine: {
          ...state.machine,
          output: [...state.machine.output, cell]
        },
        pc: nextProgramCounter(program, state.pc)
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
        pc: nextProgramCounter(program, state.pc)
      });
    }
    case "jumpIfZero": {
      const cell = readTape(state.machine.tape, state.machine.pointer);
      return ok({
        machine: state.machine,
        pc:
          (cell as number) === 0 ? instruction.target : nextProgramCounter(program, state.pc)
      });
    }
    case "jumpIfNonZero": {
      const cell = readTape(state.machine.tape, state.machine.pointer);
      return ok({
        machine: state.machine,
        pc:
          (cell as number) === 0
            ? nextProgramCounter(program, state.pc)
            : instruction.target
      });
    }
  }
};
