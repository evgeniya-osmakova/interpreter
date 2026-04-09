import { PROGRAM_EXAMPLES, type ProgramExample } from "./examples";

export interface Controls {
  readonly source: HTMLTextAreaElement;
  readonly input: HTMLInputElement;
  readonly budget: HTMLInputElement;
  readonly run: HTMLButtonElement;
  readonly stop: HTMLButtonElement;
  readonly reset: HTMLButtonElement;
  readonly examples: HTMLElement;
}

export const renderControls = (): Controls => {
  const source = document.createElement("textarea");
  source.name = "source";
  source.rows = 12;
  source.placeholder = "Enter Brainfuck source";

  const input = document.createElement("input");
  input.name = "input";
  input.placeholder = "Optional input";

  const budget = document.createElement("input");
  budget.name = "budget";
  budget.type = "number";
  budget.min = "1";
  budget.step = "1";
  budget.value = "1000";
  budget.placeholder = "Slice budget";

  const run = document.createElement("button");
  run.type = "button";
  run.textContent = "Run";

  const stop = document.createElement("button");
  stop.type = "button";
  stop.textContent = "Stop";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset";

  const examples = document.createElement("div");
  examples.className = "examples";

  PROGRAM_EXAMPLES.forEach((example: ProgramExample) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "examples__button";
    button.dataset.exampleId = example.id;
    button.textContent = example.label;
    examples.append(button);
  });

  return { source, input, budget, run, stop, reset, examples };
};
