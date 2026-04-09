import Brainfuck.Core.Instruction

namespace Brainfuck.Program

open Brainfuck.Core

structure RawProgram where
  instructions : Array InstructionToken
  deriving Repr

namespace RawProgram

def empty : RawProgram := { instructions := #[] }

end RawProgram

end Brainfuck.Program
