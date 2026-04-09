import type { WorkerEvent, WorkerRequest } from "./worker-protocol";

export type RuntimeEventHandler = (event: WorkerEvent) => void;

export interface RuntimeClient {
  send: (request: WorkerRequest) => void;
  subscribe: (handler: RuntimeEventHandler) => () => void;
  dispose: () => void;
}

export const createWorkerRuntimeClient = (): RuntimeClient => {
  const worker = new Worker(new URL("./runner.worker.ts", import.meta.url), {
    type: "module"
  });
  const listeners = new Set<RuntimeEventHandler>();

  worker.onmessage = (message: MessageEvent<WorkerEvent>): void => {
    listeners.forEach((listener) => {
      listener(message.data);
    });
  };

  return {
    send(request) {
      worker.postMessage(request);
    },
    subscribe(handler) {
      listeners.add(handler);
      return () => {
        listeners.delete(handler);
      };
    },
    dispose() {
      listeners.clear();
      worker.terminate();
    }
  };
};
