export interface ProgramExample {
  readonly id: string;
  readonly label: string;
  readonly source: string;
  readonly input: string;
  readonly description: string;
}

export const PROGRAM_EXAMPLES: readonly ProgramExample[] = [
  {
    id: "hello-world",
    label: "Hello World",
    source:
      "++++++++++[>+++++++>++++++++++>+++>+<<<<-]>" +
      "++.>+.+++++++..+++.>++.<<+++++++++++++++." +
      ">.+++.------.--------.>+.>.",
    input: "",
    description: "Canonical Brainfuck hello world program."
  },
  {
    id: "count-a",
    label: "Print A",
    source: "+++++[>+++++++++++++<-]>.",
    input: "",
    description: "Short loop-based program that emits the ASCII character A."
  },
  {
    id: "echo-two",
    label: "Echo 2 chars",
    source: ",.,.",
    input: "AB",
    description: "Reads two characters from Program input. Try replacing AB with any two characters, then run the program."
  },
  {
    id: "pointer-error",
    label: "Pointer Error",
    source: "<",
    input: "",
    description: "Demonstrates the well-typed out-of-bounds pointer failure."
  }
];
