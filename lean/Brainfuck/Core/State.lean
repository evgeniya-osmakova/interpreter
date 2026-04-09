import Brainfuck.Core.Cell
import Brainfuck.Core.Pointer
import Brainfuck.Core.Tape

namespace Brainfuck.Core

structure MachineState where
  tape : Tape
  pointer : Pointer
  input : List Cell
  output : List Cell
  deriving DecidableEq, Repr

namespace MachineState

def initial : MachineState :=
  {
    tape := Tape.blank
    pointer := Pointer.zero
    input := []
    output := []
  }

def withInput (input : List Cell) : MachineState :=
  { initial with input := input }

end MachineState

structure ExecState (programLength : Nat) where
  machine : MachineState
  pc : Fin (programLength + 1)
  deriving DecidableEq, Repr

namespace ExecState

def initial (programLength : Nat) (input : List Cell := []) : ExecState programLength :=
  {
    machine := MachineState.withInput input
    pc := ⟨0, Nat.succ_pos _⟩
  }

end ExecState

end Brainfuck.Core
