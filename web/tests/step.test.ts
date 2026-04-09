import { describe, expect, it } from "vitest";
import { makeCell } from "../src/brainfuck/core/cell";
import { parse } from "../src/brainfuck/program/parse";
import { validate } from "../src/brainfuck/program/validate";
import { initialExecState } from "../src/brainfuck/core/state";
import { writeTape } from "../src/brainfuck/core/tape";
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
    const state = {
      machine: {
        ...baseState.machine,
        tape: writeTape(baseState.machine.tape, baseState.machine.pointer, makeCell(1))
      },
      pc: 1
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
