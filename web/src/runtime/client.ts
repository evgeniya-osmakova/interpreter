import { decodeWorkerEvent, type WorkerEvent, type WorkerRequest } from "./worker-protocol";

export type RuntimeEventHandler = (event: WorkerEvent) => void;

export interface RuntimeClient {
  send: (request: WorkerRequest) => void;
  subscribe: (handler: RuntimeEventHandler) => () => void;
  dispose: () => void;
}

export interface WorkerEndpoint {
  onmessage: ((message: MessageEvent<unknown>) => void) | null;
  postMessage: (message: unknown) => void;
  terminate: () => void;
}

export const bindRuntimeClient = (worker: WorkerEndpoint): RuntimeClient => {
  const listeners = new Set<RuntimeEventHandler>();

  worker.onmessage = (message: MessageEvent<unknown>): void => {
    const decoded = decodeWorkerEvent(message.data);
    const event =
      decoded.tag === "ok"
        ? decoded.value
        : ({ tag: "protocolError", error: decoded.error } satisfies WorkerEvent);

    listeners.forEach((listener) => {
      listener(event);
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

export const createWorkerRuntimeClient = (): RuntimeClient =>
  bindRuntimeClient(
    new Worker(new URL("./runner.worker.ts", import.meta.url), {
      type: "module"
    })
  );
