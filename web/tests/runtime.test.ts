import { describe, expect, it } from "vitest";
import { createRunner } from "../src/runtime/runner";
import type { WorkerEvent, WorkerRequest } from "../src/runtime/worker-protocol";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

describe("runtime runner", () => {
  it("emits validationError for invalid brackets", async () => {
    const events: WorkerEvent[] = [];
    const runner = createRunner({
      emit(event) {
        events.push(event);
      }
    });

    await runner.handleRequest({
      tag: "play",
      source: "]",
      input: []
    });

    expect(events).toEqual([
      {
        tag: "validationError",
        error: { tag: "unmatchedLoopEnd", index: 0 }
      }
    ]);
  });

  it("emits runtimeError when execution fails", async () => {
    const events: WorkerEvent[] = [];
    const runner = createRunner({
      emit(event) {
        events.push(event);
      }
    });

    await runner.handleRequest({
      tag: "play",
      source: "<",
      input: []
    });

    expect(events).toEqual([
      {
        tag: "runtimeError",
        error: { tag: "pointerOutOfBounds" }
      }
    ]);
  });

  it("emits a done progress event for terminating programs", async () => {
    const events: WorkerEvent[] = [];
    const runner = createRunner({
      emit(event) {
        events.push(event);
      }
    });

    await runner.handleRequest({
      tag: "step",
      source: "+",
      input: []
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.tag).toBe("progress");
    if (events[0]?.tag !== "progress") {
      return;
    }

    expect(events[0].done).toBe(true);
    expect(events[0].stepsExecuted).toBe(1);
    expect(events[0].snapshot.pc).toBe(1);
    expect(events[0].snapshot.pointer).toBe(0);
    expect(events[0].snapshot.currentCell).toBe(1);
    expect(events[0].snapshot.outputLength).toBe(0);
    expect(events[0].output).toEqual([]);
    expect(events[0].snapshot.tapeWindow.some((cell) => cell.isPointer && cell.value === 1)).toBe(
      true
    );
  });

  it("pauses a long-running run between animated steps", async () => {
    const events: WorkerEvent[] = [];
    const gate = deferred();
    const runner = createRunner({
      emit(event) {
        events.push(event);
      },
      pause: () => gate.promise
    });

    const runRequest: WorkerRequest = {
      tag: "play",
      source: "+[]",
      input: []
    };

    const runPromise = runner.handleRequest(runRequest);
    await Promise.resolve();

    expect(events).toHaveLength(1);
    expect(events[0]?.tag).toBe("progress");
    if (events[0]?.tag !== "progress") {
      gate.resolve();
      await runPromise;
      return;
    }

    expect(events[0].done).toBe(false);

    await runner.handleRequest({ tag: "pause" });
    gate.resolve();
    await runPromise;

    expect(events.at(-1)).toEqual({ tag: "paused" });
    expect(events.filter((event) => event.tag === "progress")).toHaveLength(1);
  });

  it("steps through a session without restarting it", async () => {
    const events: WorkerEvent[] = [];
    const runner = createRunner({
      emit(event) {
        events.push(event);
      }
    });

    await runner.handleRequest({ tag: "step", source: "++", input: [] });
    await runner.handleRequest({ tag: "step", source: "++", input: [] });

    const progressEvents = events.filter((event): event is Extract<WorkerEvent, { tag: "progress" }> => event.tag === "progress");
    expect(progressEvents).toHaveLength(2);
    expect(progressEvents[0]?.snapshot.pc).toBe(1);
    expect(progressEvents[0]?.snapshot.currentCell).toBe(1);
    expect(progressEvents[1]?.snapshot.pc).toBe(2);
    expect(progressEvents[1]?.snapshot.currentCell).toBe(2);
    expect(progressEvents[1]?.done).toBe(true);
  });

  it("suppresses stale progress when a newer run replaces the active run", async () => {
    const events: WorkerEvent[] = [];
    const gate = deferred();
    const runner = createRunner({
      emit(event) {
        events.push(event);
      },
      pause: () => gate.promise
    });

    const firstRun = runner.handleRequest({
      tag: "play",
      source: "+[]",
      input: []
    });
    await Promise.resolve();

    expect(events).toHaveLength(1);
    expect(events[0]?.tag).toBe("progress");

    await runner.handleRequest({
      tag: "play",
      source: "+",
      input: []
    });

    gate.resolve();
    await firstRun;

    expect(events.filter((event) => event.tag === "progress")).toHaveLength(2);
    const finalProgress = events.at(-1);
    expect(finalProgress?.tag).toBe("progress");
    if (finalProgress?.tag !== "progress") {
      return;
    }

    expect(finalProgress.done).toBe(true);
    expect(finalProgress.snapshot.pc).toBe(1);
    expect(finalProgress.stepsExecuted).toBe(1);
  });
});
