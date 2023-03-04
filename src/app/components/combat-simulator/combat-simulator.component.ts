import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';
import { map, Observable } from 'rxjs';
import { CombatResultStatistics } from 'src/app/models/combat-info.model';
import { RulesetFacade } from 'src/app/state/ruleset/public-api';
import { UnitType } from 'src/app/models/ruleset.model';

@Component({
    selector: 'app-combat-simulator',
    templateUrl: './combat-simulator.component.html',
    styleUrls: ['./combat-simulator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CombatSimulatorComponent {
    public readonly sortedUnitTypes$: Observable<UnitType[]>;

    public readonly combatResults$: Observable<CombatResultStatistics>;
    constructor(private rulesetFacade: RulesetFacade, private combatCalculation: CombatCalculationService) {
        const collator = new Intl.Collator('en');

        this.sortedUnitTypes$ = rulesetFacade.ruleset$.pipe(
            // ruleset.unitTypes is readonly so we have to clone it
            map((ruleset) => [...ruleset.unitTypes].sort((a, b) => collator.compare(a.name, b.name)))
        );

        this.combatResults$ = this.combatCalculation.combatResults$;
    }
}
