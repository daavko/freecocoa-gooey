import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, map, Observable } from 'rxjs';
import { Terrain, UnitType, VeteranLevel } from 'src/app/models/ruleset.model';
import { DefenderInfo } from 'src/app/models/combat-info.model';
import { RulesetFacade } from 'src/app/state/ruleset/public-api';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';

@Component({
    selector: 'app-defender-form',
    templateUrl: './defender-form.component.html',
    styleUrls: ['./defender-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenderFormComponent {
    @Input()
    public unitTypes: UnitType[] = [];

    @Output()
    public readonly defenderInfo = new EventEmitter<DefenderInfo>();

    public readonly defenderForm = new FormGroup({
        unitType: new FormControl<UnitType | null>(null, [Validators.required]),
        veteranLevel: new FormControl<VeteranLevel | null>(null, [Validators.required]),
        hp: new FormControl<number>(0),
        terrain: new FormControl<Terrain | null>(null, [Validators.required]),
        isInCity: new FormControl<boolean>(false),
        citySize: new FormControl<number>(1, [Validators.required]),
        isFortified: new FormControl<boolean>(false),
        tileExtras: new FormControl<string[]>([]),
        cityBuildings: new FormControl<string[]>([]),
        playerWonders: new FormControl<string[]>([])
    });

    public readonly availableVeteranLevels$: Observable<VeteranLevel[]>;
    public readonly maxHp$: Observable<number>;
    public readonly terrains$: Observable<Terrain[]>;
    public readonly extras$: Observable<string[]>;
    public readonly buildings$: Observable<string[]>;
    public readonly wonders$: Observable<string[]>;

    constructor(rulesetFacade: RulesetFacade, private combatCalculator: CombatCalculationService) {
        const collator = new Intl.Collator('en');

        const defenderUnitType$ = this.defenderForm.controls.unitType.valueChanges.pipe(
            filter((value): value is UnitType => value !== null)
        );
        this.availableVeteranLevels$ = defenderUnitType$.pipe(map((attacker) => attacker.veteranLevels));
        this.maxHp$ = defenderUnitType$.pipe(map((defender) => defender.hitpoints));
        this.terrains$ = rulesetFacade.ruleset$.pipe(
            map((ruleset) => {
                const terrains = [...ruleset.terrainTypes];
                return terrains.sort((a, b) => collator.compare(a.name, b.name));
            })
        );
        this.extras$ = combatCalculator.defendExtras$;
        this.buildings$ = combatCalculator.defendBuildings$;
        this.wonders$ = this.combatCalculator.defendWonders$;

        // TODO: emit defenderInfo on form value change
    }

    public unitTypeSelectionChanged(): void {
        const currentUnitType = this.defenderForm.controls.unitType.value;
        this.defenderForm.patchValue({
            veteranLevel: currentUnitType?.veteranLevels[0] ?? null,
            hp: currentUnitType?.hitpoints ?? 0
        });
    }
}
