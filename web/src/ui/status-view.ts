export interface StatusView {
  readonly element: HTMLElement;
  setStatus: (label: string, detail?: string) => void;
}

export const renderStatusView = (): StatusView => {
  const element = document.createElement("section");
  element.className = "status";

  const label = document.createElement("p");
  label.className = "status__label";

  const detail = document.createElement("p");
  detail.className = "status__detail";

  element.append(label, detail);

  return {
    element,
    setStatus(value, extra = "") {
      label.textContent = value;
      detail.textContent = extra;
    }
  };
};
