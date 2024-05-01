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
        name: 'lt81',
        label: 'LT81 LTX snapshot',
        baseUrl: `${longturnGamesUrlBase}/LT81/data/LT81`
    },
    {
        name: 'leaguea5',
        label: 'LeagueA5 LTT snapshot',
        baseUrl: `${longturnGamesUrlBase}/LeagueA5/data/LeagueA5`
    },
    {
        name: 'lt82',
        label: 'LT82 LTT snapshot',
        baseUrl: `${longturnGamesUrlBase}/LT82/data/LT82`
    },
    {
        name: 'lt83',
        label: 'LT83 LTX snapshot',
        baseUrl: `${longturnGamesUrlBase}/LT83/data/LT83`
    }
];
