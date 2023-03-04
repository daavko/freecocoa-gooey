import { createFeature, createReducer, on } from '@ngrx/store';
import { rulesetActions } from 'src/app/state/ruleset/ruleset.actions';
import { LoadingState } from 'src/app/utils/utility-types';
import { Ruleset } from 'src/app/models/ruleset.model';

interface RulesetState {
    loadingState: LoadingState;
    ruleset: Ruleset | null;
}

const initialState: RulesetState = {
    loadingState: 'beforeLoad',
    ruleset: null
};

export const rulesetFeature = createFeature({
    name: 'ruleset',
    reducer: createReducer(
        initialState,
        on(rulesetActions.loadRuleset, (): RulesetState => {
            return { loadingState: 'loading', ruleset: null };
        }),
        on(rulesetActions.loadRulesetSuccess, (state, { ruleset }): RulesetState => {
            return { loadingState: 'loaded', ruleset };
        }),
        on(rulesetActions.loadRulesetError, (): RulesetState => {
            return { loadingState: 'error', ruleset: null };
        })
    )
});
