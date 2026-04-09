# Brainfuck Two-Phase Repository

This repository is one Brainfuck system with two tightly related phases:

- `lean/` contains the Phase I Lean 4 formal model.
- `web/` contains the Phase II TypeScript interpreter, worker runtime, and browser UI shell.

The phases are mirrored intentionally rather than implemented as unrelated projects:

- `core` defines domain types and explicit `Result/Error` modeling.
- `program` separates raw parsing from validated program construction.
- `semantics` defines `step`, bounded evaluation, and execution contracts.
- `runtime` and `ui` exist only in `web/`, keeping the browser layer thin over the pure engine.

## Quick Start

### Lean

```bash
cd lean
lake build
```

### Web

```bash
cd web
npm install
npm test
npm run build
npm run dev
```

## Current Status

- `lean/` builds cleanly with `lake build`
- `web/` passes `npm test`
- `web/` builds with `npm run build`
- the TS engine correctly runs the canonical Brainfuck `Hello World`
- browser execution is non-blocking via `Web Worker` plus chunked `runSlice`

## Cross-Phase Mapping

| Concept | Lean | TypeScript |
| --- | --- | --- |
| Result | `Brainfuck.Core.Result` | `brainfuck/core/result.ts` |
| Tape and cells | `Cell`, `Tape`, `Pointer` | `cell.ts`, `tape.ts`, `pointer.ts` |
| Raw program | `RawProgram` | `raw-program.ts` |
| Validated program | `ValidatedProgram` | `validated-program.ts` |
| Validation | `Program.Validate` | `program/validate.ts` |
| Single-step semantics | `Semantics.step` | `semantics/step.ts` |
| Bounded evaluation | `Semantics.runFuel`, `Semantics.runSlice` | `semantics/eval.ts`, `run-slice.ts` |
| Async browser driver | n/a | `runtime/runner.ts`, `runner.worker.ts` |

## Browser Execution Model

The browser shell never executes the interpreter on the main thread.

- The pure interpreter lives under `web/src/brainfuck/`.
- The async driver lives under `web/src/runtime/`.
- `runner.worker.ts` hosts a `Web Worker`.
- The worker runs the pure engine in bounded slices via `runSlice`.
- After each slice it emits a serializable progress snapshot.
- The UI only renders those snapshots and sends `run` / `stop` requests.

This is better than timers on the main thread because non-terminating or long-running programs cannot freeze the UI thread.

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
- loop instructions carry resolved next program counters as `Fin (length + 1)`

Why this is the best tradeoff:

- In Lean, jump targets are in-bounds by construction, so `step` does not need extra runtime target checks or proof plumbing around invalid indices.
- In Lean, `jumpIfZero` can jump directly to normal termination when the matching `]` is the final instruction, which is a more exact operational model than storing only a bracket index.
- In Lean, program length is part of the type of both instructions and execution state, which makes step semantics and later proofs more direct.
- In TypeScript, the same shape mirrors naturally using a branded `JumpTarget` number produced only by validation.
- This is better than evaluating raw `[` and `]` tokens directly because the PDF requires bracket matching before execution.
- This is better than storing a separate external jump map because the target is carried by the validated instruction itself, so the mirrored structure stays local and explicit in both phases.

## TypeScript Tape Purity over `Uint8Array`

`web/src/brainfuck/core/tape.ts` wraps `Uint8Array` behind a small opaque API.

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

## Repository Layout

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
│       │   ├── Eval.lean
│       │   ├── Parse.lean
│       │   ├── Pointer.lean
│       │   ├── Step.lean
│       │   └── Validate.lean
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
    │   │       ├── eval.ts
    │   │       ├── run-slice.ts
    │   │       └── step.ts
    │   ├── runtime/
    │   │   ├── runner.ts
    │   │   ├── runner.worker.ts
    │   │   ├── snapshot.ts
    │   │   └── worker-protocol.ts
    │   ├── styles/
    │   │   └── app.css
    │   └── ui/
    │       ├── app.ts
    │       ├── controls.ts
    │       ├── examples.ts
    │       ├── inspector-view.ts
    │       ├── output-view.ts
    │       └── status-view.ts
    └── tests/
        ├── eval.test.ts
        ├── hello-world.test.ts
        ├── runtime.test.ts
        ├── step.test.ts
        └── validation.test.ts
```
