import { createInitialMachineSnapshot } from "../runtime/runner/snapshot";
import { bindRuntimeClient, RuntimeClient } from '../runtime/client/runtime-client'
import { AppRuntimeHandle, bindAppRuntime } from './appRunTime/app-run-time'
import type { AppUi } from '../ui'


export const createAppRuntime = (
  views: Pick<AppUi, "controls" | "output" | "programView" | "status">
): AppRuntimeHandle => bindAppRuntime(
  bindRuntimeClient(
    new Worker(new URL("./runner/runner.worker.ts", import.meta.url), {
      type: "module"
    })
  ), views
);
