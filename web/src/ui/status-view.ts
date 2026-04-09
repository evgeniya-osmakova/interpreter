export interface StatusView {
  readonly element: HTMLParagraphElement;
  setStatus: (value: string) => void;
}

export const renderStatusView = (): StatusView => {
  const element = document.createElement("p");
  element.className = "status";

  return {
    element,
    setStatus(value) {
      element.textContent = value;
    }
  };
};
