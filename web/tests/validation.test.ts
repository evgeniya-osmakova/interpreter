import { describe, expect, it } from "vitest";
import { parse } from "../src/brainfuck/program/parse";
import { validate } from "../src/brainfuck/program/validate";

describe("validation", () => {
  it("ignores non-Brainfuck characters during parsing", () => {
    const parsed = parse("a+b c");
    expect(parsed).toEqual({
      tag: "ok",
      value: {
        instructions: ["increment"]
      }
    });
  });

  it("rejects unmatched loop end", () => {
    const parsed = parse("]");
    expect(parsed.tag).toBe("ok");
    if (parsed.tag !== "ok") {
      return;
    }

    expect(validate(parsed.value)).toEqual({
      tag: "err",
      error: {
        tag: "unmatchedLoopEnd",
        index: 0
      }
    });
  });

  it("rejects unmatched loop start", () => {
    const parsed = parse("[");
    expect(parsed.tag).toBe("ok");
    if (parsed.tag !== "ok") {
      return;
    }

    expect(validate(parsed.value)).toEqual({
      tag: "err",
      error: {
        tag: "unmatchedLoopStart",
        index: 0
      }
    });
  });
});
