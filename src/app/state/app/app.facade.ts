import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { appQuery } from 'src/app/state/app/app.selectors';
import { appActions } from 'src/app/state/app/app.actions';
import { AppScreen } from 'src/app/state/app/app-state-model';

@Injectable({ providedIn: 'root' })
export class AppFacade {
    public readonly screen$ = this.store.select(appQuery.selectScreen);

    constructor(private store: Store) {}

    public switchScreen(targetScreen: AppScreen): void {
        this.store.dispatch(appActions.changeScreen({ targetScreen }));
    }
}
