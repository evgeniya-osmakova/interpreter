export interface OutputView {
  readonly element: HTMLElement;
  setOutput: (text: string, bytes: readonly number[]) => void;
}

export const renderOutputView = (): OutputView => {
  const element = document.createElement("section");
  element.className = "output";

  const heading = document.createElement("h2");
  heading.className = "panel-title";
  heading.textContent = "Output";

  const textLabel = document.createElement("p");
  textLabel.className = "output__label";
  textLabel.textContent = "Text";

  const text = document.createElement("pre");
  text.className = "output__text";

  const bytesLabel = document.createElement("p");
  bytesLabel.className = "output__label";
  bytesLabel.textContent = "Bytes";

  const bytes = document.createElement("code");
  bytes.className = "output__bytes";

  element.append(heading, textLabel, text, bytesLabel, bytes);

  return {
    element,
    setOutput(value, byteValues) {
      text.textContent = value;
      bytes.textContent = byteValues.length === 0 ? "[]" : `[${byteValues.join(", ")}]`;
    }
  };
};
