import { createFeature, createReducer, on } from '@ngrx/store';
import { appActions } from 'src/app/state/app/app.actions';
import { AppScreen } from 'src/app/state/app/app-state-model';

interface AppState {
    screen: AppScreen;
}

const initialState: AppState = {
    screen: 'rulesetPick'
};

export const appFeature = createFeature({
    name: 'app',
    reducer: createReducer(
        initialState,
        on(appActions.changeScreen, (state, { targetScreen }): AppState => {
            return { screen: targetScreen };
        })
    )
});
