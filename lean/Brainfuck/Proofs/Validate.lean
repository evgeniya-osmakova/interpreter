import Brainfuck.Program.Validate

namespace Brainfuck.Proofs

open Brainfuck.Core
open Brainfuck.Program

def emptyRawProgram : RawProgram := { instructions := #[] }

def simpleLoopRawProgram : RawProgram :=
  { instructions := #[InstructionToken.loopStart, InstructionToken.loopEnd] }

def simpleLoopProgram : ValidatedProgram :=
  {
    length := 2
    instructions :=
      #v[
        ValidatedInstruction.jumpIfZero ⟨2, by decide⟩,
        ValidatedInstruction.jumpIfNonZero ⟨0, by decide⟩
      ]
  }

theorem validate_empty_program :
    Validate.validate emptyRawProgram = .ok ValidatedProgram.empty := by
  native_decide

theorem validate_unmatched_loop_end :
    Validate.validate { instructions := #[InstructionToken.loopEnd] } =
      .err (.unmatchedLoopEnd 0) := by
  native_decide

theorem validate_unmatched_loop_start :
    Validate.validate { instructions := #[InstructionToken.loopStart] } =
      .err (.unmatchedLoopStart 0) := by
  native_decide

theorem validate_simple_loop_targets :
    Validate.validate simpleLoopRawProgram =
      .ok simpleLoopProgram := by
  native_decide

theorem validate_result_preserves_raw_length (program : RawProgram) :
    match Validate.validate program with
    | .ok validated => validated.length = program.instructions.size
    | .err _ => True := by
  cases h : Validate.validate program with
  | err error =>
      simp
  | ok validated =>
      unfold Validate.validate at h
      split at h <;> simp at h
      split at h <;> simp at h
      cases h
      simp

theorem validate_ok_preserves_raw_length (program : RawProgram) (validated : ValidatedProgram)
    (h : Validate.validate program = .ok validated) :
    validated.length = program.instructions.size := by
  simpa [h] using validate_result_preserves_raw_length program

end Brainfuck.Proofs
