import { filter, OperatorFunction } from 'rxjs';

export function filterNonNullable<T>(): OperatorFunction<T | null | undefined, NonNullable<T>> {
    return (source$) => source$.pipe(filter((value): value is NonNullable<T> => value != null));
}
