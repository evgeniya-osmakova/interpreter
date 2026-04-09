export const CELL_MODULUS = 256;

declare const cellBrand: unique symbol;

export type Cell = number & { readonly [cellBrand]: "Cell" };

const normalizeCell = (value: number): number => {
  const wrapped = value % CELL_MODULUS;
  return wrapped >= 0 ? wrapped : wrapped + CELL_MODULUS;
};

export const makeCell = (value: number): Cell => normalizeCell(value) as Cell;

export const zeroCell = (): Cell => makeCell(0);

export const incrementCell = (cell: Cell): Cell => makeCell((cell as number) + 1);

export const decrementCell = (cell: Cell): Cell => makeCell((cell as number) - 1);
