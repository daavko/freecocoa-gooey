import { StoreModule } from '@ngrx/store';
import { rulesetFeature } from 'src/app/state/ruleset/ruleset.reducer';
import { EffectsModule } from '@ngrx/effects';
import { RulesetEffects } from 'src/app/state/ruleset/ruleset.effects';

export const rulesetStateAppImports = [
    StoreModule.forFeature(rulesetFeature),
    EffectsModule.forFeature([RulesetEffects])
];
export { RulesetFacade } from './ruleset.facade';
