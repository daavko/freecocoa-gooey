import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, map, Observable } from 'rxjs';
import { UnitType, VeteranLevel } from 'src/app/models/ruleset.model';
import { DefenderInfo } from 'src/app/models/combat-info.model';

@Component({
    selector: 'app-defender-form',
    templateUrl: './defender-form.component.html',
    styleUrls: ['./defender-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenderFormComponent implements OnInit {
    @Input()
    public unitTypes: UnitType[] = [];

    @Output()
    public readonly defenderInfo = new EventEmitter<DefenderInfo>();

    public readonly defenderForm = new FormGroup({
        unitType: new FormControl<UnitType | null>(null, [Validators.required]),
        veteranLevel: new FormControl<VeteranLevel | null>(null, [Validators.required]),
        hp: new FormControl<number>(0),
        isFortified: new FormControl<boolean>(false)
    });

    public readonly availableVeteranLevels$: Observable<VeteranLevel[]>;
    public readonly maxHp$: Observable<number>;

    constructor() {
        const defenderUnitType$ = this.defenderForm.controls.unitType.valueChanges.pipe(
            filter((value): value is UnitType => value !== null)
        );
        this.availableVeteranLevels$ = defenderUnitType$.pipe(map((attacker) => attacker.veteranLevels));
        this.maxHp$ = defenderUnitType$.pipe(map((defender) => defender.hitpoints));
    }

    public ngOnInit(): void {
        this.defenderForm.valueChanges.subscribe((formValue) => {
            if (this.defenderForm.invalid) {
                return;
            }

            const { unitType, veteranLevel, hp, isFortified } = formValue;
            if (unitType == null || veteranLevel == null || hp == null || isFortified == null) {
                return;
            }

            this.defenderInfo.next({
                unitType,
                veteranLevel,
                hp,
                isFortified
            });
        });

        this.defenderForm.controls.veteranLevel.disable();
        this.defenderForm.controls.hp.disable();
        this.defenderForm.controls.isFortified.disable();
    }

    public unitTypeSelectionChanged(): void {
        const currentUnitType = this.defenderForm.controls.unitType.value;
        if (currentUnitType !== null) {
            this.defenderForm.enable();
            this.defenderForm.patchValue({
                veteranLevel: currentUnitType.veteranLevels[0] ?? null,
                hp: currentUnitType.hitpoints
            });
        }
    }
}
