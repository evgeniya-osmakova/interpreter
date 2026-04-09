import type { Cell } from "../brainfuck/core/cell";
import { makeCell } from "../brainfuck/core/cell";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

export const encodeTextToCells = (text: string): readonly Cell[] =>
  Array.from(textEncoder.encode(text), (byte) => makeCell(byte));

export const decodeBytesToText = (bytes: readonly number[]): string =>
  textDecoder.decode(Uint8Array.from(bytes));

export const countTextCharacters = (text: string): number =>
  Array.from(text).length;

export const countUtf8Bytes = (text: string): number =>
  textEncoder.encode(text).length;
