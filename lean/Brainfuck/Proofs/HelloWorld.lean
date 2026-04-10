import Brainfuck.Program.Parse
import Brainfuck.Program.Validate
import Brainfuck.Semantics.Eval

namespace Brainfuck.Proofs

open Brainfuck.Core
open Brainfuck.Program
open Brainfuck.Semantics

def byte (value : Nat) (h : value < Cell.modulus := by decide) : Cell := ⟨value, h⟩

def helloWorldSource : String :=
  "++++++++++[>+++++++>++++++++++>+++>+<<<<-]>" ++
    "++.>+.+++++++..+++.>++.<<+++++++++++++++." ++
    ">.+++.------.--------.>+.>."

def helloWorldExpectedOutput : List Cell :=
  [
    byte 72,
    byte 101,
    byte 108,
    byte 108,
    byte 111,
    byte 32,
    byte 87,
    byte 111,
    byte 114,
    byte 108,
    byte 100,
    byte 33,
    byte 10
  ]

def helloWorldProducesCanonicalOutput : Bool :=
  match Parse.parse helloWorldSource with
  | .err _ => false
  | .ok raw =>
      match Validate.validate raw with
      | .err _ => false
      | .ok program =>
          match runWithInput program 200000 [] with
          | .err _ => false
          | .ok state =>
              decide
                (state.machine.output = helloWorldExpectedOutput ∧
                  state.pc.val = program.length)

theorem helloWorld_produces_canonical_output :
    helloWorldProducesCanonicalOutput = true := by
  native_decide

end Brainfuck.Proofs
