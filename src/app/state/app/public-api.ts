import { StoreModule } from '@ngrx/store';
import { appFeature } from 'src/app/state/app/app.reducer';

export const appStateAppImports = [StoreModule.forFeature(appFeature)];
export { AppFacade } from './app.facade';
export { AppScreen } from './app-state-model';
