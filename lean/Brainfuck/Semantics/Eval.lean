import Brainfuck.Core.Result
import Brainfuck.Core.State
import Brainfuck.Program.ValidatedProgram
import Brainfuck.Semantics.Step

namespace Brainfuck.Semantics

open Brainfuck.Core
open Brainfuck.Program

structure SliceProgress (programLength : Nat) where
  state : ExecState programLength
  stepsExecuted : Nat
  done : Bool
  deriving DecidableEq, Repr

def runSlice (program : ValidatedProgram) (state : ExecState program.length) (budget : Nat) :
    Result (SliceProgress program.length) RuntimeError :=
  match budget with
  | 0 =>
      .ok
        {
          state := state
          stepsExecuted := 0
          done := isTerminated program state
        }
  | remaining + 1 =>
      if isTerminated program state then
        .ok
          {
            state := state
            stepsExecuted := 0
            done := true
          }
      else
        match step program state with
        | .err error => .err error
        | .ok nextState =>
            match runSlice program nextState remaining with
            | .err error => .err error
            | .ok progress =>
                .ok
                  {
                    state := progress.state
                    stepsExecuted := progress.stepsExecuted + 1
                    done := progress.done
                  }

def runFuel (program : ValidatedProgram) (fuel : Nat) (state : ExecState program.length) :
    Result (ExecState program.length) RuntimeError :=
  match fuel with
  | 0 => .ok state
  | remaining + 1 =>
      if isTerminated program state then
        .ok state
      else
        match step program state with
        | .ok nextState => runFuel program remaining nextState
        | .err error => .err error

def runWithInput (program : ValidatedProgram) (fuel : Nat) (input : List Cell := []) :
    Result (ExecState program.length) RuntimeError :=
  runFuel program fuel (ExecState.initial program.length input)

end Brainfuck.Semantics
