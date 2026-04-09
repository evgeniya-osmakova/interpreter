import Brainfuck.Proofs.Validate
import Brainfuck.Semantics.Step

namespace Brainfuck.Proofs

open Brainfuck.Program
open Brainfuck.Semantics
open Brainfuck.Core

def cellOne : Cell := ⟨1, by decide⟩

def simpleLoopZeroState : ExecState simpleLoopProgram.length :=
  ExecState.initial simpleLoopProgram.length

def simpleLoopNonZeroMachine : MachineState :=
  { MachineState.initial with tape := Tape.write MachineState.initial.tape Pointer.zero cellOne }

def simpleLoopNonZeroStartState : ExecState simpleLoopProgram.length :=
  {
    machine := simpleLoopNonZeroMachine
    pc := ⟨0, by decide⟩
  }

def simpleLoopNonZeroEndState : ExecState simpleLoopProgram.length :=
  {
    machine := simpleLoopNonZeroMachine
    pc := ⟨1, by decide⟩
  }

theorem nextPc_in_bounds {programLength : Nat} (pc : Fin (programLength + 1)) :
    (nextPc pc).val < programLength + 1 :=
  (nextPc pc).isLt

theorem jump_target_in_bounds {programLength : Nat} (target : ProgramCounter programLength) :
    target.val < programLength + 1 :=
  target.isLt

theorem step_on_terminated_state_is_ok (program : ValidatedProgram)
    (state : ExecState program.length) (h : state.pc.val = program.length) :
    step program state = .ok state := by
  unfold step
  simp [h]

theorem step_moveRight_success (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (pointer : Pointer)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .moveRight)
    (hmove : Pointer.moveRight state.machine.pointer = .ok pointer) :
    step program state =
      .ok
        {
          state with
          machine := { state.machine with pointer := pointer }
          pc := nextPc state.pc
        } := by
  unfold step
  simp [hpc, hinstr, hmove]

theorem step_moveRight_error (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .moveRight)
    (hmove : Pointer.moveRight state.machine.pointer = .err .pointerOutOfBounds) :
    step program state = .err .pointerOutOfBounds := by
  unfold step
  simp [hpc, hinstr, hmove]

theorem step_moveLeft_success (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (pointer : Pointer)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .moveLeft)
    (hmove : Pointer.moveLeft state.machine.pointer = .ok pointer) :
    step program state =
      .ok
        {
          state with
          machine := { state.machine with pointer := pointer }
          pc := nextPc state.pc
        } := by
  unfold step
  simp [hpc, hinstr, hmove]

theorem step_moveLeft_error (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .moveLeft)
    (hmove : Pointer.moveLeft state.machine.pointer = .err .pointerOutOfBounds) :
    step program state = .err .pointerOutOfBounds := by
  unfold step
  simp [hpc, hinstr, hmove]

theorem step_increment_updates_tape_and_advances (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .increment) :
    step program state =
      .ok
        {
          state with
          machine :=
            { state.machine with
              tape := Tape.mapCell state.machine.tape state.machine.pointer Cell.increment }
          pc := nextPc state.pc
        } := by
  unfold step
  simp [hpc, hinstr]

theorem step_decrement_updates_tape_and_advances (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .decrement) :
    step program state =
      .ok
        {
          state with
          machine :=
            { state.machine with
              tape := Tape.mapCell state.machine.tape state.machine.pointer Cell.decrement }
          pc := nextPc state.pc
        } := by
  unfold step
  simp [hpc, hinstr]

theorem step_output_appends_cell_and_advances (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .output) :
    step program state =
      .ok
        {
          state with
          machine :=
            { state.machine with
              output :=
                state.machine.output ++
                  [Tape.read state.machine.tape state.machine.pointer] }
          pc := nextPc state.pc
        } := by
  unfold step
  simp [hpc, hinstr]

theorem step_input_empty_is_error (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .input)
    (hinput : state.machine.input = []) :
    step program state = .err .inputExhausted := by
  unfold step
  simp [hpc, hinstr, hinput]

theorem step_input_consumes_head_and_advances (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (cell : Cell)
    (rest : List Cell)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .input)
    (hinput : state.machine.input = cell :: rest) :
    step program state =
      .ok
        {
          state with
          machine :=
            { state.machine with
              tape := Tape.write state.machine.tape state.machine.pointer cell
              input := rest }
          pc := nextPc state.pc
        } := by
  unfold step
  simp [hpc, hinstr, hinput]

theorem step_jumpIfZero_zero_uses_target (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (target : ProgramCounter program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .jumpIfZero target)
    (hcell : (Tape.read state.machine.tape state.machine.pointer).val = 0) :
    step program state = .ok { state with pc := target } := by
  unfold step
  simp [hpc, hinstr, hcell]

theorem step_jumpIfZero_nonzero_advances (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (target : ProgramCounter program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .jumpIfZero target)
    (hcell : (Tape.read state.machine.tape state.machine.pointer).val ≠ 0) :
    step program state = .ok { state with pc := nextPc state.pc } := by
  unfold step
  simp [hpc, hinstr, hcell]

theorem step_jumpIfNonZero_zero_advances (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (target : ProgramCounter program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .jumpIfNonZero target)
    (hcell : (Tape.read state.machine.tape state.machine.pointer).val = 0) :
    step program state = .ok { state with pc := nextPc state.pc } := by
  unfold step
  simp [hpc, hinstr, hcell]

theorem step_jumpIfNonZero_nonzero_uses_target (program : ValidatedProgram)
    (state : ExecState program.length)
    (hpc : state.pc.val < program.length)
    (target : ProgramCounter program.length)
    (hinstr : program.instructions.get ⟨state.pc.val, hpc⟩ = .jumpIfNonZero target)
    (hcell : (Tape.read state.machine.tape state.machine.pointer).val ≠ 0) :
    step program state = .ok { state with pc := target } := by
  unfold step
  simp [hpc, hinstr, hcell]

theorem step_simple_loop_zero_jumps_to_termination :
    step simpleLoopProgram simpleLoopZeroState =
      .ok { simpleLoopZeroState with pc := ⟨2, by decide⟩ } := by
  native_decide

theorem step_simple_loop_nonzero_enters_loop_body :
    step simpleLoopProgram simpleLoopNonZeroStartState =
      .ok { simpleLoopNonZeroStartState with pc := ⟨1, by decide⟩ } := by
  native_decide

theorem step_simple_loop_nonzero_loop_end_jumps_back :
    step simpleLoopProgram simpleLoopNonZeroEndState =
      .ok { simpleLoopNonZeroEndState with pc := ⟨0, by decide⟩ } := by
  native_decide

end Brainfuck.Proofs
