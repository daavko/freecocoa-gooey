import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Ruleset } from 'src/app/models/ruleset.model';
import { RulesetType } from 'src/app/state/ruleset/ruleset-state-model';
import { GameSettings } from 'src/app/models/game-settings.model';

export const rulesetActions = createActionGroup({
    source: 'Ruleset',
    events: {
        'Load Ruleset': props<{
            rulesetType: RulesetType;
            label: string;
            baseUrl: string;
            settingsUrl: string;
            playersUrl: string;
        }>(),
        'Load Ruleset Success': props<{
            rulesetType: RulesetType;
            label: string;
            ruleset: Ruleset;
            gameSettings: GameSettings;
        }>(),
        'Load Ruleset Error': emptyProps(),
        'Reset Ruleset': emptyProps()
    }
});
