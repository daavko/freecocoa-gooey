import { appFeature } from 'src/app/state/app/app.reducer';

const { selectScreen, selectTitle } = appFeature;

export const appQuery = {
    selectScreen,
    selectTitle
};
