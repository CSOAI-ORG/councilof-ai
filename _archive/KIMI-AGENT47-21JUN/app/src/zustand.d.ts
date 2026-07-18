declare module 'zustand' {
  type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  type GetState<T> = () => T;
  type StoreApi<T> = { getState: GetState<T>; setState: SetState<T>; subscribe: (listener: (state: T) => void) => () => void };

  type Selector<T, U> = (state: T) => U;

  export function create<T>(
    creator: (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T
  ): {
    (): T;
    <U>(selector: Selector<T, U>): U;
    getState: GetState<T>;
    setState: SetState<T>;
    subscribe: (listener: (state: T) => void) => () => void;
  };
}
