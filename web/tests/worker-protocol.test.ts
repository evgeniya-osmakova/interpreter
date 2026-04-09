import { describe, expect, it } from "vitest";
import { decodeWorkerRequest } from "../src/runtime/worker-protocol";
import { makeCell } from "../src/brainfuck/core/cell";

describe("worker protocol", () => {
  it("decodes a valid run request", () => {
    expect(
      decodeWorkerRequest({
        tag: "run",
        source: "+.",
        input: [65],
        budget: 10
      })
    ).toEqual({
      tag: "ok",
      value: {
        tag: "run",
        source: "+.",
        input: [makeCell(65)],
        budget: 10
      }
    });
  });

  it("decodes a valid stop request", () => {
    expect(decodeWorkerRequest({ tag: "stop" })).toEqual({
      tag: "ok",
      value: { tag: "stop" }
    });
  });

  it("rejects malformed request tags", () => {
    expect(decodeWorkerRequest({ tag: "pause" })).toEqual({
      tag: "err",
      error: {
        tag: "invalidRequest",
        detail: "expected request tag 'run' or 'stop'"
      }
    });
  });

  it("rejects invalid input bytes", () => {
    expect(
      decodeWorkerRequest({
        tag: "run",
        source: ",",
        input: [999],
        budget: 10
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
