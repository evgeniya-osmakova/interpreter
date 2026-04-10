import { describe, expect, it } from "vitest";
import { bindRuntimeClient, type WorkerEndpoint } from "../src/runtime/client/runtime-client";

class FakeWorkerEndpoint implements WorkerEndpoint {
  onmessage: ((message: MessageEvent<unknown>) => void) | null = null;
  postedMessages: unknown[] = [];
  terminated = false;

  postMessage(message: unknown): void {
    this.postedMessages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(message: unknown): void {
    this.onmessage?.({ data: message } as MessageEvent<unknown>);
  }
}

describe("runtime client", () => {
  it("forwards outgoing requests to the worker endpoint", () => {
    const worker = new FakeWorkerEndpoint();
    const client = bindRuntimeClient(worker);

    client.send({ tag: "stop" });

    expect(worker.postedMessages).toEqual([{ tag: "stop" }]);
  });

  it("decodes valid worker events before notifying subscribers", () => {
    const worker = new FakeWorkerEndpoint();
    const client = bindRuntimeClient(worker);
    const events: unknown[] = [];

    client.subscribe((event) => {
      events.push(event);
    });

    worker.emit({
      tag: "progress",
      snapshot: {
        pc: 1,
        pointer: 0,
        currentCell: 65,
        inputLength: 0,
        outputLength: 1,
        tapeWindow: [{ index: 0, value: 65, isPointer: true }]
      },
      output: [65],
      done: true,
      stepsExecuted: 1
    });

    expect(events).toEqual([
      {
        tag: "progress",
        snapshot: {
          pc: 1,
          pointer: 0,
          currentCell: 65,
          inputLength: 0,
          outputLength: 1,
          tapeWindow: [{ index: 0, value: 65, isPointer: true }]
        },
        output: [65],
        done: true,
        stepsExecuted: 1
      }
    ]);
  });

  it("converts malformed worker events into protocolError notifications", () => {
    const worker = new FakeWorkerEndpoint();
    const client = bindRuntimeClient(worker);
    const events: unknown[] = [];

    client.subscribe((event) => {
      events.push(event);
    });

    worker.emit({
      tag: "progress",
      snapshot: "bad",
      output: [65],
      done: true,
      stepsExecuted: 1
    });

    expect(events).toEqual([
      {
        tag: "protocolError",
        error: {
          tag: "invalidRequest",
          detail: "expected snapshot to be an object"
        }
      }
    ]);
  });

  it("terminates the worker endpoint on dispose", () => {
    const worker = new FakeWorkerEndpoint();
    const client = bindRuntimeClient(worker);

    client.dispose();

    expect(worker.terminated).toBe(true);
  });
});
