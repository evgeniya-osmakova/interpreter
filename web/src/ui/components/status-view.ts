export interface StatusView {
  readonly element: HTMLElement;
  setStatus: (label: string, detail?: string, tone?: "default" | "error") => void;
  setProgressStatus: (label: string, progress: { pc: number; pointer: number; steps: number }) => void;
}

export const renderStatusView = (): StatusView => {
  const element = document.createElement("div");
  element.className = "status-note";

  const label = document.createElement("p");
  label.className = "status__label";

  const detail = document.createElement("p");
  detail.className = "status__detail";

  const detailText = document.createElement("span");
  detailText.className = "status__detail-text";

  const progress = document.createElement("span");
  progress.className = "status__progress";

  const pcValue = document.createElement("span");
  pcValue.className = "status__progress-value";

  const pointerValue = document.createElement("span");
  pointerValue.className = "status__progress-value";

  const stepsValue = document.createElement("span");
  stepsValue.className = "status__progress-value";

  progress.append(
    "PC ",
    pcValue,
    " · Pointer ",
    pointerValue,
    " · Steps ",
    stepsValue
  );

  detail.append(detailText, progress);
  element.append(label, detail);

  const setTone = (tone: "default" | "error"): void => {
    element.classList.toggle("status-note--error", tone === "error");
    element.setAttribute("role", tone === "error" ? "alert" : "status");
    element.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
  };

  return {
    element,
    setStatus(value, extra = "", tone = "default") {
      setTone(tone);
      label.textContent = value;
      detailText.textContent = extra === "" ? "\u00A0" : extra;
      detail.replaceChildren(detailText);
    },
    setProgressStatus(value, progressState) {
      setTone("default");
      label.textContent = value;
      pcValue.textContent = String(progressState.pc);
      pointerValue.textContent = String(progressState.pointer);
      stepsValue.textContent = String(progressState.steps);
      detail.replaceChildren(progress);
    }
  };
};
