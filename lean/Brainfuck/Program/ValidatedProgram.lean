import Brainfuck.Core.Instruction

namespace Brainfuck.Program

open Brainfuck.Core

abbrev ProgramIndex (length : Nat) := Fin length

inductive ValidatedInstruction (length : Nat) where
  | moveRight
  | moveLeft
  | increment
  | decrement
  | output
  | input
  | jumpIfZero (target : ProgramIndex length)
  | jumpIfNonZero (target : ProgramIndex length)
  deriving Repr

structure ValidatedProgram where
  length : Nat
  instructions : Vector (ValidatedInstruction length) length
  deriving Repr

namespace ValidatedProgram

def empty : ValidatedProgram :=
  {
    length := 0
    instructions := #v[]
  }

def get (program : ValidatedProgram) (index : ProgramIndex program.length) :
    ValidatedInstruction program.length :=
  program.instructions.get index

end ValidatedProgram

end Brainfuck.Program
