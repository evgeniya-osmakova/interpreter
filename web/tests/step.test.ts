import { describe, expect, it } from "vitest";
import { makeCell } from "../src/brainfuck/core/cell";
import { parse } from "../src/brainfuck/program/parse";
import { validate } from "../src/brainfuck/program/validate";
import { makeProgramCounter } from "../src/brainfuck/program/validated-program";
import { initialExecState } from "../src/brainfuck/core/state";
import { readTape, writeTape } from "../src/brainfuck/core/tape";
import { runWithInput } from "../src/brainfuck/semantics/eval";
import { step } from "../src/brainfuck/semantics/step";

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

describe("runtime errors", () => {
  it("returns pointerOutOfBounds when moving left from zero", () => {
    const program = parseAndValidate("<");
    const result = runWithInput(program, 1);

    expect(result).toEqual({
      tag: "err",
      error: { tag: "pointerOutOfBounds" }
    });
  });

  it("returns inputExhausted when reading with empty input", () => {
    const program = parseAndValidate(",");
    const result = runWithInput(program, 1);

    expect(result).toEqual({
      tag: "err",
      error: { tag: "inputExhausted" }
    });
  });
});

describe("non-loop step semantics", () => {
  it("increments the current cell and advances pc", () => {
    const program = parseAndValidate("+");
    const initial = initialExecState();
    const stepped = step(program, initial);

    expect(stepped.tag).toBe("ok");
    if (stepped.tag !== "ok") {
      return;
    }

    expect(stepped.value.pc).toBe(1);
    expect(readTape(stepped.value.machine.tape, stepped.value.machine.pointer)).toBe(makeCell(1));
    expect(stepped.value.machine.pointer).toBe(initial.machine.pointer);
  });

  it("decrements zero to 255 and advances pc", () => {
    const program = parseAndValidate("-");
    const stepped = step(program, initialExecState());

    expect(stepped.tag).toBe("ok");
    if (stepped.tag !== "ok") {
      return;
    }

    expect(stepped.value.pc).toBe(1);
    expect(readTape(stepped.value.machine.tape, stepped.value.machine.pointer)).toBe(
      makeCell(255)
    );
  });

  it("moves the pointer right and advances pc", () => {
    const program = parseAndValidate(">");
    const stepped = step(program, initialExecState());

    expect(stepped.tag).toBe("ok");
    if (stepped.tag !== "ok") {
      return;
    }

    expect(stepped.value.pc).toBe(1);
    expect(stepped.value.machine.pointer).toBe(1);
  });

  it("appends the current cell to output and advances pc", () => {
    const program = parseAndValidate(".");
    const initial = initialExecState();
    const pc = makeProgramCounter(0, program.length);
    expect(pc).not.toBeNull();
    if (pc === null) {
      return;
    }
    const state = {
      machine: {
        ...initial.machine,
        tape: writeTape(initial.machine.tape, initial.machine.pointer, makeCell("A".charCodeAt(0)))
      },
      pc
    } as const;
    const stepped = step(program, state);

    expect(stepped.tag).toBe("ok");
    if (stepped.tag !== "ok") {
      return;
    }

    expect(stepped.value.pc).toBe(1);
    expect(stepped.value.machine.output).toEqual([makeCell("A".charCodeAt(0))]);
  });

  it("consumes one input cell, writes it to tape, and advances pc", () => {
    const program = parseAndValidate(",");
    const stepped = step(program, initialExecState([makeCell(65), makeCell(66)]));

    expect(stepped.tag).toBe("ok");
    if (stepped.tag !== "ok") {
      return;
    }

    expect(stepped.value.pc).toBe(1);
    expect(readTape(stepped.value.machine.tape, stepped.value.machine.pointer)).toBe(makeCell(65));
    expect(stepped.value.machine.input).toEqual([makeCell(66)]);
  });
});

describe("loop step semantics", () => {
  it("jumps past the matching loop end when the current cell is zero", () => {
    const program = parseAndValidate("[]");
    const initial = initialExecState();
    const stepped = step(program, initial);

    expect(stepped.tag).toBe("ok");
    if (stepped.tag !== "ok") {
      return;
    }

    expect(stepped.value.pc).toBe(2);
    expect(stepped.value.machine).toBe(initial.machine);
  });

  it("jumps back to the matching loop start when the current cell is non-zero at loop end", () => {
    const program = parseAndValidate("[]");
    const baseState = initialExecState();
    const pc = makeProgramCounter(1, program.length);
    expect(pc).not.toBeNull();
    if (pc === null) {
      return;
    }
    const state = {
      machine: {
        ...baseState.machine,
        tape: writeTape(baseState.machine.tape, baseState.machine.pointer, makeCell(1))
      },
      pc
    } as const;
    const stepped = step(program, state);

    expect(stepped.tag).toBe("ok");
    if (stepped.tag !== "ok") {
      return;
    }

    expect(stepped.value.pc).toBe(0);
    expect(stepped.value.machine).toBe(state.machine);
  });

  it("writes input to tape and then outputs the same byte", () => {
    const program = parseAndValidate(",.");
    const result = runWithInput(program, 10, [makeCell("A".charCodeAt(0))]);

    expect(result.tag).toBe("ok");
    if (result.tag !== "ok") {
      return;
    }

    expect(result.value.machine.output).toEqual([makeCell("A".charCodeAt(0))]);
  });
});
