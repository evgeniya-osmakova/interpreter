import Brainfuck.Core.Error
import Brainfuck.Core.Result
import Brainfuck.Core.Instruction
import Brainfuck.Program.RawProgram
import Brainfuck.Program.ValidatedProgram

namespace Brainfuck.Program

open Brainfuck.Core

namespace Validate

private def buildJumpPairs (instructions : Array InstructionToken) :
    Result (Array (Nat × Nat)) ValidationError :=
  let rec go (index : Nat) (stack : List Nat) (pairs : Array (Nat × Nat)) :
      Result (Array (Nat × Nat)) ValidationError :=
    if h : index < instructions.size then
      match instructions[index] with
      | InstructionToken.loopStart => go (index + 1) (index :: stack) pairs
      | InstructionToken.loopEnd =>
          match stack with
          | start :: rest =>
              go (index + 1) rest (pairs.push (start, index) |>.push (index, start))
          | [] => .err (.unmatchedLoopEnd index)
      | _ => go (index + 1) stack pairs
    else
      match stack with
      | unmatchedStart :: _ => .err (.unmatchedLoopStart unmatchedStart)
      | [] => .ok pairs

  go 0 [] #[]

private def lookupJumpTarget (pairs : Array (Nat × Nat)) (sourceIndex : Nat) : Option Nat :=
  pairs.findSome? fun (source, target) =>
    if source = sourceIndex then
      some target
    else
      none

private def mkProgramCounter (length : Nat) (sourceIndex target : Nat) :
    Result (ProgramCounter length) ValidationError :=
  if h : target < length + 1 then
    .ok ⟨target, h⟩
  else
    .err (.invalidJumpTarget sourceIndex target)

private def toValidatedInstruction (length : Nat) (pairs : Array (Nat × Nat))
    (index : Nat) (token : InstructionToken) :
    Result (ValidatedInstruction length) ValidationError :=
  match token with
  | .moveRight => .ok .moveRight
  | .moveLeft => .ok .moveLeft
  | .increment => .ok .increment
  | .decrement => .ok .decrement
  | .output => .ok .output
  | .input => .ok .input
  | .loopStart =>
      match lookupJumpTarget pairs index with
      | some target =>
          Result.map ValidatedInstruction.jumpIfZero (mkProgramCounter length index (target + 1))
      | none => .err (.invalidJumpTarget index index)
  | .loopEnd =>
      match lookupJumpTarget pairs index with
      | some target =>
          Result.map ValidatedInstruction.jumpIfNonZero (mkProgramCounter length index target)
      | none => .err (.invalidJumpTarget index index)

def validate (program : RawProgram) : Result ValidatedProgram ValidationError :=
  match buildJumpPairs program.instructions with
  | .err error => .err error
  | .ok pairs =>
      let rawVector := program.instructions.toVector
      match rawVector.mapIdxM (m := fun α => Result α ValidationError) (fun index token =>
          toValidatedInstruction rawVector.size pairs index token) with
      | Result.err error => Result.err error
      | Result.ok instructions =>
          Result.ok
            {
              length := rawVector.size
              instructions := instructions
            }

end Validate

end Brainfuck.Program
