/// <reference lib="webworker" />

import { createRunner } from "./runner";
import { decodeWorkerRequest, type WorkerEvent } from "../protocol/worker-protocol";

const runner = createRunner({
  emit(event: WorkerEvent): void {
    self.postMessage(event);
  }
});

self.onmessage = (message: MessageEvent<unknown>): void => {
  const decoded = decodeWorkerRequest(message.data);
  if (decoded.tag === "err") {
    self.postMessage({ tag: "protocolError", error: decoded.error } satisfies WorkerEvent);
    return;
  }

  void runner.handleRequest(decoded.value);
};
