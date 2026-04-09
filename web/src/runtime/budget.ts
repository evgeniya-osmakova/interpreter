export const DEFAULT_EXECUTION_BUDGET = 1000;

export const normalizeExecutionBudget = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
};

export const parseExecutionBudgetInput = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? normalizeExecutionBudget(parsed) : DEFAULT_EXECUTION_BUDGET;
};
