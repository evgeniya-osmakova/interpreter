export const MIN_CELL_VALUE = 0;
export const CELL_MODULUS = 256;
export const MAX_CELL_VALUE = CELL_MODULUS - 1;
export const CELL_STEP = 1;

declare const cellBrand: unique symbol;

export type Cell = number & { readonly [cellBrand]: "Cell" };

const normalizeCell = (value: number): number => {
  const wrapped = value % CELL_MODULUS;
  return wrapped >= 0 ? wrapped : wrapped + CELL_MODULUS;
};

export const makeCell = (value: number): Cell => normalizeCell(value) as Cell;

export const zeroCell = (): Cell => makeCell(MIN_CELL_VALUE);

export const incrementCell = (cell: Cell): Cell => makeCell((cell as number) + CELL_STEP);

export const decrementCell = (cell: Cell): Cell => makeCell((cell as number) - CELL_STEP);
