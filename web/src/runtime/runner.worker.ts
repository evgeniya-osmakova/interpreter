/// <reference lib="webworker" />

import { createRunner } from "./runner";
import type { WorkerEvent, WorkerRequest } from "./worker-protocol";

const runner = createRunner({
  emit(event: WorkerEvent): void {
    self.postMessage(event);
  }
});

self.onmessage = (message: MessageEvent<WorkerRequest>): void => {
  void runner.handleRequest(message.data);
};
