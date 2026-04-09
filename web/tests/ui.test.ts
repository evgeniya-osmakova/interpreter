// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { makeCell } from "../src/brainfuck/core/cell";
import { makeProgramCounter } from "../src/brainfuck/core/program-counter";
import { initialExecState, type ExecState } from "../src/brainfuck/core/state";
import { writeTape } from "../src/brainfuck/core/tape";
import { createRunner } from "../src/runtime/runner";
import { createMachineSnapshot } from "../src/runtime/snapshot";
import type { RuntimeClient, RuntimeEventHandler } from "../src/runtime/client";
import type { WorkerEvent, WorkerRequest } from "../src/runtime/worker-protocol";
import { mountApp, type AppHandle } from "../src/ui/app";

class FakeRuntimeClient implements RuntimeClient {
  readonly requests: WorkerRequest[] = [];
  private readonly listeners = new Set<RuntimeEventHandler>();
  disposed = false;

  send(request: WorkerRequest): void {
    this.requests.push(request);
  }

  subscribe(handler: RuntimeEventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  emit(event: WorkerEvent): void {
    this.listeners.forEach((listener) => {
      listener(event);
    });
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }
}

class RunnerBackedRuntimeClient implements RuntimeClient {
  private readonly listeners = new Set<RuntimeEventHandler>();
  private readonly runner = createRunner({
    emit: (event) => {
      this.listeners.forEach((listener) => {
        listener(event);
      });
    }
  });

  send(request: WorkerRequest): void {
    void this.runner.handleRequest(request);
  }

  subscribe(handler: RuntimeEventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  dispose(): void {
    this.listeners.clear();
  }
}

const getMetricValues = (root: HTMLElement): Record<string, string> => {
  const metrics = Array.from(root.querySelectorAll<HTMLElement>(".metric"));
  return Object.fromEntries(
    metrics.map((metric) => [
      metric.querySelector(".metric__label")?.textContent ?? "",
      metric.querySelector(".metric__value")?.textContent ?? ""
    ])
  );
};

const createProgressState = (): ExecState => {
  const initial = initialExecState([]);
  const pc = makeProgramCounter(2, 2);
  if (pc === null) {
    throw new Error("failed to construct progress-state pc");
  }
  return {
    pc,
    machine: {
      ...initial.machine,
      tape: writeTape(initial.machine.tape, initial.machine.pointer, makeCell(65)),
      output: [makeCell(65)]
    }
  };
};

let appHandle: AppHandle | null = null;

afterEach(() => {
  appHandle?.dispose();
  appHandle = null;
  document.body.innerHTML = "";
});

describe("browser UI shell", () => {
  it("loads an example into controls and updates status", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const exampleButton = root.querySelector<HTMLButtonElement>(
      'button[data-example-id="hello-world"]'
    );
    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    const input = root.querySelector<HTMLInputElement>('input[name="input"]');
    const statusLabel = root.querySelector<HTMLElement>(".status__label");
    const statusDetail = root.querySelector<HTMLElement>(".status__detail");

    exampleButton?.click();

    expect(source?.value).toContain("++++++++++");
    expect(input?.value).toBe("");
    expect(statusLabel?.textContent).toBe("Example loaded");
    expect(statusDetail?.textContent).toBe("Canonical Brainfuck hello world program.");
  });

  it("dispatches run requests through the runtime client", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    const input = root.querySelector<HTMLInputElement>('input[name="input"]');
    const budget = root.querySelector<HTMLInputElement>('input[name="budget"]');
    const runButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Run"
    );

    expect(source).not.toBeNull();
    expect(input).not.toBeNull();
    expect(budget).not.toBeNull();
    expect(runButton).not.toBeUndefined();
    if (source === null || input === null || budget === null || runButton === undefined) {
      return;
    }

    source.value = "+.";
    input.value = "A";
    budget.value = "invalid";

    runButton.click();

    expect(client.requests).toEqual([
      {
        tag: "run",
        source: "+.",
        input: [makeCell(65)],
        budget: 1000
      }
    ]);
    expect(root.querySelector(".status__label")?.textContent).toBe("Starting");
  });

  it("normalizes negative budget input through the shared runtime budget path", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    const budget = root.querySelector<HTMLInputElement>('input[name="budget"]');
    const runButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Run"
    );

    expect(source).not.toBeNull();
    expect(budget).not.toBeNull();
    expect(runButton).not.toBeUndefined();
    if (source === null || budget === null || runButton === undefined) {
      return;
    }

    source.value = "+";
    budget.value = "-5";
    runButton.click();

    expect(client.requests.at(-1)).toEqual({
      tag: "run",
      source: "+",
      input: [],
      budget: 1
    });
  });

  it("renders progress events into output and inspector state", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();
    const state = createProgressState();

    appHandle = mountApp(root, client);

    client.emit({
      tag: "progress",
      snapshot: createMachineSnapshot(state),
      output: [65],
      done: true,
      stepsExecuted: 2
    });

    expect(root.querySelector(".status__label")?.textContent).toBe("Finished");
    expect(root.querySelector(".status__detail")?.textContent).toBe("PC 2 · Pointer 0 · Steps 2");
    expect(root.querySelector(".output__text")?.textContent).toBe("A");
    expect(root.querySelector(".output__bytes")?.textContent).toBe("[65]");

    const metrics = getMetricValues(root);
    expect(metrics.PC).toBe("2");
    expect(metrics.Pointer).toBe("0");
    expect(metrics.Cell).toBe("65");
    expect(metrics.Output).toBe("1");
    expect(root.querySelector(".tape-window")?.textContent).toContain("65");
  });

  it("resets visible state and sends stop to the runtime client", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();
    const state = createProgressState();

    appHandle = mountApp(root, client);
    client.emit({
      tag: "progress",
      snapshot: createMachineSnapshot(state),
      output: [65],
      done: false,
      stepsExecuted: 2
    });

    const resetButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Reset"
    );

    resetButton?.click();

    expect(client.requests.at(-1)).toEqual({ tag: "stop" });
    expect(root.querySelector(".status__label")?.textContent).toBe("Reset");
    expect(root.querySelector(".output__text")?.textContent).toBe("");
    expect(root.querySelector(".output__bytes")?.textContent).toBe("[]");

    const metrics = getMetricValues(root);
    expect(metrics.PC).toBe("0");
    expect(metrics.Pointer).toBe("0");
    expect(metrics.Cell).toBe("0");
  });

  it("uses the same snapshot shape for initial/reset state as runtime snapshots", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const metrics = getMetricValues(root);
    expect(metrics.PC).toBe("0");
    expect(metrics.Pointer).toBe("0");
    expect(metrics.Cell).toBe("0");
    expect(root.querySelectorAll(".tape-cell")).toHaveLength(5);

    const input = root.querySelector<HTMLInputElement>('input[name="input"]');
    const resetButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Reset"
    );
    expect(input).not.toBeNull();
    expect(resetButton).not.toBeUndefined();
    if (input === null || resetButton === undefined) {
      return;
    }

    input.value = "AB";
    resetButton.click();

    const afterResetMetrics = getMetricValues(root);
    expect(afterResetMetrics.Input).toBe("2");
    expect(root.querySelectorAll(".tape-cell")).toHaveLength(5);
  });

  it("renders validation and runtime errors in the status view", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    client.emit({
      tag: "validationError",
      error: { tag: "unmatchedLoopEnd", index: 0 }
    });
    expect(root.querySelector(".status__label")?.textContent).toBe("Validation error");
    expect(root.querySelector(".status__detail")?.textContent).toBe("unmatchedLoopEnd");

    client.emit({
      tag: "runtimeError",
      error: { tag: "pointerOutOfBounds" }
    });
    expect(root.querySelector(".status__label")?.textContent).toBe("Runtime error");
    expect(root.querySelector(".status__detail")?.textContent).toBe("pointerOutOfBounds");

    client.emit({
      tag: "protocolError",
      error: { tag: "invalidRequest", detail: "expected a request object" }
    });
    expect(root.querySelector(".status__label")?.textContent).toBe("Protocol error");
    expect(root.querySelector(".status__detail")?.textContent).toBe("invalidRequest");
  });

  it("distinguishes stop from reset and disposes the runtime client", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const stopButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Stop"
    );
    const resetButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Reset"
    );

    stopButton?.click();
    client.emit({ tag: "stopped" });
    expect(root.querySelector(".status__label")?.textContent).toBe("Stopped");

    resetButton?.click();
    client.emit({ tag: "stopped" });
    expect(root.querySelector(".status__label")?.textContent).toBe("Reset");

    appHandle?.dispose();
    appHandle = null;
    expect(client.disposed).toBe(true);
    expect(root.childElementCount).toBe(0);
  });

  it("runs a real program through the runtime and renders the finished result", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new RunnerBackedRuntimeClient();

    appHandle = mountApp(root, client);

    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    const input = root.querySelector<HTMLInputElement>('input[name="input"]');
    const runButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Run"
    );

    expect(source).not.toBeNull();
    expect(input).not.toBeNull();
    expect(runButton).not.toBeUndefined();
    if (source === null || input === null || runButton === undefined) {
      return;
    }

    source.value = ",.";
    input.value = "A";
    runButton.click();
    await Promise.resolve();

    expect(root.querySelector(".status__label")?.textContent).toBe("Finished");
    expect(root.querySelector(".output__text")?.textContent).toBe("A");
    expect(root.querySelector(".output__bytes")?.textContent).toBe("[65]");

    const metrics = getMetricValues(root);
    expect(metrics.PC).toBe("2");
    expect(metrics.Input).toBe("0");
    expect(metrics.Output).toBe("1");
  });
});
