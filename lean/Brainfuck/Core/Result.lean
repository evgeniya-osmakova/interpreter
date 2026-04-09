namespace Brainfuck.Core

inductive Result (α ε : Type) where
  | ok : α → Result α ε
  | err : ε → Result α ε
  deriving DecidableEq, Repr

namespace Result

def map {α β ε : Type} (f : α → β) : Result α ε → Result β ε
  | .ok value => .ok (f value)
  | .err error => .err error

def bind {α β ε : Type} (value : Result α ε) (f : α → Result β ε) : Result β ε :=
  match value with
  | .ok okValue => f okValue
  | .err error => .err error

instance {ε : Type} : Functor (fun α => Result α ε) where
  map := map

instance {ε : Type} : Pure (fun α => Result α ε) where
  pure := Result.ok

instance {ε : Type} : Bind (fun α => Result α ε) where
  bind := bind

instance {ε : Type} : Monad (fun α => Result α ε) where

end Result

end Brainfuck.Core
