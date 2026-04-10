import type { InputModeState } from "../../application/input-mode";
import { PROGRAM_EXAMPLES, type ProgramExample } from "../../application/examples";

const PROGRAM_SOURCE_ROWS = 12;

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
  setInputMode: (state: InputModeState) => void;
}

interface ControlField {
  readonly element: HTMLElement;
  readonly description: HTMLParagraphElement | null;
}

const createField = (
  titleText: string,
  descriptionText: string,
  control: HTMLElement,
  controlId: string
): ControlField => {
  const field = document.createElement("section");
  field.className = "control-field";

  const title = document.createElement("label");
  title.className = "control-field__label";
  title.htmlFor = controlId;
  title.textContent = titleText;

  field.append(title);
  let description: HTMLParagraphElement | null = null;

  if (descriptionText !== "") {
    description = document.createElement("p");
    description.className = "control-field__description";
    description.textContent = descriptionText;
    field.append(description);
  }

  field.append(control);

  return { element: field, description };
};

export const renderControls = (): Controls => {
  const examplesSection = document.createElement("section");
  examplesSection.className = "control-panel examples-panel";

  const examplesHeading = document.createElement("h2");
  examplesHeading.className = "panel-title";
  examplesHeading.textContent = "Start with an example";

  const source = document.createElement("textarea");
  source.id = "source-input";
  source.name = "source";
  source.rows = PROGRAM_SOURCE_ROWS;
  source.placeholder = "Enter Brainfuck source";
  source.className = "source-input";

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
  examplesDescription.textContent = "\u00A0";

  PROGRAM_EXAMPLES.forEach((example: ProgramExample) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "examples__button";
    button.dataset.exampleId = example.id;
    button.textContent = example.label;
    examples.append(button);
  });

  examplesSection.append(examplesHeading, examples, examplesDescription);

  const sourceField = createField(
    "Program source",
    "",
    source,
    source.id
  );

  const sourceStatusSlot = document.createElement("div");
  sourceStatusSlot.className = "source-status-slot";
  sourceField.element.append(sourceStatusSlot);

  const inputField = document.createElement("section");
  inputField.className = "control-field";

  const inputLabel = document.createElement("label");
  inputLabel.className = "control-field__label";
  inputLabel.htmlFor = input.id;
  inputLabel.textContent = "Program input";

  const inputDescription = document.createElement("p");
  inputDescription.className = "control-field__description control-field__description--support";

  inputField.append(inputLabel, input, inputDescription);

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

  const actionsHint = document.createElement("ul");
  actionsHint.className = "actions-help";
  actionsHint.innerHTML = `
    <li><strong>Play</strong> runs the program at the default pace.</li>
    <li><strong>Step</strong> advances exactly one instruction.</li>
    <li><strong>Pause</strong> freezes the current session.</li>
    <li><strong>Reset</strong> clears the current session and visible state.</li>
  `;

  runPanel.append(runHeading, sourceField.element, compactFields, actions, actionsHint);

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
      examplesDescription.textContent =
        example === null
          ? "\u00A0"
          : example.description;
    },
    setInputMode(state) {
      input.disabled = !state.enabled;
      input.setAttribute("aria-disabled", String(!state.enabled));
      input.placeholder = state.placeholder;
      inputDescription.textContent = state.description;
    }
  };
};
