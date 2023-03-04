import { createFeature, createReducer, on } from '@ngrx/store';
import { appActions } from 'src/app/state/app/app.actions';
import { AppScreen, TOOLBAR_TITLE_MAP } from 'src/app/state/app/app-state-model';

interface AppState {
    screen: AppScreen;
    title: string;
}

const initialState: AppState = {
    screen: 'rulesetPick',
    title: TOOLBAR_TITLE_MAP.rulesetPick
};

export const appFeature = createFeature({
    name: 'app',
    reducer: createReducer(
        initialState,
        on(appActions.changeScreen, (state, { targetScreen }): AppState => {
            return { ...state, screen: targetScreen };
        }),
        on(appActions.changeToolbarTitle, (state, { title }): AppState => {
            return { ...state, title };
        })
    )
});
