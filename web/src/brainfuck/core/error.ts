export type ValidationError =
  | { readonly tag: "unmatchedLoopStart"; readonly index: number }
  | { readonly tag: "unmatchedLoopEnd"; readonly index: number }
  | { readonly tag: "invalidJumpTarget"; readonly index: number; readonly target: number };

export type RuntimeError =
  | { readonly tag: "pointerOutOfBounds" }
  | { readonly tag: "inputExhausted" };
