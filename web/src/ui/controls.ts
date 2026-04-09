import { PROGRAM_EXAMPLES, type ProgramExample } from "./examples";

export interface Controls {
  readonly examplesSection: HTMLElement;
  readonly runPanel: HTMLElement;
  readonly sourceStatusSlot: HTMLElement;
  readonly source: HTMLTextAreaElement;
  readonly input: HTMLInputElement;
  readonly play: HTMLButtonElement;
  readonly step: HTMLButtonElement;
  readonly pause: HTMLButtonElement;
  readonly reset: HTMLButtonElement;
  readonly examples: HTMLElement;
  setSelectedExample: (example: ProgramExample | null) => void;
}

const createField = (
  titleText: string,
  descriptionText: string,
  control: HTMLElement,
  controlId: string
): HTMLElement => {
  const field = document.createElement("section");
  field.className = "control-field";

  const title = document.createElement("label");
  title.className = "control-field__label";
  title.htmlFor = controlId;
  title.textContent = titleText;

  const description = document.createElement("p");
  description.className = "control-field__description";
  description.textContent = descriptionText;

  field.append(title, description, control);
  return field;
};

export const renderControls = (): Controls => {
  const examplesSection = document.createElement("details");
  examplesSection.className = "control-panel examples-panel";

  const examplesSummary = document.createElement("summary");
  examplesSummary.className = "examples-panel__summary";
  examplesSummary.textContent = "Start with an example";

  const source = document.createElement("textarea");
  source.id = "source-input";
  source.name = "source";
  source.rows = 12;
  source.placeholder = "Enter Brainfuck source";

  const input = document.createElement("input");
  input.id = "input-text";
  input.name = "input";
  input.placeholder = "Text consumed by the , instruction";

  const play = document.createElement("button");
  play.type = "button";
  play.textContent = "Play";

  const step = document.createElement("button");
  step.type = "button";
  step.textContent = "Step";

  const pause = document.createElement("button");
  pause.type = "button";
  pause.textContent = "Pause";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset";

  const examples = document.createElement("div");
  examples.className = "examples";

  const examplesDescription = document.createElement("p");
  examplesDescription.className = "examples-panel__description";
  examplesDescription.textContent =
    "Open this panel to load a sample program and read what it demonstrates.";

  PROGRAM_EXAMPLES.forEach((example: ProgramExample) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "examples__button";
    button.dataset.exampleId = example.id;
    button.textContent = example.label;
    examples.append(button);
  });

  examplesSection.append(examplesSummary, examples, examplesDescription);

  const sourceField = createField(
    "Program source",
    "Paste Brainfuck code here. The app parses and validates the program before execution, so unmatched brackets fail before the run starts.",
    source,
    source.id
  );

  const sourceStatusSlot = document.createElement("div");
  sourceStatusSlot.className = "source-status-slot";
  sourceField.append(sourceStatusSlot);

  const inputField = createField(
    "Program input",
    "Optional plain text input. Each , instruction consumes one character from this field.",
    input,
    input.id
  );

  const runPanel = document.createElement("section");
  runPanel.className = "control-panel";

  const runHeading = document.createElement("h2");
  runHeading.className = "panel-title";
  runHeading.textContent = "Run a program";

  const compactFields = document.createElement("div");
  compactFields.className = "control-grid";
  compactFields.append(inputField);

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(play, step, pause, reset);

  const actionsHint = document.createElement("p");
  actionsHint.className = "actions__hint";
  actionsHint.textContent =
    "Play animates execution at the default pace. Step advances exactly one instruction. Pause freezes the current session. Reset clears the session and visible state.";

  runPanel.append(runHeading, sourceField, compactFields, actions, actionsHint);

  return {
    examplesSection,
    runPanel,
    sourceStatusSlot,
    source,
    input,
    play,
    step,
    pause,
    reset,
    examples,
    setSelectedExample(example) {
      const buttons = Array.from(examples.querySelectorAll<HTMLButtonElement>(".examples__button"));
      buttons.forEach((button) => {
        button.classList.toggle("examples__button--active", button.dataset.exampleId === example?.id);
      });

      examplesSummary.textContent =
        example === null ? "Start with an example" : `Start with an example · ${example.label}`;
      examplesDescription.textContent =
        example === null
          ? "Open this panel to load a sample program and read what it demonstrates."
          : example.description;

      if (example !== null) {
        examplesSection.open = true;
      }
    }
  };
};
