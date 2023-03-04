import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppFacade, AppScreen } from 'src/app/state/app/public-api';

@Component({
    selector: 'app-util-picker',
    templateUrl: './util-picker.component.html',
    styleUrls: ['./util-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UtilPickerComponent {
    constructor(private appFacade: AppFacade) {}

    public openUtil(screen: AppScreen): void {
        this.appFacade.switchScreen(screen);
    }
}
