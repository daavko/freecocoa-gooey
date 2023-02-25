/**
 * Random integer in inclusive range min-max
 *
 * @param min
 * @param max
 */
export function randomInt(min: number, max: number): number {
    const usedMax = max + 1;
    return Math.floor(Math.random() * (usedMax - min)) + min;
}
