import { describe, expect, it } from "vitest";
import { decodeWorkerEvent, decodeWorkerRequest } from "../src/runtime/protocol/worker-protocol";
import { makeCell } from "../src/brainfuck/core/cell";

describe("worker protocol", () => {
  it("decodes a valid play request", () => {
    expect(
      decodeWorkerRequest({
        tag: "play",
        source: "+.",
        input: [65]
      })
    ).toEqual({
      tag: "ok",
      value: {
        tag: "play",
        source: "+.",
        input: [makeCell(65)]
      }
    });
  });

  it("decodes step, pause, and stop requests", () => {
    expect(decodeWorkerRequest({ tag: "step", source: ",", input: [] })).toEqual({
      tag: "ok",
      value: { tag: "step", source: ",", input: [] }
    });
    expect(decodeWorkerRequest({ tag: "pause" })).toEqual({
      tag: "ok",
      value: { tag: "pause" }
    });
    expect(decodeWorkerRequest({ tag: "stop" })).toEqual({
      tag: "ok",
      value: { tag: "stop" }
    });
  });

  it("rejects malformed request tags", () => {
    expect(decodeWorkerRequest({ tag: "run" })).toEqual({
      tag: "err",
      error: {
        tag: "invalidRequest",
        detail: "expected request tag 'play', 'step', 'pause', or 'stop'"
      }
    });
  });

  it("rejects invalid input bytes", () => {
    expect(
      decodeWorkerRequest({
        tag: "play",
        source: ",",
        input: [999]
      })
    ).toEqual({
      tag: "err",
      error: {
        tag: "invalidRunField",
        field: "input",
        detail: "expected each input byte to be an integer in the range 0..255"
      }
    });
  });
});

describe("worker event protocol", () => {
  it("decodes a paused event", () => {
    expect(decodeWorkerEvent({ tag: "paused" })).toEqual({
      tag: "ok",
      value: { tag: "paused" }
    });
  });

  it("decodes a valid progress event", () => {
    expect(
      decodeWorkerEvent({
        tag: "progress",
        snapshot: {
          pc: 1,
          pointer: 0,
          currentCell: 65,
          inputLength: 0,
          outputLength: 1,
          tapeWindow: [
            { index: 0, value: 65, isPointer: true },
            { index: 1, value: 0, isPointer: false }
          ]
        },
        output: [65],
        done: true,
        stepsExecuted: 1
      })
    ).toEqual({
      tag: "ok",
      value: {
        tag: "progress",
        snapshot: {
          pc: 1,
          pointer: 0,
          currentCell: 65,
          inputLength: 0,
          outputLength: 1,
          tapeWindow: [
            { index: 0, value: 65, isPointer: true },
            { index: 1, value: 0, isPointer: false }
          ]
        },
        output: [65],
        done: true,
        stepsExecuted: 1
      }
    });
  });

  it("rejects malformed progress payloads", () => {
    expect(
      decodeWorkerEvent({
        tag: "progress",
        snapshot: "bad",
        output: [65],
        done: true,
        stepsExecuted: 1
      })
    ).toEqual({
      tag: "err",
      error: {
        tag: "invalidRequest",
        detail: "expected snapshot to be an object"
      }
    });
  });
});
