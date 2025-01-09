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
        name: 'lt85',
        label: 'LT85 LTX snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT85/LT85.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT85/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT85/data/LT85`
    },
    {
        name: 'lt86',
        label: 'LT86 LTT snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT86/LT86.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT86/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT86/data/LT86`
    },
    {
        name: 'lt88',
        label: 'LT88 LTT snapshot',
        settingsUrl: `${longturnGamesUrlBase}/LT88/LT88.serv`,
        playersUrl: `${longturnGamesUrlBase}/LT88/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/LT88/data/LT88`
    },
    {
        name: 'suomipeli2024',
        label: 'Suomipeli 2024 Royale snapshot',
        settingsUrl: `${longturnGamesUrlBase}/Suomipeli2024/Suomipeli2024.serv`,
        playersUrl: `${longturnGamesUrlBase}/Suomipeli2024/players.serv`,
        baseUrl: `${longturnGamesUrlBase}/Suomipeli2024/data/Suomipeli2024`
    }
];
