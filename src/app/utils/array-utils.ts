export function deduplicate<T>(input: T[]): T[] {
    return input.filter((item, index, array) => isOriginalItemIndex(item, index, array));
}

export function isOriginalItemIndex<T>(item: T, index: number, array: T[]): boolean {
    return array.indexOf(item) === index;
}
