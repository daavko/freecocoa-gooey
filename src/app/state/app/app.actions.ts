import { createActionGroup, props } from '@ngrx/store';
import { AppScreen } from 'src/app/state/app/app-state-model';

export const appActions = createActionGroup({
    source: 'App',
    events: {
        'Change Screen': props<{ targetScreen: AppScreen }>()
    }
});
