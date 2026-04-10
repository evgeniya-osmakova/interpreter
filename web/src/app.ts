import type { RuntimeClient } from "./runtime/client/runtime-client";
import { bindAppRuntime } from "./application/bind-app-runtime";
import { renderAppUi } from './ui/index'

export interface AppHandle {
  dispose: () => void;
}

export const mountApp = (
  root: HTMLElement,
  runtimeClient: RuntimeClient
): AppHandle => {
  root.replaceChildren();

  const shell = renderAppUi();
  root.append(shell.intro, shell.workspace);

  const runtime = bindAppRuntime(runtimeClient, {
    controls: shell.controls,
    output: shell.output,
    programView: shell.programView,
    status: shell.status,
  });

  return {
    dispose() {
      runtime.dispose();
      root.replaceChildren();
    }
  };
};
