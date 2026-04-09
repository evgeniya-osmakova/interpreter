namespace Brainfuck.Core

abbrev Cell := Fin 256

namespace Cell

def zero : Cell := ⟨0, by decide⟩

def increment (cell : Cell) : Cell :=
  ⟨(cell.val + 1) % 256, Nat.mod_lt _ (by decide)⟩

def decrement (cell : Cell) : Cell :=
  ⟨(cell.val + 255) % 256, Nat.mod_lt _ (by decide)⟩

end Cell

end Brainfuck.Core
