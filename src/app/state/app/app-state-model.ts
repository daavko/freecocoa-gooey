export type AppScreen = 'rulesetPick' | 'toolPick' | 'combatForm';

export const TOOLBAR_TITLE_MAP: Record<AppScreen, string> = {
    rulesetPick: 'Choose a ruleset',
    toolPick: 'Choose a tool',
    combatForm: 'Combat simulator'
};
