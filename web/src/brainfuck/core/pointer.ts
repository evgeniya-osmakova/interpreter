import type { RuntimeError } from "./error";
import { err, ok, type Result } from "./result";

export const MIN_POINTER_INDEX = 0;
export const TAPE_LENGTH = 30000;
export const POINTER_STEP = 1;
export const TAPE_LAST_INDEX = TAPE_LENGTH - POINTER_STEP;

declare const pointerBrand: unique symbol;

export type Pointer = number & { readonly [pointerBrand]: "Pointer" };

export const makePointer = (value: number): Result<Pointer, RuntimeError> =>
  value >= MIN_POINTER_INDEX && value < TAPE_LENGTH
    ? ok<Pointer, RuntimeError>(value as Pointer)
    : err<Pointer, RuntimeError>({ tag: "pointerOutOfBounds" });

export const zeroPointer = (): Pointer => MIN_POINTER_INDEX as Pointer;

export const movePointerRight = (pointer: Pointer): Result<Pointer, RuntimeError> =>
  makePointer((pointer as number) + POINTER_STEP);

export const movePointerLeft = (pointer: Pointer): Result<Pointer, RuntimeError> =>
  makePointer((pointer as number) - POINTER_STEP);
