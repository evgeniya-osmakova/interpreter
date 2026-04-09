import Brainfuck.Core.Instruction

namespace Brainfuck.Program

open Brainfuck.Core

structure RawProgram where
  instructions : Array InstructionToken
  deriving DecidableEq, Repr

namespace RawProgram

def empty : RawProgram := { instructions := #[] }

end RawProgram

end Brainfuck.Program
