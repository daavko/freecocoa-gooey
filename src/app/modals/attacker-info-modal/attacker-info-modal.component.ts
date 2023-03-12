import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-attacker-info-modal',
    templateUrl: './attacker-info-modal.component.html',
    styleUrls: ['./attacker-info-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttackerInfoModalComponent {}
