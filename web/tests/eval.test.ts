import { describe, expect, it } from "vitest";
import { makeCell } from "../src/brainfuck/core/cell";
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
    const terminated = {
      machine: initialExecState().machine,
      pc: 1
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
});
