import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-defender-info-modal',
    templateUrl: './defender-info-modal.component.html',
    styleUrls: ['./defender-info-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenderInfoModalComponent {}
