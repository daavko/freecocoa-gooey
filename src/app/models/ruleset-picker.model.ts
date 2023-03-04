export type RulesetLoadState = 'beforeLoad' | 'loading' | 'loaded' | 'error';

export type RulesetPresetName = 'none' | 'ltx' | 'ltt' | 'lt76';

export interface RulesetPreset {
    baseUrl: string;
}

const longturnLttLtxUrlBase = 'https://raw.githubusercontent.com/longturn/LTT-LTX/master';
const longturnGamesUrlBase = 'https://raw.githubusercontent.com/longturn/games/master';

export const rulesetPresets: Record<RulesetPresetName, RulesetPreset> = {
    none: {
        baseUrl: ''
    },
    ltt: {
        baseUrl: `${longturnLttLtxUrlBase}/LTT/data/LTT`
    },
    ltx: {
        baseUrl: `${longturnLttLtxUrlBase}/LTX/data/LTX`
    },
    lt76: {
        baseUrl: `${longturnGamesUrlBase}/LT76Team/data/LT76Team`
    }
};
