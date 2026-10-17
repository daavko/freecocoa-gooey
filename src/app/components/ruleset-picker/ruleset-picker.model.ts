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
        name: 'lt95',
        label: 'LT95 snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT95/LT95.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT95/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT95/data/LT95`
    },
    {
        name: 'lt96',
        label: 'LT96 snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT96/LT96.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT96/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT96/data/LT96`
    }
];
