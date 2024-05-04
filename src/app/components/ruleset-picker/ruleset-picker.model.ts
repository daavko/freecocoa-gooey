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
        name: 'lt81',
        label: 'LT81 LTX snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT81/LT81.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT81/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT81/data/LT81`
    },
    {
        name: 'leaguea5',
        label: 'LeagueA5 LTT snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LeagueA5/LeagueA5.serv`,
        playersUrl: `${longturnGamesUrlBase}/LeagueA5/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LeagueA5/data/LeagueA5`
    },
    {
        name: 'lt82',
        label: 'LT82 LTT snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT82/LT82.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT82/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT82/data/LT82`
    },
    {
        name: 'lt83',
        label: 'LT83 LTX snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT83/LT83.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT83/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT83/data/LT83`
    },
    {
        name: 'lt84',
        label: 'LT84 Royale snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT84/LT84.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT84/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT84/data/LT84`
    }
];
