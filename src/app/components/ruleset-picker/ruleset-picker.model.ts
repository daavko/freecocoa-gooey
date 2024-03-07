export interface RulesetPreset {
    name: string;
    label: string;
    baseUrl: string;
}

const longturnLttLtxUrlBase = 'https://raw.githubusercontent.com/longturn/LTT-LTX/master';
const longturnGamesUrlBase = 'https://raw.githubusercontent.com/longturn/games/master';

export const rulesetPresets: RulesetPreset[] = [
    {
        name: 'ltt',
        label: 'LTT (LongTurn Traditional)',
        baseUrl: `${longturnLttLtxUrlBase}/LTT/data/LTT`
    },
    {
        name: 'ltx',
        label: 'LTX (LongTurn eXtended)',
        baseUrl: `${longturnLttLtxUrlBase}/LTX/data/LTX`
    },
    {
        name: 'lt76',
        label: 'LT76Team LTX snapshot',
        baseUrl: `${longturnGamesUrlBase}/LT76Team/data/LT76Team`
    },
    {
        name: 'lt82',
        label: 'LT82 LTT snapshot',
        baseUrl: `${longturnGamesUrlBase}/LT82/data/LT82`
    }
];
