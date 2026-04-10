import Brainfuck.Core.Cell

namespace Brainfuck.Proofs

open Brainfuck.Core

def maxCell : Cell := ⟨Cell.maxValue, by decide⟩

theorem increment_preserves_bounds (cell : Cell) :
    (Cell.increment cell).val < Cell.modulus :=
  (Cell.increment cell).isLt

theorem decrement_preserves_bounds (cell : Cell) :
    (Cell.decrement cell).val < Cell.modulus :=
  (Cell.decrement cell).isLt

theorem increment_wraps_from_max :
    Cell.increment maxCell = Cell.zero := by
  native_decide

theorem decrement_wraps_from_zero :
    Cell.decrement Cell.zero = maxCell := by
  native_decide

end Brainfuck.Proofs
