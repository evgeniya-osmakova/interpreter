import Brainfuck.Semantics.Eval
import Brainfuck.Proofs.Validate

namespace Brainfuck.Proofs

open Brainfuck.Core
open Brainfuck.Program
open Brainfuck.Semantics

theorem runFuel_zero_returns_initial (program : ValidatedProgram)
    (state : ExecState program.length) :
    runFuel program 0 state = .ok state := rfl

theorem runFuel_terminated_state_returns_state (program : ValidatedProgram)
    (state : ExecState program.length)
    (fuel : Nat)
    (h : state.pc.val = program.length) :
    runFuel program fuel state = .ok state := by
  induction fuel with
  | zero =>
      rfl
  | succ remaining ih =>
      simp [runFuel, isTerminated, h]

theorem runFuel_succ_step_error (program : ValidatedProgram)
    (state : ExecState program.length)
    (remaining : Nat)
    (hterm : isTerminated program state = false)
    (error : RuntimeError)
    (hstep : step program state = .err error) :
    runFuel program (remaining + 1) state = .err error := by
  simp [runFuel, hterm, hstep]

theorem runFuel_succ_step_ok (program : ValidatedProgram)
    (state : ExecState program.length)
    (remaining : Nat)
    (hterm : isTerminated program state = false)
    (nextState : ExecState program.length)
    (hstep : step program state = .ok nextState) :
    runFuel program (remaining + 1) state = runFuel program remaining nextState := by
  simp [runFuel, hterm, hstep]

theorem runWithInput_zero_returns_initial_state (program : ValidatedProgram)
    (input : List Cell) :
    runWithInput program 0 input = .ok (ExecState.initial program.length input) := by
  simp [runWithInput, runFuel]

theorem runFuel_empty_program_returns_initial (state : ExecState ValidatedProgram.empty.length)
    (fuel : Nat) :
    runFuel ValidatedProgram.empty fuel state = .ok state := by
  apply runFuel_terminated_state_returns_state
  simp [ValidatedProgram.empty]

theorem runWithInput_empty_program_returns_initial (fuel : Nat) (input : List Cell) :
    runWithInput ValidatedProgram.empty fuel input =
      .ok (ExecState.initial ValidatedProgram.empty.length input) := by
  simp [runWithInput]
  apply runFuel_empty_program_returns_initial

end Brainfuck.Proofs
