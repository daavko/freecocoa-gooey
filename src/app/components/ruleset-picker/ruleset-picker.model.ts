export interface RulesetPreset {
    name: string;
    label: string;
    settingsUrl: string;
    playersUrl: string;
    baseUrl: string;
}

const longturnLttLtxUrlBase = 'https://raw.githubusercontent.com/longturn/LTT-LTX/master';
const longturnGamesUrlBase = 'https://raw.githubusercontent.com/longturn/games/master';

export const rulesetPresets: RulesetPreset[] = [
    {
        name: 'ltt',
        label: 'LTT (LongTurn Traditional)',
        settingsUrl: `${longturnLttLtxUrlBase}/LTT/LTT.serv`,
        playersUrl: `${longturnLttLtxUrlBase}/LTT/players.serv`,
        baseUrl: `${longturnLttLtxUrlBase}/LTT/data/LTT`
    },
    {
        name: 'ltx',
        label: 'LTX (LongTurn eXtended)',
        settingsUrl: `${longturnLttLtxUrlBase}/LTX/LTX.serv`,
        playersUrl: `${longturnLttLtxUrlBase}/LTX/players.serv`,
        baseUrl: `${longturnLttLtxUrlBase}/LTX/data/LTX`
    },
    {
        name: 'royale',
        label: 'Royale',
        settingsUrl: `${longturnLttLtxUrlBase}/Royale/Royale.serv`,
        playersUrl: `${longturnLttLtxUrlBase}/Royale/players.serv`,
        baseUrl: `${longturnLttLtxUrlBase}/Royale/data/Royale`
    },
    {
        name: 'lt84',
        label: 'LT84 Royale snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT84/LT84.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT84/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT84/data/LT84`
    },
    {
        name: 'lt85',
        label: 'LT85 LTX snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT85/LT85.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT85/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT85/data/LT85`
    }
];
