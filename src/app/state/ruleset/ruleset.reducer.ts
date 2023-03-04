import { createFeature, createReducer, on } from '@ngrx/store';
import { rulesetActions } from 'src/app/state/ruleset/ruleset.actions';
import { LoadingState } from 'src/app/utils/utility-types';
import { Ruleset } from 'src/app/models/ruleset.model';
import { RulesetType } from 'src/app/state/ruleset/ruleset-state-model';

interface RulesetState {
    loadingState: LoadingState;
    ruleset: Ruleset | null;
    rulesetType: RulesetType | null;
    rulesetLabel: string | null;
}

const initialState: RulesetState = {
    loadingState: 'beforeLoad',
    ruleset: null,
    rulesetType: null,
    rulesetLabel: null
};

export const rulesetFeature = createFeature({
    name: 'ruleset',
    reducer: createReducer(
        initialState,
        on(rulesetActions.loadRuleset, (): RulesetState => {
            return { loadingState: 'loading', ruleset: null, rulesetType: null, rulesetLabel: null };
        }),
        on(rulesetActions.loadRulesetSuccess, (state, { ruleset, rulesetType, label }): RulesetState => {
            return { loadingState: 'loaded', ruleset, rulesetType, rulesetLabel: label };
        }),
        on(rulesetActions.loadRulesetError, (): RulesetState => {
            return { loadingState: 'error', ruleset: null, rulesetType: null, rulesetLabel: null };
        }),
        on(rulesetActions.resetRuleset, (): RulesetState => {
            return initialState;
        })
    )
});
