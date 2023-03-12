import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DefenderMetaInfo } from 'src/app/models/combat-info.model';

@Component({
    selector: 'app-battle-simulator',
    templateUrl: './battle-simulator.component.html',
    styleUrls: ['./battle-simulator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BattleSimulatorComponent {
    public updateDefenderMeta(defenderMeta: DefenderMetaInfo): void {
        //this.defenderMetaInfo.next(defenderMeta);
    }
}
