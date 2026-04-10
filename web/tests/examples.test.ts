import { describe, expect, it } from "vitest";
import type { Cell } from "../src/brainfuck/core/cell";
import { parse } from "../src/brainfuck/program/parse";
import { validate } from "../src/brainfuck/program/validate";
import { runWithInput } from "../src/brainfuck/semantics/eval";
import { PROGRAM_EXAMPLES } from "../src/helpers/examples";

const bytesToText = (bytes: readonly Cell[]): string =>
  bytes.map((byte) => String.fromCharCode(byte as number)).join("");

const runSource = (source: string): string => {
  const parsed = parse(source);
  expect(parsed.tag).toBe("ok");
  if (parsed.tag !== "ok") {
    return "";
  }

  const validated = validate(parsed.value);
  expect(validated.tag).toBe("ok");
  if (validated.tag !== "ok") {
    return "";
  }

  const result = runWithInput(validated.value, 50000);
  expect(result.tag).toBe("ok");
  if (result.tag !== "ok") {
    return "";
  }

  return bytesToText(result.value.machine.output);
};

describe("example programs", () => {
  it("Print A example actually emits A", () => {
    const printA = PROGRAM_EXAMPLES.find((example) => example.id === "count-a");
    expect(printA).toBeDefined();
    if (printA === undefined) {
      return;
    }

    expect(runSource(printA.source)).toBe("A");
  });
});
