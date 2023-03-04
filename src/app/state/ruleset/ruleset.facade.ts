import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { rulesetQuery } from 'src/app/state/ruleset/ruleset.selectors';
import { filter } from 'rxjs';
import { notNull } from 'src/app/utils/rxjs-utils';
import { rulesetActions } from 'src/app/state/ruleset/ruleset.actions';

@Injectable({ providedIn: 'root' })
export class RulesetFacade {
    public readonly rulesetLoadingState$ = this.store.select(rulesetQuery.selectLoadingState);
    public readonly ruleset$ = this.store.select(rulesetQuery.selectRuleset).pipe(filter(notNull));

    constructor(private store: Store) {}

    public loadRuleset(baseUrl: string): void {
        this.store.dispatch(rulesetActions.loadRuleset({ baseUrl }));
    }
}
