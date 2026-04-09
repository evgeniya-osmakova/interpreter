namespace Brainfuck.Core

inductive Result (α ε : Type) where
  | ok : α → Result α ε
  | err : ε → Result α ε
  deriving Repr

namespace Result

def map {α β ε : Type} (f : α → β) : Result α ε → Result β ε
  | .ok value => .ok (f value)
  | .err error => .err error

def bind {α β ε : Type} (value : Result α ε) (f : α → Result β ε) : Result β ε :=
  match value with
  | .ok okValue => f okValue
  | .err error => .err error

end Result

end Brainfuck.Core
