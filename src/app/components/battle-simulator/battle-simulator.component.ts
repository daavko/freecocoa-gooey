import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-battle-simulator',
    templateUrl: './battle-simulator.component.html',
    styleUrls: ['./battle-simulator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BattleSimulatorComponent {}
