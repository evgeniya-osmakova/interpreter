import Brainfuck.Core.Cell
import Brainfuck.Core.Pointer

namespace Brainfuck.Core

abbrev Tape := Vector Cell Pointer.length

namespace Tape

def blank : Tape := Vector.replicate Pointer.length Cell.zero

def read (tape : Tape) (pointer : Pointer) : Cell :=
  tape.get pointer

def write (tape : Tape) (pointer : Pointer) (cell : Cell) : Tape :=
  tape.set pointer cell

def mapCell (tape : Tape) (pointer : Pointer) (f : Cell → Cell) : Tape :=
  tape.set pointer (f (tape.get pointer))

end Tape

end Brainfuck.Core
