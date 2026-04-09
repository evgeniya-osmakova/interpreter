import Brainfuck.Program.ValidatedProgram
import Brainfuck.Semantics.Step

namespace Brainfuck.Proofs

open Brainfuck.Program
open Brainfuck.Semantics
open Brainfuck.Core

theorem nextPc_in_bounds {programLength : Nat} (pc : Fin (programLength + 1)) :
    (nextPc pc).val < programLength + 1 :=
  (nextPc pc).isLt

theorem jumpPc_in_bounds {programLength : Nat} (target : ProgramIndex programLength) :
    (jumpPc target).val < programLength + 1 :=
  (jumpPc target).isLt

theorem step_on_terminated_state_is_ok (program : ValidatedProgram)
    (state : ExecState program.length) (h : state.pc.val = program.length) :
    step program state = .ok state := by
  unfold step
  simp [h]

end Brainfuck.Proofs
