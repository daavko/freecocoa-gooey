import { rulesetFeature } from 'src/app/state/ruleset/ruleset.reducer';
import { createSelector } from '@ngrx/store';

const { selectLoadingState, selectRuleset, selectGameSettings } = rulesetFeature;

const enCollator = new Intl.Collator('en');

const selectUnitTypes = createSelector(selectRuleset, (ruleset) => ruleset?.unitTypes);
const selectSortedUnitTypes = createSelector(selectUnitTypes, (unitTypes) => {
    if (unitTypes == null) {
        return null;
    } else {
        return [...unitTypes].sort((a, b) => enCollator.compare(a.name, b.name));
    }
});

export const rulesetQuery = {
    selectLoadingState,
    selectRuleset,
    selectGameSettings,
    selectSortedUnitTypes
};
