export type AppScreen = 'rulesetPick' | 'toolPick' | 'combatSim' | 'battleSim' | 'bribeCostCalc' | 'inciteCostCalc';

export const TOOLBAR_TITLE_MAP: Record<AppScreen, string> = {
    rulesetPick: 'Choose a ruleset',
    toolPick: 'Choose a tool',
    combatSim: 'Combat simulator',
    battleSim: 'Battle simulator',
    bribeCostCalc: 'Bribe cost calculator',
    inciteCostCalc: 'Incite cost calculator'
};
