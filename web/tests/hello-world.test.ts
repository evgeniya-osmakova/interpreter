import { describe, expect, it } from "vitest";
import type { Cell } from "../src/brainfuck/core/cell";
import { parse } from "../src/brainfuck/program/parse";
import { validate } from "../src/brainfuck/program/validate";
import { runWithInput } from "../src/brainfuck/semantics/eval";

const bytesToText = (bytes: readonly Cell[]): string =>
  bytes.map((byte) => String.fromCharCode(byte as number)).join("");

describe("Brainfuck Hello World", () => {
  it("produces the canonical output", () => {
    const source =
      "++++++++++[>+++++++>++++++++++>+++>+<<<<-]>" +
      "++.>+.+++++++..+++.>++.<<+++++++++++++++." +
      ">.+++.------.--------.>+.>.";

    const parsed = parse(source);
    expect(parsed.tag).toBe("ok");
    if (parsed.tag !== "ok") {
      return;
    }

    const validated = validate(parsed.value);
    expect(validated.tag).toBe("ok");
    if (validated.tag !== "ok") {
      return;
    }

    const result = runWithInput(validated.value, 200000);
    expect(result.tag).toBe("ok");
    if (result.tag !== "ok") {
      return;
    }

    expect(bytesToText(result.value.machine.output)).toBe("Hello World!\n");
  });
});
