export type RulesetLoadState = 'beforeLoad' | 'loading' | 'loaded' | 'error';

export type RulesetPresetName = 'none' | 'ltx' | 'ltt' | 'lt76';

export interface RulesetPreset {
    effectsUrl: string;
    terrainUrl: string;
    unitsUrl: string;
}

const longturnLttLtxUrlBase = 'https://raw.githubusercontent.com/longturn/LTT-LTX/master';
const lttUrlBase = `${longturnLttLtxUrlBase}/LTT/data/LTT`;
const ltxUrlBase = `${longturnLttLtxUrlBase}/LTX/data/LTX`;

const longturnGamesUrlBase = 'https://raw.githubusercontent.com/longturn/games/master';
const lt76UrlBase = `${longturnGamesUrlBase}/LT76Team/data/LT76Team`;

export const rulesetPresets: Record<RulesetPresetName, RulesetPreset> = {
    none: {
        effectsUrl: '',
        terrainUrl: '',
        unitsUrl: ''
    },
    ltt: {
        effectsUrl: `${lttUrlBase}/effects.ruleset`,
        terrainUrl: `${lttUrlBase}/terrain.ruleset`,
        unitsUrl: `${lttUrlBase}/units.ruleset`
    },
    ltx: {
        effectsUrl: `${ltxUrlBase}/effects.ruleset`,
        terrainUrl: `${ltxUrlBase}/terrain.ruleset`,
        unitsUrl: `${ltxUrlBase}/units.ruleset`
    },
    lt76: {
        effectsUrl: `${lt76UrlBase}/effects.ruleset`,
        terrainUrl: `${lt76UrlBase}/terrain.ruleset`,
        unitsUrl: `${lt76UrlBase}/units.ruleset`
    }
};
