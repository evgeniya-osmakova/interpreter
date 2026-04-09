import Brainfuck.Core.Cell
import Brainfuck.Core.Pointer
import Brainfuck.Core.Result
import Brainfuck.Core.State
import Brainfuck.Core.Tape
import Brainfuck.Program.ValidatedProgram

namespace Brainfuck.Semantics

open Brainfuck.Core
open Brainfuck.Program

def nextPc {programLength : Nat} (pc : Fin (programLength + 1)) : Fin (programLength + 1) :=
  if h : pc.val + 1 < programLength + 1 then
    ⟨pc.val + 1, h⟩
  else
    ⟨programLength, Nat.lt_succ_self _⟩

def isTerminated (program : ValidatedProgram) (state : ExecState program.length) : Bool :=
  state.pc.val = program.length

def step (program : ValidatedProgram) (state : ExecState program.length) :
    Result (ExecState program.length) RuntimeError :=
  if h : state.pc.val < program.length then
    let instruction := program.instructions.get ⟨state.pc.val, h⟩
    match instruction with
    | .moveRight =>
        match Pointer.moveRight state.machine.pointer with
        | .ok pointer =>
            .ok
              {
                state with
                machine := { state.machine with pointer := pointer }
                pc := nextPc state.pc
              }
        | .err error => .err error
    | .moveLeft =>
        match Pointer.moveLeft state.machine.pointer with
        | .ok pointer =>
            .ok
              {
                state with
                machine := { state.machine with pointer := pointer }
                pc := nextPc state.pc
              }
        | .err error => .err error
    | .increment =>
        let tape := Tape.mapCell state.machine.tape state.machine.pointer Cell.increment
        .ok
          {
            state with
            machine := { state.machine with tape := tape }
            pc := nextPc state.pc
          }
    | .decrement =>
        let tape := Tape.mapCell state.machine.tape state.machine.pointer Cell.decrement
        .ok
          {
            state with
            machine := { state.machine with tape := tape }
            pc := nextPc state.pc
          }
    | .output =>
        let cell := Tape.read state.machine.tape state.machine.pointer
        .ok
          {
            state with
            machine := { state.machine with output := state.machine.output ++ [cell] }
            pc := nextPc state.pc
          }
    | .input =>
        match state.machine.input with
        | [] => .err .inputExhausted
        | cell :: rest =>
            let tape := Tape.write state.machine.tape state.machine.pointer cell
            .ok
              {
                state with
                machine := { state.machine with tape := tape, input := rest }
                pc := nextPc state.pc
              }
    | .jumpIfZero target =>
        let cell := Tape.read state.machine.tape state.machine.pointer
        if cell.val = 0 then
          .ok { state with pc := target }
        else
          .ok { state with pc := nextPc state.pc }
    | .jumpIfNonZero target =>
        let cell := Tape.read state.machine.tape state.machine.pointer
        if cell.val = 0 then
          .ok { state with pc := nextPc state.pc }
        else
          .ok { state with pc := target }
  else
    .ok state

end Brainfuck.Semantics
