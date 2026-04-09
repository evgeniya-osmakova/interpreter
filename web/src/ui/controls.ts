export interface Controls {
  readonly source: HTMLTextAreaElement;
  readonly input: HTMLInputElement;
  readonly run: HTMLButtonElement;
  readonly stop: HTMLButtonElement;
  readonly reset: HTMLButtonElement;
}

export const renderControls = (): Controls => {
  const source = document.createElement("textarea");
  source.name = "source";
  source.rows = 12;
  source.placeholder = "Enter Brainfuck source";

  const input = document.createElement("input");
  input.name = "input";
  input.placeholder = "Optional input";

  const run = document.createElement("button");
  run.type = "button";
  run.textContent = "Run";

  const stop = document.createElement("button");
  stop.type = "button";
  stop.textContent = "Stop";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset";

  return { source, input, run, stop, reset };
};
