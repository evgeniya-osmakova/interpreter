namespace Brainfuck.Core

inductive InstructionToken where
  | moveRight
  | moveLeft
  | increment
  | decrement
  | output
  | input
  | loopStart
  | loopEnd
  deriving DecidableEq, Repr

end Brainfuck.Core
