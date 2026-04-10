import Brainfuck.Core.Pointer

namespace Brainfuck.Proofs

open Brainfuck.Core

def lastPointer : Pointer := ⟨Pointer.lastIndex, by decide⟩

theorem moveLeft_zero_is_error :
    Pointer.moveLeft Pointer.zero = .err .pointerOutOfBounds := by
  native_decide

theorem moveRight_last_is_error :
    Pointer.moveRight lastPointer = .err .pointerOutOfBounds := by
  native_decide

end Brainfuck.Proofs
