export interface OutputView {
  readonly element: HTMLPreElement;
  setOutput: (value: string) => void;
}

export const renderOutputView = (): OutputView => {
  const element = document.createElement("pre");
  element.className = "output";

  return {
    element,
    setOutput(value) {
      element.textContent = value;
    }
  };
};
