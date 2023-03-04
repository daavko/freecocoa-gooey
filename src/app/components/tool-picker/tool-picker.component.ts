import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppFacade, AppScreen } from 'src/app/state/app/public-api';

@Component({
    selector: 'app-tool-picker',
    templateUrl: './tool-picker.component.html',
    styleUrls: ['./tool-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolPickerComponent {
    constructor(private appFacade: AppFacade) {}

    public openUtil(screen: AppScreen): void {
        this.appFacade.switchScreen(screen);
    }
}
