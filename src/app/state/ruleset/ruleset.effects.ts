import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { rulesetActions } from 'src/app/state/ruleset/ruleset.actions';
import { catchError, concatMap, EMPTY, map, of } from 'rxjs';
import { RulesetFetchService } from 'src/app/services/ruleset-fetch.service';
import { AppFacade } from 'src/app/state/app/public-api';

// eslint-disable-next-line @angular-eslint/use-injectable-provided-in -- not needed for effects
@Injectable()
export class RulesetEffects {
    public readonly loadRuleset = createEffect(() => {
        return this.actions$.pipe(
            ofType(rulesetActions.loadRuleset),
            concatMap((action) =>
                this.rulesetLoader.fetchRuleset(action.baseUrl).pipe(
                    map((ruleset) =>
                        rulesetActions.loadRulesetSuccess({
                            ruleset,
                            rulesetType: action.rulesetType,
                            label: action.label
                        })
                    ),
                    catchError((error: unknown) => {
                        console.log('Failed to load ruleset', error);
                        return of(rulesetActions.loadRulesetError());
                    })
                )
            )
        );
    });

    public readonly loadRulesetSuccess = createEffect(
        () => {
            return this.actions$.pipe(
                ofType(rulesetActions.loadRulesetSuccess),
                concatMap(() => {
                    this.appFacade.switchScreen('toolPick');
                    return EMPTY;
                })
            );
        },
        { dispatch: false }
    );

    constructor(private actions$: Actions, private rulesetLoader: RulesetFetchService, private appFacade: AppFacade) {}
}
