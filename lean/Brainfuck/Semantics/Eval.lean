import Brainfuck.Core.Result
import Brainfuck.Core.State
import Brainfuck.Program.ValidatedProgram
import Brainfuck.Semantics.Step

namespace Brainfuck.Semantics

open Brainfuck.Core
open Brainfuck.Program

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
