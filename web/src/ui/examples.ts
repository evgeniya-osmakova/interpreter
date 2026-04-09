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
    source: "++++++[>+++++++++++<-]>+.",
    input: "",
    description: "Short loop-based program that emits a single ASCII character."
  },
  {
    id: "pointer-error",
    label: "Pointer Error",
    source: "<",
    input: "",
    description: "Demonstrates the well-typed out-of-bounds pointer failure."
  }
];
