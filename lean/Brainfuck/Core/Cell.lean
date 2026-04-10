namespace Brainfuck.Core

namespace Cell

def modulus : Nat := 256
def zeroValue : Nat := 0
def step : Nat := 1
def maxValue : Nat := modulus - step

end Cell

abbrev Cell := Fin Cell.modulus

namespace Cell

def zero : Cell := ⟨zeroValue, by decide⟩

def increment (cell : Cell) : Cell :=
  ⟨(cell.val + step) % modulus, Nat.mod_lt _ (by decide)⟩

def decrement (cell : Cell) : Cell :=
  ⟨(cell.val + maxValue) % modulus, Nat.mod_lt _ (by decide)⟩

end Cell

end Brainfuck.Core
