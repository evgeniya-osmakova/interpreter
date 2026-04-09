import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXECUTION_BUDGET,
  normalizeExecutionBudget,
  parseExecutionBudgetInput
} from "../src/runtime/budget";

describe("runtime budget normalization", () => {
  it("normalizes finite numeric budgets to positive integers", () => {
    expect(normalizeExecutionBudget(3.9)).toBe(3);
    expect(normalizeExecutionBudget(0)).toBe(1);
    expect(normalizeExecutionBudget(-2)).toBe(1);
  });

  it("falls back to the default budget for invalid text input", () => {
    expect(parseExecutionBudgetInput("invalid")).toBe(DEFAULT_EXECUTION_BUDGET);
  });
});
