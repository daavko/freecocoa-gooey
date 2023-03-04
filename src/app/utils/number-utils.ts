/**
 * Random integer in exclusive range min-max
 *
 * @param min
 * @param max
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}
