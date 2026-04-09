import Brainfuck.Core.Error
import Brainfuck.Core.Result

namespace Brainfuck.Core

abbrev Pointer := Fin 30000

namespace Pointer

def zero : Pointer := ⟨0, by decide⟩

def moveRight (pointer : Pointer) : Result Pointer RuntimeError :=
  if h : pointer.val + 1 < 30000 then
    .ok ⟨pointer.val + 1, h⟩
  else
    .err .pointerOutOfBounds

def moveLeft (pointer : Pointer) : Result Pointer RuntimeError :=
  if h : 0 < pointer.val then
    let hne : pointer.val ≠ 0 := Nat.ne_of_gt h
    .ok
      ⟨
        pointer.val - 1,
        Nat.lt_trans (Nat.sub_one_lt hne) pointer.isLt
      ⟩
  else
    .err .pointerOutOfBounds

end Pointer

end Brainfuck.Core
