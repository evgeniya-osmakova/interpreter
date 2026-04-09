import Brainfuck.Core.Cell

namespace Brainfuck.Proofs

open Brainfuck.Core

theorem increment_preserves_bounds (cell : Cell) :
    (Cell.increment cell).val < 256 :=
  (Cell.increment cell).isLt

theorem decrement_preserves_bounds (cell : Cell) :
    (Cell.decrement cell).val < 256 :=
  (Cell.decrement cell).isLt

end Brainfuck.Proofs
