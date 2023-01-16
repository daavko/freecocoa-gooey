import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';
import { Observable } from 'rxjs';
import { CombatResults } from 'src/app/models/combat-info.model';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    public readonly combatResults$: Observable<CombatResults>;
    constructor(private combatCalculation: CombatCalculationService) {
        this.combatResults$ = this.combatCalculation.combatResults$;
    }
}
