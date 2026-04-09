import Brainfuck.Program.Parse

namespace Brainfuck.Proofs

open Brainfuck.Core
open Brainfuck.Program

theorem parse_ignores_non_brainfuck_characters :
    Parse.parse "a+b c" =
      .ok { instructions := #[InstructionToken.increment] } := by
  native_decide

theorem parse_preserves_brainfuck_tokens :
    Parse.parse "[]" =
      .ok { instructions := #[InstructionToken.loopStart, InstructionToken.loopEnd] } := by
  native_decide

end Brainfuck.Proofs
