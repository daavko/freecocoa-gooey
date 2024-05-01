import { createFeature, createReducer, on } from '@ngrx/store';
import { rulesetActions } from 'src/app/state/ruleset/ruleset.actions';
import { LoadingState } from 'src/app/utils/utility-types';
import { Ruleset } from 'src/app/models/ruleset.model';
import { RulesetType } from 'src/app/state/ruleset/ruleset-state-model';
import { GameSettings } from 'src/app/models/game-settings.model';

interface RulesetState {
    loadingState: LoadingState;
    ruleset: Ruleset | null;
    rulesetType: RulesetType | null;
    rulesetLabel: string | null;
    gameSettings: GameSettings | null;
}

const initialState: RulesetState = {
    loadingState: 'beforeLoad',
    ruleset: null,
    rulesetType: null,
    rulesetLabel: null,
    gameSettings: null
};

export const rulesetFeature = createFeature({
    name: 'ruleset',
    reducer: createReducer(
        initialState,
        on(rulesetActions.loadRuleset, (state): RulesetState => {
            return {
                ...state,
                loadingState: 'loading',
                ruleset: null,
                rulesetType: null,
                rulesetLabel: null,
                gameSettings: null
            };
        }),
        on(rulesetActions.loadRulesetSuccess, (state, { ruleset, rulesetType, label, gameSettings }): RulesetState => {
            return {
                ...state,
                loadingState: 'loaded',
                ruleset,
                rulesetType,
                rulesetLabel: label,
                gameSettings
            };
        }),
        on(rulesetActions.loadRulesetError, (state): RulesetState => {
            return {
                ...state,
                loadingState: 'error',
                ruleset: null,
                rulesetType: null,
                rulesetLabel: null,
                gameSettings: null
            };
        }),
        on(rulesetActions.resetRuleset, (): RulesetState => {
            return initialState;
        })
    )
});
