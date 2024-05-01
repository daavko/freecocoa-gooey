export type LoadingState = 'beforeLoad' | 'loading' | 'loaded' | 'error';

// type Required<T> = { [P in keyof T]-?: T[P] }
export type DeepNonNullable<T> = {
    [K in keyof T]: T[K] extends object ? DeepNonNullable<T[K]> : NonNullable<T[K]>;
};
