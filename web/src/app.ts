import { createAppRuntime } from './runtime/index'
import { renderAppUi } from './ui/index'

export interface AppHandle {
  dispose: () => void;
}

export const mountApp = (root: HTMLElement): AppHandle => {
  root.replaceChildren();

  const shell = renderAppUi();
  root.append(shell.intro, shell.workspace);

  const runtime = createAppRuntime({
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
