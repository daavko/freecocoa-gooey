/**
 * Random integer in exclusive range min-max
 *
 * @param min
 * @param max
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Compute the binomial coefficient for the given amount of trials and successes
 *
 * @param trials
 * @param successes
 *
 * @see {@link https://en.wikipedia.org/wiki/Binomial_coefficient#Multiplicative_formula}
 */
function binomialCoefficient(trials: number, successes: number): number {
    // optimization possibility: store computed values so we can just return the previous one without recomputing

    // we could *also* optimize this by requesting "up to" successes, and then mapping them through the
    // probability mass function to the number of successes we would need in the cumulative thing
    let coefficient = 1;
    for (let i = 1; i <= successes; i++) {
        coefficient *= (trials + 1 - i) / i;
    }
    return coefficient;
}

/**
 * Compute the chance?
 *
 * @param trials
 * @param successes
 * @param probability
 *
 * @see {@link https://en.wikipedia.org/wiki/Binomial_distribution#Probability_mass_function}
 */
export function binomialProbabilityMass(trials: number, successes: number, probability: number): number {
    // this seems like "just some maths", so not much we can do in the way of optimizations
    // maybe it could be memoized?
    const coefficient = binomialCoefficient(trials, successes);
    const successProbability = probability ** successes;
    const failureProbability = (1 - probability) ** (trials - successes);
    return coefficient * successProbability * failureProbability;
}

/**
 * Compute total chance?
 *
 * @param trials
 * @param successes
 * @param probability
 *
 * @see {@link https://en.wikipedia.org/wiki/Binomial_distribution#Cumulative_distribution_function}
 */
export function binomialProbabilityCumulative(trials: number, successes: number, probability: number): number {
    // this is just a sum, though it could probably be memoized
    // could we compute multiple cumulations at once? so we don't need to do the for loop again for all possible
    // scenarios, but we store all intermediate results and then we return an array with all of them?
    let sum = 0;
    for (let i = 0; i <= successes; i++) {
        sum += binomialProbabilityMass(trials, i, probability);
    }
    return sum;
}

/**
 * Division of two integers, returning an integer
 *
 * @param dividend
 * @param divisor
 */
export function integerDivision(dividend: number, divisor: number): number {
    return Math.floor(dividend / divisor);
}
