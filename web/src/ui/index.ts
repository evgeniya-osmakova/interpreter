import type { Controls } from "./components/controls";
import { renderControls } from "./components/controls";
import { renderIntro } from "./components/intro";
import type { OutputView } from "./components/output-view";
import { renderOutputView } from "./components/output-view";
import type { ProgramView } from "./components/program-view";
import { renderProgramView } from "./components/program-view";
import type { StatusView } from "./components/status";
import { renderStatusView } from "./components/status";

export interface AppUi {
  readonly intro: HTMLElement;
  readonly workspace: HTMLElement;
  readonly controls: Controls;
  readonly output: OutputView;
  readonly programView: ProgramView;
  readonly status: StatusView;
}

export const renderAppUi = (): AppUi => {
  const intro = renderIntro();
  const controls = renderControls();
  const output = renderOutputView();
  const status = renderStatusView();
  const programView = renderProgramView();

  const workspace = document.createElement("div");
  workspace.className = "workspace";

  const controlStack = document.createElement("div");
  controlStack.className = "workspace__controls";
  controlStack.append(controls.examplesSection, controls.runPanel);
  controls.sourceStatusSlot.append(status.element);

  const resultsStack = document.createElement("div");
  resultsStack.className = "workspace__results";
  programView.element.append(output.element);
  resultsStack.append(programView.element);

  workspace.append(controlStack, resultsStack);

  return {
    intro,
    workspace,
    controls,
    output,
    programView,
    status
  };
};
