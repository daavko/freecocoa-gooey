import { StoreModule } from '@ngrx/store';
import { appFeature } from 'src/app/state/app/app.reducer';
import { EffectsModule } from '@ngrx/effects';
import { AppEffects } from 'src/app/state/app/app.effects';

export const appStateAppImports = [StoreModule.forFeature(appFeature), EffectsModule.forFeature([AppEffects])];
export { AppFacade } from './app.facade';
export { AppScreen } from './app-state-model';
