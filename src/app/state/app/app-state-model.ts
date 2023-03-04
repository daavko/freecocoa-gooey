export type AppScreen = 'rulesetPick' | 'toolPick' | 'combatForm' | 'bribeCostForm' | 'inciteCostForm';

export const TOOLBAR_TITLE_MAP: Record<AppScreen, string> = {
    rulesetPick: 'Choose a ruleset',
    toolPick: 'Choose a tool',
    combatForm: 'Combat simulator',
    bribeCostForm: 'Bribe cost calculator',
    inciteCostForm: 'Incite cost calculator'
};
