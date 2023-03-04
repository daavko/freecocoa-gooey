import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { rulesetQuery } from 'src/app/state/ruleset/ruleset.selectors';
import { filter } from 'rxjs';
import { notNull } from 'src/app/utils/rxjs-utils';
import { rulesetActions } from 'src/app/state/ruleset/ruleset.actions';
import { RulesetType } from 'src/app/state/ruleset/ruleset-state-model';

@Injectable({ providedIn: 'root' })
export class RulesetFacade {
    public readonly rulesetLoadingState$ = this.store.select(rulesetQuery.selectLoadingState);
    public readonly ruleset$ = this.store.select(rulesetQuery.selectRuleset).pipe(filter(notNull));

    constructor(private store: Store) {}

    public loadRuleset(baseUrl: string, type: RulesetType, label: string): void {
        this.store.dispatch(rulesetActions.loadRuleset({ baseUrl, rulesetType: type, label }));
    }

    public reset(): void {
        this.store.dispatch(rulesetActions.resetRuleset());
    }
}
