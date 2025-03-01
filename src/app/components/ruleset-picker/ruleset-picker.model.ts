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
        name: 'lt88',
        label: 'LT88 LTT snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT88/LT88.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT88/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT88/data/LT88`
    },
    {
        name: 'lt89',
        label: 'LT89 LTT snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT89/LT89.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT89/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT89/data/LT89`
    },
    {
        name: 'leagueb3',
        label: 'League B3 LTT snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LeagueB3/LeagueB3.serv`,
        playersUrl: `${longturnGamesUrlBase}/LeagueB3/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LeagueB3/data/LeagueB3`
    },
    {
        name: 'sg4',
        label: 'SG4 snapshot',
        settingsUrl: `https://raw.githubusercontent.com/longturn/LTT-LTX/game/SG4/LTX/SG4.serv`,
        playersUrl: `https://raw.githubusercontent.com/longturn/LTT-LTX/game/SG4/LTX/players.serv`,
        baseUrl: `https://raw.githubusercontent.com/longturn/LTT-LTX/game/SG4/LTX/data/SG4`
    }
];
