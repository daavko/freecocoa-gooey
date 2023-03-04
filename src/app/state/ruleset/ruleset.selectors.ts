import { rulesetFeature } from 'src/app/state/ruleset/ruleset.reducer';

const { selectLoadingState, selectRuleset } = rulesetFeature;

export const rulesetQuery = {
    selectLoadingState,
    selectRuleset
};
