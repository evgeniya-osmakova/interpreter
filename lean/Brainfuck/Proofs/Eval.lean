import Brainfuck.Semantics.Eval

namespace Brainfuck.Proofs

open Brainfuck.Core
open Brainfuck.Program
open Brainfuck.Semantics

theorem runFuel_zero_returns_initial (program : ValidatedProgram)
    (state : ExecState program.length) :
    runFuel program 0 state = .ok state := rfl

end Brainfuck.Proofs
