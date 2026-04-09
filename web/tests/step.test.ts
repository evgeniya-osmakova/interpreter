import { describe, expect, it } from "vitest";
import { parse } from "../src/brainfuck/program/parse";
import { validate } from "../src/brainfuck/program/validate";
import { runWithInput } from "../src/brainfuck/semantics/eval";

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
