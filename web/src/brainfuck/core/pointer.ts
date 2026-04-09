import type { RuntimeError } from "./error";
import { err, ok, type Result } from "./result";

export const TAPE_LENGTH = 30000;

declare const pointerBrand: unique symbol;

export type Pointer = number & { readonly [pointerBrand]: "Pointer" };

export const makePointer = (value: number): Result<Pointer, RuntimeError> =>
  value >= 0 && value < TAPE_LENGTH
    ? ok<Pointer, RuntimeError>(value as Pointer)
    : err<Pointer, RuntimeError>({ tag: "pointerOutOfBounds" });

export const zeroPointer = (): Pointer => 0 as Pointer;

export const movePointerRight = (pointer: Pointer): Result<Pointer, RuntimeError> =>
  makePointer((pointer as number) + 1);

export const movePointerLeft = (pointer: Pointer): Result<Pointer, RuntimeError> =>
  makePointer((pointer as number) - 1);
