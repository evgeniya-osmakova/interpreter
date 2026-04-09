# Brainfuck Two-Phase Repository

This repository is a single Brainfuck system with two tightly related phases:

- `lean/` contains the Phase I Lean 4 formal model.
- `web/` contains the Phase II TypeScript interpreter, worker runtime, and minimal browser UI shell.

The architecture is intentionally mirrored across both phases:

- `core` defines domain types and explicit `Result/Error` modeling.
- `program` separates raw source parsing from validated program construction.
- `semantics` defines `step` and bounded evaluation helpers.
- `runtime` and `ui` exist only in `web/`, keeping the browser layer thin.

## PDF Requirements vs Candidate Design Decisions

The following items are direct PDF requirements:

- fixed tape size of `30000`
- cell range `0..255` with modulo `256` arithmetic
- well-typed pointer out-of-bounds error
- separate parsing and evaluation phases
- validated program consumed by the evaluator
- pure TypeScript engine with no in-place mutation of existing interpreter state
- non-blocking browser execution

The following items are explicit candidate design decisions and are not prescribed by the PDF:

- Candidate design decision: Phase II lives in `web/` rather than `ts/` because the deliverable includes both engine and browser UI.
- Candidate design decision: `,` on empty input returns `RuntimeError.inputExhausted` instead of silently writing `0` or leaving the cell unchanged. This fits the repository-wide preference for explicit error modeling.
- Candidate design decision: non-Brainfuck characters are ignored during parsing and never reach validation. This keeps the parser permissive while preserving the required separation `source -> parse -> validate -> evaluate`.
- Candidate design decision: UI output is rendered as text, but the engine itself models input and output as byte sequences.
- Candidate design decision: browser execution uses a `Web Worker` plus chunked `runSlice` evaluation, rather than timers on the main thread.

## Chosen Validated Program Design

This repository commits to one concrete validated program design:

- raw parsing produces `RawProgram` as a flat sequence of Brainfuck tokens
- validation produces `ValidatedProgram`
- `ValidatedProgram` stores:
  - `length : Nat`
  - `instructions : Vector (ValidatedInstruction length) length`
- loop instructions carry resolved jump targets as `Fin length`

Why this is the best tradeoff:

- In Lean, jump targets are in-bounds by construction, so `step` does not need extra runtime target checks or proof plumbing around invalid indices.
- In Lean, program length is part of the type of both instructions and execution state, which makes step semantics and later proofs more direct.
- In TypeScript, the same shape mirrors naturally using a branded `ProgramIndex` number produced only by validation.
- This is better than evaluating raw `[` and `]` tokens directly because the PDF requires bracket matching before execution.
- This is better than storing a separate external jump map because the target is carried by the validated instruction itself, so the mirrored structure stays local and explicit in both phases.

## TypeScript Tape Purity over `Uint8Array`

`web/src/brainfuck/core/tape.ts` will wrap `Uint8Array` behind a small opaque API.

Purity is preserved as follows:

- existing interpreter state objects are never mutated
- the wrapper never exposes the live mutable `Uint8Array` for external writes
- each update operation allocates a fresh `Uint8Array`, copies the previous bytes, applies the change to the fresh copy, and returns a new `Tape`
- the previous `Tape` and previous `ExecState` remain unchanged and reusable

This is still pure even though the implementation writes into a newly allocated local buffer, because no existing observable state is mutated in place.

This is a better starting tradeoff than exposing raw `number[]`:

- it matches the byte-oriented domain more closely
- it keeps fixed-width cell storage obvious
- it leaves room for later internal optimization without changing the public engine API

## Repository Scaffold

```text
.
├── README.md
├── AGENTS.md
├── docs/
│   └── assignment-spec.md
├── lean/
│   ├── lakefile.toml
│   ├── lean-toolchain
│   ├── Brainfuck.lean
│   └── Brainfuck/
│       ├── Core/
│       │   ├── Cell.lean
│       │   ├── Error.lean
│       │   ├── Instruction.lean
│       │   ├── Pointer.lean
│       │   ├── Result.lean
│       │   ├── State.lean
│       │   └── Tape.lean
│       ├── Program/
│       │   ├── Parse.lean
│       │   ├── RawProgram.lean
│       │   ├── Validate.lean
│       │   └── ValidatedProgram.lean
│       ├── Proofs/
│       │   ├── Cell.lean
│       │   └── Step.lean
│       └── Semantics/
│           ├── Eval.lean
│           └── Step.lean
└── web/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── src/
    │   ├── main.ts
    │   ├── brainfuck/
    │   │   ├── core/
    │   │   │   ├── cell.ts
    │   │   │   ├── error.ts
    │   │   │   ├── instruction.ts
    │   │   │   ├── pointer.ts
    │   │   │   ├── result.ts
    │   │   │   ├── state.ts
    │   │   │   └── tape.ts
    │   │   ├── program/
    │   │   │   ├── parse.ts
    │   │   │   ├── raw-program.ts
    │   │   │   ├── validate.ts
    │   │   │   └── validated-program.ts
    │   │   └── semantics/
    │   │       ├── run-slice.ts
    │   │       └── step.ts
    │   ├── runtime/
    │   │   ├── runner.worker.ts
    │   │   └── worker-protocol.ts
    │   ├── styles/
    │   │   └── app.css
    │   └── ui/
    │       ├── app.ts
    │       ├── controls.ts
    │       ├── output-view.ts
    │       └── status-view.ts
    └── tests/
        ├── hello-world.test.ts
        ├── step.test.ts
        └── validation.test.ts
```
