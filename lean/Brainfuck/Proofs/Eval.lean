import Brainfuck.Semantics.Eval
import Brainfuck.Proofs.Validate

namespace Brainfuck.Proofs

open Brainfuck.Core
open Brainfuck.Program
open Brainfuck.Semantics

theorem runSlice_zero_budget_returns_initial (program : ValidatedProgram)
    (state : ExecState program.length) :
    runSlice program state 0 =
      .ok
        {
          state := state
          stepsExecuted := 0
          done := isTerminated program state
        } := rfl

theorem runSlice_terminated_state_returns_done (program : ValidatedProgram)
    (state : ExecState program.length)
    (budget : Nat)
    (h : state.pc.val = program.length) :
    runSlice program state budget =
      .ok
        {
          state := state
          stepsExecuted := 0
          done := true
        } := by
  cases budget with
  | zero =>
      simp [runSlice, isTerminated, h]
  | succ remaining =>
      simp [runSlice, isTerminated, h]

theorem runSlice_succ_step_error (program : ValidatedProgram)
    (state : ExecState program.length)
    (remaining : Nat)
    (hterm : isTerminated program state = false)
    (error : RuntimeError)
    (hstep : step program state = .err error) :
    runSlice program state (remaining + 1) = .err error := by
  simp [runSlice, hterm, hstep]

theorem runSlice_ok_steps_le_budget (program : ValidatedProgram)
    (state : ExecState program.length)
    (budget : Nat)
    (progress : SliceProgress program.length)
    (h : runSlice program state budget = .ok progress) :
    progress.stepsExecuted ≤ budget := by
  induction budget generalizing state progress with
  | zero =>
      simp [runSlice] at h
      cases h
      simp
  | succ remaining ih =>
      unfold runSlice at h
      by_cases hterm : isTerminated program state
      · simp [hterm] at h
        cases h
        simp
      · simp [hterm] at h
        cases hstep : step program state with
        | err error =>
            simp [hstep] at h
        | ok nextState =>
            cases hslice : runSlice program nextState remaining with
            | err error =>
                simp [hstep, hslice] at h
            | ok nextProgress =>
                simp [hstep, hslice] at h
                cases h
                have hle := ih nextState nextProgress hslice
                exact Nat.succ_le_succ hle

theorem runSlice_ok_done_matches_termination (program : ValidatedProgram)
    (state : ExecState program.length)
    (budget : Nat)
    (progress : SliceProgress program.length)
    (h : runSlice program state budget = .ok progress) :
    progress.done = isTerminated program progress.state := by
  induction budget generalizing state progress with
  | zero =>
      simp [runSlice] at h
      cases h
      simp
  | succ remaining ih =>
      unfold runSlice at h
      by_cases hterm : isTerminated program state
      · simp [hterm] at h
        cases h
        simp [hterm]
      · simp [hterm] at h
        cases hstep : step program state with
        | err error =>
            simp [hstep] at h
        | ok nextState =>
            cases hslice : runSlice program nextState remaining with
            | err error =>
                simp [hstep, hslice] at h
            | ok nextProgress =>
                simp [hstep, hslice] at h
                cases h
                simpa using ih nextState nextProgress hslice

theorem runSlice_ok_state_matches_runFuel (program : ValidatedProgram)
    (state : ExecState program.length)
    (budget : Nat)
    (progress : SliceProgress program.length)
    (h : runSlice program state budget = .ok progress) :
    runFuel program budget state = .ok progress.state := by
  simp [runFuel, Result.map, h]

theorem runSlice_ok_not_done_exhausts_budget (program : ValidatedProgram)
    (state : ExecState program.length)
    (budget : Nat)
    (progress : SliceProgress program.length)
    (h : runSlice program state budget = .ok progress)
    (hnot : progress.done = false) :
    progress.stepsExecuted = budget := by
  induction budget generalizing state progress with
  | zero =>
      simp [runSlice] at h
      cases h
      simp
  | succ remaining ih =>
      unfold runSlice at h
      by_cases hterm : isTerminated program state
      · simp [hterm] at h
        cases h
        simp at hnot
      · simp [hterm] at h
        cases hstep : step program state with
        | err error =>
            simp [hstep] at h
        | ok nextState =>
            cases hslice : runSlice program nextState remaining with
            | err error =>
                simp [hstep, hslice] at h
            | ok nextProgress =>
                simp [hstep, hslice] at h
                cases h
                have hnext : nextProgress.done = false := by
                  simpa using hnot
                have hbudget := ih nextState nextProgress hslice hnext
                simp [hbudget]

theorem runFuel_zero_returns_initial (program : ValidatedProgram)
    (state : ExecState program.length) :
    runFuel program 0 state = .ok state := by
  simp [runFuel, runSlice, Result.map]

theorem runFuel_terminated_state_returns_state (program : ValidatedProgram)
    (state : ExecState program.length)
    (fuel : Nat)
    (h : state.pc.val = program.length) :
    runFuel program fuel state = .ok state := by
  have hslice := runSlice_terminated_state_returns_done program state fuel h
  simp [runFuel, Result.map, hslice]

theorem runFuel_succ_step_error (program : ValidatedProgram)
    (state : ExecState program.length)
    (remaining : Nat)
    (hterm : isTerminated program state = false)
    (error : RuntimeError)
    (hstep : step program state = .err error) :
    runFuel program (remaining + 1) state = .err error := by
  simp [runFuel, runSlice, Result.map, hterm, hstep]

theorem runFuel_succ_step_ok (program : ValidatedProgram)
    (state : ExecState program.length)
    (remaining : Nat)
    (hterm : isTerminated program state = false)
    (nextState : ExecState program.length)
    (hstep : step program state = .ok nextState) :
    runFuel program (remaining + 1) state = runFuel program remaining nextState := by
  cases hslice : runSlice program nextState remaining with
  | err error =>
      simp [runFuel, runSlice, Result.map, hterm, hstep, hslice]
  | ok progress =>
      simp [runFuel, runSlice, Result.map, hterm, hstep, hslice]

theorem runWithInput_zero_returns_initial_state (program : ValidatedProgram)
    (input : List Cell) :
    runWithInput program 0 input = .ok (ExecState.initial program.length input) := by
  simp [runWithInput, runFuel, runSlice, Result.map]

theorem runFuel_empty_program_returns_initial (state : ExecState ValidatedProgram.empty.length)
    (fuel : Nat) :
    runFuel ValidatedProgram.empty fuel state = .ok state := by
  apply runFuel_terminated_state_returns_state
  simp [ValidatedProgram.empty]

theorem runSlice_empty_program_returns_initial (state : ExecState ValidatedProgram.empty.length)
    (budget : Nat) :
    runSlice ValidatedProgram.empty state budget =
      .ok
        {
          state := state
          stepsExecuted := 0
          done := true
        } := by
  apply runSlice_terminated_state_returns_done
  simp [ValidatedProgram.empty]

theorem runWithInput_empty_program_returns_initial (fuel : Nat) (input : List Cell) :
    runWithInput ValidatedProgram.empty fuel input =
      .ok (ExecState.initial ValidatedProgram.empty.length input) := by
  simp [runWithInput]
  apply runFuel_empty_program_returns_initial

end Brainfuck.Proofs
