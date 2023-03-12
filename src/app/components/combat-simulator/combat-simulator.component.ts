import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';
import { combineLatest, map, Observable, shareReplay, Subject } from 'rxjs';
import { AttackerInfo, CombatResult, DefenderInfo, DefenderMetaInfo } from 'src/app/models/combat-info.model';
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

    public readonly attackerResult$: Observable<CombatResult>;
    public readonly defenderResult$: Observable<CombatResult>;

    private readonly attackerInfo = new Subject<AttackerInfo>();
    private readonly defenderInfo = new Subject<DefenderInfo>();
    private readonly defenderMetaInfo = new Subject<DefenderMetaInfo>();
    constructor(private rulesetFacade: RulesetFacade, private combatCalculation: CombatCalculationService) {
        const collator = new Intl.Collator('en');

        this.sortedUnitTypes$ = rulesetFacade.ruleset$.pipe(
            // ruleset.unitTypes is readonly so we have to clone it
            map((ruleset) => [...ruleset.unitTypes].sort((a, b) => collator.compare(a.name, b.name)))
        );

        // TODO: should this be moved to CombatSimulatorStore?
        const combatResults = combineLatest([
            rulesetFacade.ruleset$,
            this.attackerInfo,
            this.defenderInfo,
            this.defenderMetaInfo
        ]).pipe(
            map(([ruleset, attacker, defender, defenderMeta]) => {
                return this.combatCalculation.calculateResultChances(ruleset, { attacker, defender, defenderMeta });
            }),
            shareReplay({ refCount: false, bufferSize: 1 })
        );
        this.attackerResult$ = combatResults.pipe(map((results) => results[0]));
        this.defenderResult$ = combatResults.pipe(map((results) => results[1]));
    }

    public updateAttacker(attacker: AttackerInfo): void {
        this.attackerInfo.next(attacker);
    }

    public updateDefender(defender: DefenderInfo): void {
        this.defenderInfo.next(defender);
    }

    public updateDefenderMeta(defenderMeta: DefenderMetaInfo): void {
        this.defenderMetaInfo.next(defenderMeta);
    }
}
