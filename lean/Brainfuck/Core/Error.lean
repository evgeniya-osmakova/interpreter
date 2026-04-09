namespace Brainfuck.Core

inductive ValidationError where
  | unmatchedLoopStart (index : Nat)
  | unmatchedLoopEnd (index : Nat)
  | invalidJumpTarget (index : Nat) (target : Nat)
  deriving DecidableEq, Repr

inductive RuntimeError where
  | pointerOutOfBounds
  | inputExhausted
  deriving DecidableEq, Repr

end Brainfuck.Core
