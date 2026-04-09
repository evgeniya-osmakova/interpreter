import Brainfuck.Program.Validate

namespace Brainfuck.Proofs

open Brainfuck.Core
open Brainfuck.Program

def emptyRawProgram : RawProgram := { instructions := #[] }

def simpleLoopRawProgram : RawProgram :=
  { instructions := #[InstructionToken.loopStart, InstructionToken.loopEnd] }

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
      .ok
        {
          length := 2
          instructions :=
            #v[
              ValidatedInstruction.jumpIfZero ⟨2, by decide⟩,
              ValidatedInstruction.jumpIfNonZero ⟨0, by decide⟩
            ]
        } := by
  native_decide

end Brainfuck.Proofs
