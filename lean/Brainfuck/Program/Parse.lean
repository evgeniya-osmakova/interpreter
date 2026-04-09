import Brainfuck.Core.Error
import Brainfuck.Core.Instruction
import Brainfuck.Core.Result
import Brainfuck.Program.RawProgram

namespace Brainfuck.Program

open Brainfuck.Core

namespace Parse

def charToToken? : Char → Option InstructionToken
  | '>' => some .moveRight
  | '<' => some .moveLeft
  | '+' => some .increment
  | '-' => some .decrement
  | '.' => some .output
  | ',' => some .input
  | '[' => some .loopStart
  | ']' => some .loopEnd
  | _ => none

def parse (source : String) : Result RawProgram ValidationError :=
  let instructions :=
    source.toList.foldl
      (fun acc ch =>
        match charToToken? ch with
        | some token => acc.push token
        | none => acc)
      #[]
  .ok { instructions := instructions }

end Parse

end Brainfuck.Program
