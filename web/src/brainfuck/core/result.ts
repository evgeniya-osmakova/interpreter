export type Result<T, E> =
  | { readonly tag: "ok"; readonly value: T }
  | { readonly tag: "err"; readonly error: E };

export const ok = <T, E>(value: T): Result<T, E> => ({ tag: "ok", value });

export const err = <T, E>(error: E): Result<T, E> => ({ tag: "err", error });

export const mapResult = <T, U, E>(
  value: Result<T, E>,
  f: (current: T) => U
): Result<U, E> => (value.tag === "ok" ? ok<U, E>(f(value.value)) : err<U, E>(value.error));

export const bindResult = <T, U, E>(
  value: Result<T, E>,
  f: (current: T) => Result<U, E>
): Result<U, E> => (value.tag === "ok" ? f(value.value) : err<U, E>(value.error));
