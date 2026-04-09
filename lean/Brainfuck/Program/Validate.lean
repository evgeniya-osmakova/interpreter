import Brainfuck.Core.Error
import Brainfuck.Core.Result
import Brainfuck.Program.RawProgram
import Brainfuck.Program.ValidatedProgram

namespace Brainfuck.Program

open Brainfuck.Core

namespace Validate

def validate (_program : RawProgram) : Result ValidatedProgram ValidationError :=
  .ok ValidatedProgram.empty

end Validate

end Brainfuck.Program
