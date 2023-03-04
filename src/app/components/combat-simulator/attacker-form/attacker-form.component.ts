import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';
import { combineLatest, filter, map, Observable } from 'rxjs';
import { Ruleset, UnitType, VeteranLevel } from 'src/app/models/ruleset.model';
import { getUnitTypeById } from 'src/app/utils/ruleset-utils';

@Component({
    selector: 'app-attacker-form',
    templateUrl: './attacker-form.component.html',
    styleUrls: ['./attacker-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttackerFormComponent {
    public attackerForm = new FormGroup({
        unit: new FormControl<string>('', [Validators.required]),
        veteran: new FormControl<VeteranLevel | null>(null, [Validators.required]),
        hp: new FormControl<number>(0),
        moves: new FormControl<number>(0)
    });

    public ruleset$: Observable<Ruleset>;
    public units$: Observable<UnitType[]>;
    public attackerVeteranLevels$: Observable<VeteranLevel[]>;
    public attackerMaxHp$: Observable<number>;

    private lastKnownMoveFrags = 0;

    constructor(private combatCalculator: CombatCalculationService) {
        const collator = new Intl.Collator('en');

        this.ruleset$ = combatCalculator.ruleset$;
        this.ruleset$.subscribe((ruleset) => {
            this.lastKnownMoveFrags = ruleset.moveFrags;
        });
        this.units$ = this.ruleset$.pipe(
            map((ruleset) => {
                return [...ruleset.unitTypes].sort((a, b) => {
                    return collator.compare(a.name, b.name);
                });
            })
        );

        const attackerUnit$ = combineLatest([
            this.ruleset$,
            this.attackerForm.controls.unit.valueChanges.pipe(filter((value): value is string => value !== null))
        ]).pipe(map(([ruleset, attacker]) => getUnitTypeById(ruleset, attacker)));
        this.attackerVeteranLevels$ = combineLatest([this.ruleset$, attackerUnit$]).pipe(
            map(([ruleset, attacker]) => {
                return attacker.veteranLevels.length > 0 ? attacker.veteranLevels : ruleset.defaultVeteranLevels;
            })
        );
        this.attackerMaxHp$ = attackerUnit$.pipe(map((attacker) => attacker.hitpoints));
        combineLatest([attackerUnit$, this.attackerVeteranLevels$]).subscribe(([unit, availableVeteranLevels]) => {
            this.attackerForm.patchValue({
                veteran: availableVeteranLevels[0],
                hp: unit.hitpoints,
                moves: this.lastKnownMoveFrags
            });
        });

        this.attackerForm.valueChanges.subscribe(() => {
            if (this.attackerForm.invalid) {
                return;
            }

            const {
                unit: { value: unitId },
                veteran: { value: veteranLevel },
                hp: { value: hp },
                moves: { value: moves }
            } = this.attackerForm.controls;
            this.combatCalculator.pushAttackerInfo({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                unitId: unitId!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                veteranLevel: veteranLevel!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                hp: hp!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't be null
                moves: moves!
            });
        });
    }

    public formatMoves(value: number): string {
        return value === 9 ? '\u{2265}1' : `${value}/${this.lastKnownMoveFrags}`;
    }
}
