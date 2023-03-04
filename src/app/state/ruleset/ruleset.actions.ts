import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Ruleset } from 'src/app/models/ruleset.model';

export const rulesetActions = createActionGroup({
    source: 'Ruleset',
    events: {
        'Load Ruleset': props<{ baseUrl: string }>(),
        'Load Ruleset Success': props<{ ruleset: Ruleset }>(),
        'Load Ruleset Error': emptyProps()
    }
});
