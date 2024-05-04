import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { rulesetQuery } from 'src/app/state/ruleset/ruleset.selectors';
import { filterNonNullable } from 'src/app/utils/rxjs-utils';
import { rulesetActions } from 'src/app/state/ruleset/ruleset.actions';
import { RulesetType } from 'src/app/state/ruleset/ruleset-state-model';

@Injectable({ providedIn: 'root' })
export class RulesetFacade {
    public readonly rulesetLoadingState$ = this.store.select(rulesetQuery.selectLoadingState);
    public readonly ruleset$ = this.store.select(rulesetQuery.selectRuleset).pipe(filterNonNullable());
    public readonly rulesetSortedUnitTypes$ = this.store
        .select(rulesetQuery.selectSortedUnitTypes)
        .pipe(filterNonNullable());
    public readonly gameSettings$ = this.store.select(rulesetQuery.selectGameSettings).pipe(filterNonNullable());

    constructor(private store: Store) {}

    public loadRuleset(
        baseUrl: string,
        settingsUrl: string,
        playersUrl: string,
        type: RulesetType,
        label: string
    ): void {
        this.store.dispatch(rulesetActions.loadRuleset({ baseUrl, settingsUrl, playersUrl, rulesetType: type, label }));
    }

    public reset(): void {
        this.store.dispatch(rulesetActions.resetRuleset());
    }
}
