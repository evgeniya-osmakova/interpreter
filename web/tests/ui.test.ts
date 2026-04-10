// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { makeCell } from "../src/brainfuck/core/cell";
import { initialExecState, type ExecState } from "../src/brainfuck/core/state";
import { writeTape } from "../src/brainfuck/core/tape";
import { makeProgramCounter } from "../src/brainfuck/program/validated-program";
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
    },
    pause: () => Promise.resolve()
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
  it("renders onboarding copy, documentation link, and field explanations", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const wikiLink = root.querySelector<HTMLAnchorElement>('a[href="https://en.wikipedia.org/wiki/Brainfuck"]');

    expect(root.textContent).toContain("Start with an example");
    expect(root.textContent).toContain("Program source");
    expect(root.textContent).toContain("Program input");
    expect(root.textContent).toContain("This program does not use the , command, so Program input is disabled.");
    expect(root.textContent).toContain("Play runs the program at the default pace.");
    expect(root.textContent).toContain("Step advances exactly one instruction.");
    expect(wikiLink?.textContent).toBe("Brainfuck on Wikipedia");
    expect(wikiLink?.target).toBe("_blank");
    expect(root.querySelector<HTMLInputElement>('input[name="input"]')?.disabled).toBe(true);
  });

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
    const examplesDescription = root.querySelector<HTMLElement>(".examples-panel__description");
    const statusLabel = root.querySelector<HTMLElement>(".status__label");
    const statusDetail = root.querySelector<HTMLElement>(".status__detail");

    exampleButton?.click();

    expect(source?.value).toContain("++++++++++");
    expect(input?.value).toBe("");
    expect(examplesDescription?.textContent).toBe("Canonical Brainfuck hello world program.");
    expect(statusLabel?.textContent).toBe("Example loaded");
    expect(statusDetail?.textContent).toBe("Ready to run Hello World");
  });

  it("loads an input-driven example and pre-fills Program input", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const exampleButton = root.querySelector<HTMLButtonElement>(
      'button[data-example-id="echo-two"]'
    );
    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    const input = root.querySelector<HTMLInputElement>('input[name="input"]');
    const examplesDescription = root.querySelector<HTMLElement>(".examples-panel__description");

    exampleButton?.click();

    expect(source?.value).toBe(",.,.");
    expect(input?.value).toBe("AB");
    expect(input?.disabled).toBe(false);
    expect(examplesDescription?.textContent).toContain("Reads two characters from Program input");
    expect(
      input?.closest(".control-field")?.querySelector<HTMLElement>(".control-field__description")?.textContent
    ).toContain("Each executed , command consumes 1 byte. Current input: 2 characters and 2 bytes.");
  });

  it("disables Program input until the source contains the input instruction", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    const input = root.querySelector<HTMLInputElement>('input[name="input"]');
    const inputDescription = () =>
      input?.closest(".control-field")?.querySelector<HTMLElement>(".control-field__description")?.textContent;

    expect(source).not.toBeNull();
    expect(input).not.toBeNull();
    if (source === null || input === null) {
      return;
    }

    expect(input.disabled).toBe(true);
    expect(inputDescription()).toContain("Program input is disabled");

    source.value = ",";
    source.dispatchEvent(new Event("input"));

    expect(input.disabled).toBe(false);
    expect(inputDescription()).toContain("Each executed , command consumes 1 byte");
    expect(inputDescription()).toContain("The browser turns text into UTF-8 bytes before execution");

    input.value = "🙂";
    input.dispatchEvent(new Event("input"));

    expect(inputDescription()).toContain("Current input: 1 character and 4 bytes.");
  });

  it("dispatches play requests through the runtime client", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    const input = root.querySelector<HTMLInputElement>('input[name="input"]');
    const playButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Play"
    );

    expect(source).not.toBeNull();
    expect(input).not.toBeNull();
    expect(playButton).not.toBeUndefined();
    if (source === null || input === null || playButton === undefined) {
      return;
    }

    source.value = "+.";
    input.value = "A";

    playButton.click();

    expect(client.requests).toEqual([
      {
        tag: "play",
        source: "+.",
        input: [makeCell(65)]
      }
    ]);
    expect(root.querySelector(".status__label")?.textContent).toBe("Running");
  });

  it("dispatches single-step requests through the runtime client", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    const stepButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Step"
    );

    expect(source).not.toBeNull();
    expect(stepButton).not.toBeUndefined();
    if (source === null || stepButton === undefined) {
      return;
    }

    source.value = "+";
    stepButton.click();

    expect(client.requests.at(-1)).toEqual({
      tag: "step",
      source: "+",
      input: []
    });
  });

  it("renders progress events into output and execution view", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();
    const state = createProgressState();

    appHandle = mountApp(root, client);
    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    expect(source).not.toBeNull();
    if (source === null) {
      return;
    }
    source.value = ",.+";

    const playButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Play"
    );
    playButton?.click();
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
    expect(root.querySelector(".program-visualizer__meta")?.textContent).toBe("PC 2 / 3 · showing 1-3");
    expect(root.querySelector(".program-visualizer__char--current")?.textContent).toBe("+");
    expect(root.querySelector(".tape-window")?.textContent).toContain("65");
    expect(root.querySelectorAll(".tape-cell")).toHaveLength(21);
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
    expect(root.querySelector(".program-visualizer__meta")?.textContent).toBe("No executable instructions yet.");
    expect(root.querySelector(".tape-cell--pointer .tape-cell__value")?.textContent).toBe("0");
  });

  it("sends pause requests and reflects paused state", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const pauseButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Pause"
    );

    pauseButton?.click();
    expect(client.requests.at(-1)).toEqual({ tag: "pause" });

    client.emit({ tag: "paused" });
    expect(root.querySelector(".status__label")?.textContent).toBe("Paused");
  });

  it("uses the same snapshot shape for initial/reset state as runtime snapshots", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    expect(root.querySelector(".program-visualizer__meta")?.textContent).toBe("No executable instructions yet.");
    expect(root.querySelectorAll(".tape-cell")).toHaveLength(21);

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

    expect(root.querySelector(".tape-cell--pointer .tape-cell__value")?.textContent).toBe("0");
    expect(root.querySelectorAll(".tape-cell")).toHaveLength(21);
  });

  it("renders only a fixed instruction window for long programs", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const source = root.querySelector<HTMLTextAreaElement>('textarea[name="source"]');
    expect(source).not.toBeNull();
    if (source === null) {
      return;
    }

    source.value = ">".repeat(30000);
    source.dispatchEvent(new Event("input"));

    expect(root.querySelectorAll(".program-visualizer__char")).toHaveLength(961);
    expect(root.querySelector(".program-visualizer__meta")?.textContent).toBe(
      "30000 executable instructions · showing 1-961"
    );
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
    expect(root.querySelector(".status__detail")?.textContent).toBe(
      "A ] appears at instruction 0, but there is no matching [."
    );
    expect(root.querySelector(".status-note")?.classList.contains("status-note--error")).toBe(true);

    client.emit({
      tag: "runtimeError",
      error: { tag: "pointerOutOfBounds" }
    });
    expect(root.querySelector(".status__label")?.textContent).toBe("Runtime error");
    expect(root.querySelector(".status__detail")?.textContent).toBe(
      "The pointer tried to move outside the tape. Valid cells are 0 through 29,999."
    );

    client.emit({
      tag: "protocolError",
      error: { tag: "invalidRequest", detail: "expected a request object" }
    });
    expect(root.querySelector(".status__label")?.textContent).toBe("Protocol error");
    expect(root.querySelector(".status__detail")?.textContent).toBe(
      "The browser and worker could not agree on a valid message shape."
    );
  });

  it("distinguishes stop from reset and disposes the runtime client", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const client = new FakeRuntimeClient();

    appHandle = mountApp(root, client);

    const resetButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Reset"
    );

    client.emit({ tag: "paused" });
    expect(root.querySelector(".status__label")?.textContent).toBe("Paused");

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
    const playButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Play"
    );

    expect(source).not.toBeNull();
    expect(input).not.toBeNull();
    expect(playButton).not.toBeUndefined();
    if (source === null || input === null || playButton === undefined) {
      return;
    }

    source.value = ",.";
    input.value = "A";
    playButton.click();
    await Promise.resolve();

    expect(root.querySelector(".status__label")?.textContent).toBe("Finished");
    expect(root.querySelector(".output__text")?.textContent).toBe("A");

    expect(root.querySelector(".status__detail")?.textContent).toBe("PC 2 · Pointer 0 · Steps 2");
    expect(root.querySelector(".program-visualizer__char--past")?.textContent).toBe(",");
  });
});
