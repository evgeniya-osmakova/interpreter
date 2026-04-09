import { describe, expect, it } from "vitest";
import {
  countTextCharacters,
  countUtf8Bytes,
  decodeBytesToText,
  encodeTextToCells
} from "../src/ui/text-codec";

describe("ui text codec", () => {
  it("encodes and decodes UTF-8 text at the browser boundary", () => {
    const text = "A🙂";
    const bytes = encodeTextToCells(text);

    expect(bytes.map((byte) => byte as number)).toEqual([65, 240, 159, 153, 130]);
    expect(countTextCharacters(text)).toBe(2);
    expect(countUtf8Bytes(text)).toBe(5);
    expect(decodeBytesToText(bytes.map((byte) => byte as number))).toBe(text);
  });
});
