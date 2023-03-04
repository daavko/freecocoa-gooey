import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { appActions } from 'src/app/state/app/app.actions';
import { concatMap, of } from 'rxjs';
import { TOOLBAR_TITLE_MAP } from 'src/app/state/app/app-state-model';

// eslint-disable-next-line @angular-eslint/use-injectable-provided-in -- not needed for effects
@Injectable()
export class AppEffects {
    public readonly changeScreen = createEffect(() => {
        return this.actions$.pipe(
            ofType(appActions.changeScreen),
            concatMap((action) => of(appActions.changeToolbarTitle({ title: TOOLBAR_TITLE_MAP[action.targetScreen] })))
        );
    });
    constructor(private actions$: Actions) {}
}
