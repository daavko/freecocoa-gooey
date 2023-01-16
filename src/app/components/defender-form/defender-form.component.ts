import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { combineLatest, filter, map, Observable, Subject, Subscription } from 'rxjs';
import { Ruleset, UnitType, VeteranLevel } from 'src/app/models/ruleset.model';

@Component({
    selector: 'app-defender-form',
    templateUrl: './defender-form.component.html',
    styleUrls: ['./defender-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenderFormComponent {
    public defenderForm = new FormGroup({
        unit: new FormControl<string>('', [Validators.required]),
        veteran: new FormControl<number>(100, [Validators.required]),
        hp: new FormControl<number>(0),
        terrain: new FormControl<string>('', [Validators.required]),
        isInCity: new FormControl<boolean>(false),
        citySize: new FormControl<number>(1, [Validators.required]),
        isFortified: new FormControl<boolean>(false),
        extras: new FormArray<FormControl<boolean | null>>([]),
        buildings: new FormArray<FormControl<boolean | null>>([]),
        wonders: new FormArray<FormControl<boolean | null>>([])
    });

    public ruleset$: Observable<Ruleset>;
    public units$: Observable<UnitType[]>;
    public defenderVeteranLevels$: Observable<VeteranLevel[]>;
    public defenderMaxHp$: Observable<number>;

    public extras$: Observable<string[]>;
    private extrasFormUpdate$ = new Subject<void>();
    private extrasFormUpdatesSub?: Subscription;
    public buildings$: Observable<string[]>;
    private buildingsFormUpdate$ = new Subject<void>();
    private buildingsFormUpdatesSub?: Subscription;
    public wonders$: Observable<string[]>;
    private wondersFormUpdate$ = new Subject<void>();
    private wondersFormUpdatesSub?: Subscription;

    constructor(private combatCalculator: CombatCalculationService, private formBuilder: FormBuilder) {
        const collator = new Intl.Collator('en');

        this.ruleset$ = combatCalculator.ruleset$;
        this.units$ = this.ruleset$.pipe(
            map((ruleset) => {
                return ruleset.unitTypes.sort((a, b) => {
                    return collator.compare(a.name, b.name);
                });
            })
        );

        const defenderUnit$ = combineLatest([this.ruleset$, this.defenderForm.controls.unit.valueChanges]).pipe(
            map(([ruleset, defender]) => ruleset.unitTypes.find((type) => type.id === defender)),
            filter((defender): defender is UnitType => defender !== undefined)
        );
        this.defenderVeteranLevels$ = combineLatest([this.ruleset$, defenderUnit$]).pipe(
            map(([ruleset, attacker]) => {
                if (attacker.veteranLevels.length > 0) {
                    return attacker.veteranLevels;
                } else {
                    return ruleset.defaultVeteranLevels;
                }
            })
        );
        this.defenderMaxHp$ = defenderUnit$.pipe(map((defender) => defender.hitpoints));
        combineLatest([defenderUnit$, this.defenderVeteranLevels$]).subscribe(([unit, availableVeteranLevels]) => {
            this.defenderForm.controls.veteran.setValue(availableVeteranLevels[0].powerFactor);
            this.defenderForm.controls.hp.setValue(unit.hitpoints);
        });

        this.extras$ = combatCalculator.defendExtras$;
        this.extras$.subscribe((extras) => {
            this.extrasFormUpdatesSub?.unsubscribe();
            this.defenderForm.controls.extras = this.formBuilder.array(
                extras.map(() => new FormControl<boolean>(false))
            );
            // eslint-disable-next-line rxjs/no-nested-subscribe -- I know what I'm doing
            this.extrasFormUpdatesSub = this.defenderForm.controls.extras.valueChanges.subscribe(() =>
                this.extrasFormUpdate$.next()
            );
            this.extrasFormUpdate$.next();
        });
        this.buildings$ = combatCalculator.defendBuildings$;
        this.buildings$.subscribe((buildings) => {
            this.buildingsFormUpdatesSub?.unsubscribe();
            this.defenderForm.controls.buildings = this.formBuilder.array(
                buildings.map(() => new FormControl<boolean>(false))
            );
            // eslint-disable-next-line rxjs/no-nested-subscribe -- I know what I'm doing
            this.buildingsFormUpdatesSub = this.defenderForm.controls.buildings.valueChanges.subscribe(() => {
                this.buildingsFormUpdate$.next();
            });
            this.buildingsFormUpdate$.next();
        });
        this.wonders$ = this.combatCalculator.defendWonders$;
        this.wonders$.subscribe((wonders) => {
            this.wondersFormUpdatesSub?.unsubscribe();
            this.defenderForm.controls.wonders = this.formBuilder.array(
                wonders.map(() => new FormControl<boolean>(false))
            );
            // eslint-disable-next-line rxjs/no-nested-subscribe -- I know what I'm doing
            this.wondersFormUpdatesSub = this.defenderForm.controls.wonders.valueChanges.subscribe(() => {
                this.wondersFormUpdate$.next();
            });
            this.wondersFormUpdate$.next();
        });

        combineLatest([
            this.defenderForm.valueChanges,
            this.extrasFormUpdate$,
            this.buildingsFormUpdate$,
            this.wondersFormUpdate$,
            this.extras$,
            this.buildings$,
            this.wonders$
        ]).subscribe(([, , , , extras, buildings, wonders]) => {
            if (this.defenderForm.invalid) {
                return;
            }

            const {
                unit: { value: unitId },
                veteran: { value: veteranLevel },
                hp: { value: hp },
                terrain: { value: terrainId },
                isInCity: { value: isInCity },
                citySize: { value: citySize },
                isFortified: { value: isFortified },
                extras: { controls: extrasControls },
                buildings: { controls: buildingsControls },
                wonders: { controls: wondersControls }
            } = this.defenderForm.controls;

            this.combatCalculator.pushDefenderInfo({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                unitId: unitId!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                veteranLevel: veteranLevel!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                hp: hp!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                terrainId: terrainId!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                isInCity: isInCity!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                citySize: citySize!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                isFortified: isFortified!,
                extras: extrasControls
                    .map((control, index) => (control.value ? extras[index] : null))
                    .filter((value): value is string => value !== null),
                buildings: buildingsControls
                    .map((control, index) => (control.value ? buildings[index] : null))
                    .filter((value): value is string => value !== null),
                wonders: wondersControls
                    .map((control, index) => (control.value ? wonders[index] : null))
                    .filter((value): value is string => value !== null)
            });
        });
    }
}
