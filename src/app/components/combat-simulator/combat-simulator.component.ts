import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';
import { Observable } from 'rxjs';
import { CombatResultStatistics } from 'src/app/models/combat-info.model';

@Component({
    selector: 'app-combat-simulator',
    templateUrl: './combat-simulator.component.html',
    styleUrls: ['./combat-simulator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CombatSimulatorComponent {
    public readonly combatResults$: Observable<CombatResultStatistics>;
    constructor(private combatCalculation: CombatCalculationService) {
        this.combatResults$ = this.combatCalculation.combatResults$;
    }
}
