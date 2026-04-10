import Brainfuck.Core.Error
import Brainfuck.Core.Result

namespace Brainfuck.Core

namespace Pointer

def length : Nat := 30000
def zeroIndex : Nat := 0
def step : Nat := 1
def lastIndex : Nat := length - step

end Pointer

abbrev Pointer := Fin Pointer.length

namespace Pointer

def zero : Pointer := ⟨zeroIndex, by decide⟩

def moveRight (pointer : Pointer) : Result Pointer RuntimeError :=
  if h : pointer.val + step < length then
    .ok ⟨pointer.val + step, h⟩
  else
    .err .pointerOutOfBounds

def moveLeft (pointer : Pointer) : Result Pointer RuntimeError :=
  if h : zeroIndex < pointer.val then
    let hne : pointer.val ≠ zeroIndex := Nat.ne_of_gt h
    .ok
      ⟨
        pointer.val - step,
        Nat.lt_trans (Nat.sub_one_lt hne) pointer.isLt
      ⟩
  else
    .err .pointerOutOfBounds

end Pointer

end Brainfuck.Core
