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

  it("resolves loop jump targets to next program counters", () => {
    const parsed = parse("[]");
    expect(parsed.tag).toBe("ok");
    if (parsed.tag !== "ok") {
      return;
    }

    expect(validate(parsed.value)).toEqual({
      tag: "ok",
      value: {
        length: 2,
        instructions: [
          { tag: "jumpIfZero", target: 2 },
          { tag: "jumpIfNonZero", target: 0 }
        ]
      }
    });
  });

  it("derives validated length from the instruction array", () => {
    const parsed = parse("+[]");
    expect(parsed.tag).toBe("ok");
    if (parsed.tag !== "ok") {
      return;
    }

    const validated = validate(parsed.value);
    expect(validated.tag).toBe("ok");
    if (validated.tag !== "ok") {
      return;
    }

    expect(validated.value.length).toBe(validated.value.instructions.length);
  });
});
