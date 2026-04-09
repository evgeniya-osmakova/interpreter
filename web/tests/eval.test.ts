import { describe, expect, it } from "vitest";
import { makeCell } from "../src/brainfuck/core/cell";
import { makeProgramCounter } from "../src/brainfuck/core/program-counter";
import { initialExecState } from "../src/brainfuck/core/state";
import { parse } from "../src/brainfuck/program/parse";
import { validate } from "../src/brainfuck/program/validate";
import { runFuel, runWithInput } from "../src/brainfuck/semantics/eval";
import { runSlice } from "../src/brainfuck/semantics/run-slice";

const parseAndValidate = (source: string) => {
  const parsed = parse(source);
  expect(parsed.tag).toBe("ok");
  if (parsed.tag !== "ok") {
    throw new Error("parse failed unexpectedly");
  }

  const validated = validate(parsed.value);
  expect(validated.tag).toBe("ok");
  if (validated.tag !== "ok") {
    throw new Error("validate failed unexpectedly");
  }

  return validated.value;
};

describe("eval semantics", () => {
  it("runFuel with zero fuel returns the initial state unchanged", () => {
    const program = parseAndValidate("+");
    const initial = initialExecState();
    const result = runFuel(program, 0, initial);

    expect(result).toEqual({
      tag: "ok",
      value: initial
    });
  });

  it("runFuel on a terminated state returns the same state for any fuel", () => {
    const program = parseAndValidate("+");
    const terminatedPc = makeProgramCounter(1, program.length);
    expect(terminatedPc).not.toBeNull();
    if (terminatedPc === null) {
      return;
    }
    const terminated = {
      machine: initialExecState().machine,
      pc: terminatedPc
    } as const;
    const result = runFuel(program, 100, terminated);

    expect(result).toEqual({
      tag: "ok",
      value: terminated
    });
  });

  it("runFuel propagates runtime errors", () => {
    const program = parseAndValidate("<");
    const result = runFuel(program, 10, initialExecState());

    expect(result).toEqual({
      tag: "err",
      error: { tag: "pointerOutOfBounds" }
    });
  });

  it("runWithInput on empty program terminates immediately", () => {
    const program = parseAndValidate("");
    const result = runWithInput(program, 100, [makeCell(65)]);

    expect(result.tag).toBe("ok");
    if (result.tag !== "ok") {
      return;
    }

    expect(result.value.pc).toBe(0);
    expect(result.value.machine.input).toEqual([makeCell(65)]);
    expect(result.value.machine.output).toEqual([]);
  });
});

describe("runSlice semantics", () => {
  it("returns immediately with zero budget", () => {
    const program = parseAndValidate("+");
    const initial = initialExecState();
    const result = runSlice(program, initial, 0);

    expect(result).toEqual({
      tag: "ok",
      value: {
        state: initial,
        stepsExecuted: 0,
        done: false
      }
    });
  });

  it("reports done for an already terminated state even with zero executed steps", () => {
    const program = parseAndValidate("+");
    const terminatedPc = makeProgramCounter(1, program.length);
    expect(terminatedPc).not.toBeNull();
    if (terminatedPc === null) {
      return;
    }
    const terminated = {
      machine: initialExecState().machine,
      pc: terminatedPc
    } as const;
    const result = runSlice(program, terminated, 10);

    expect(result).toEqual({
      tag: "ok",
      value: {
        state: terminated,
        stepsExecuted: 0,
        done: true
      }
    });
  });

  it("executes at most the requested budget", () => {
    const program = parseAndValidate("++");
    const result = runSlice(program, initialExecState(), 1);

    expect(result.tag).toBe("ok");
    if (result.tag !== "ok") {
      return;
    }

    expect(result.value.stepsExecuted).toBe(1);
    expect(result.value.state.pc).toBe(1);
    expect(result.value.done).toBe(false);
  });

  it("marks done when the program terminates within the slice", () => {
    const program = parseAndValidate("+");
    const result = runSlice(program, initialExecState(), 10);

    expect(result.tag).toBe("ok");
    if (result.tag !== "ok") {
      return;
    }

    expect(result.value.stepsExecuted).toBe(1);
    expect(result.value.state.pc).toBe(1);
    expect(result.value.done).toBe(true);
  });

  it("keeps done exactly in sync with termination of the returned state", () => {
    const partialProgram = parseAndValidate("++");
    const partial = runSlice(partialProgram, initialExecState(), 1);

    expect(partial.tag).toBe("ok");
    if (partial.tag !== "ok") {
      return;
    }

    expect(partial.value.done).toBe(partial.value.state.pc === partialProgram.length);

    const finishedProgram = parseAndValidate("+");
    const finished = runSlice(finishedProgram, initialExecState(), 10);

    expect(finished.tag).toBe("ok");
    if (finished.tag !== "ok") {
      return;
    }

    expect(finished.value.done).toBe(finished.value.state.pc === finishedProgram.length);
  });

  it("returns the same state as runFuel for the same budget", () => {
    const partialProgram = parseAndValidate("++");
    const partialSlice = runSlice(partialProgram, initialExecState(), 1);
    const partialFuel = runFuel(partialProgram, 1, initialExecState());

    expect(partialSlice.tag).toBe("ok");
    expect(partialFuel.tag).toBe("ok");
    if (partialSlice.tag !== "ok" || partialFuel.tag !== "ok") {
      return;
    }

    expect(partialSlice.value.state).toEqual(partialFuel.value);

    const finishedProgram = parseAndValidate("+");
    const finishedSlice = runSlice(finishedProgram, initialExecState(), 10);
    const finishedFuel = runFuel(finishedProgram, 10, initialExecState());

    expect(finishedSlice.tag).toBe("ok");
    expect(finishedFuel.tag).toBe("ok");
    if (finishedSlice.tag !== "ok" || finishedFuel.tag !== "ok") {
      return;
    }

    expect(finishedSlice.value.state).toEqual(finishedFuel.value);
  });

  it("exhausts the full budget whenever done is false", () => {
    const program = parseAndValidate("+[]");
    const result = runSlice(program, initialExecState(), 3);

    expect(result.tag).toBe("ok");
    if (result.tag !== "ok") {
      return;
    }

    expect(result.value.done).toBe(false);
    expect(result.value.stepsExecuted).toBe(3);
    expect(result.value.state.pc).toBeLessThan(program.length);
  });
});
