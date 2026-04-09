export interface OutputView {
  readonly element: HTMLElement;
  setOutput: (text: string) => void;
}

export const renderOutputView = (): OutputView => {
  const element = document.createElement("section");
  element.className = "execution-subsection output";

  const heading = document.createElement("h3");
  heading.className = "control-field__label";
  heading.textContent = "Output";

  const text = document.createElement("pre");
  text.className = "output__text";

  element.append(heading, text);

  return {
    element,
    setOutput(value) {
      text.textContent = value;
    }
  };
};
