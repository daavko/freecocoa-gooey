import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, map, Observable, tap } from 'rxjs';
import { UnitType, VeteranLevel } from 'src/app/models/ruleset.model';
import { AttackerInfo } from 'src/app/models/combat-info.model';
import { RulesetFacade } from 'src/app/state/ruleset/public-api';

@Component({
    selector: 'app-attacker-form',
    templateUrl: './attacker-form.component.html',
    styleUrls: ['./attacker-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttackerFormComponent implements OnInit {
    @Input()
    public unitTypes: UnitType[] = [];

    @Output()
    public readonly attackerInfo = new EventEmitter<AttackerInfo>();

    public readonly attackerForm = new FormGroup({
        unitType: new FormControl<UnitType | null>(null, [Validators.required]),
        veteranLevel: new FormControl<VeteranLevel | null>(null, [Validators.required]),
        hp: new FormControl<number>(0),
        moves: new FormControl<number>(0)
    });

    public readonly availableVeteranLevels$: Observable<VeteranLevel[]>;
    public readonly maxHp$: Observable<number>;
    public readonly moveFrags$: Observable<number>;

    private lastKnownMoveFrags = 0;

    constructor(rulesetFacade: RulesetFacade) {
        const attackerUnitType$ = this.attackerForm.controls.unitType.valueChanges.pipe(
            filter((value): value is UnitType => value !== null)
        );
        this.availableVeteranLevels$ = attackerUnitType$.pipe(map((attacker) => attacker.veteranLevels));
        this.maxHp$ = attackerUnitType$.pipe(map((attacker) => attacker.hitpoints));
        this.moveFrags$ = rulesetFacade.ruleset$.pipe(
            map((ruleset) => ruleset.moveFrags),
            tap((moveFrags) => {
                this.lastKnownMoveFrags = moveFrags;
            })
        );
    }

    public ngOnInit(): void {
        this.attackerForm.valueChanges.subscribe((formValue) => {
            if (this.attackerForm.invalid) {
                return;
            }

            const { unitType, veteranLevel, hp, moves } = formValue;
            if (unitType == null || veteranLevel == null || hp == null || moves == null) {
                return;
            }

            this.attackerInfo.next({
                unitType,
                veteranLevel,
                hp,
                moves
            });
        });

        this.attackerForm.controls.veteranLevel.disable();
        this.attackerForm.controls.hp.disable();
        this.attackerForm.controls.moves.disable();
    }

    public formatMoves(value: number): string {
        return value === 9 ? '\u{2265}1' : `${value}/${this.lastKnownMoveFrags}`;
    }

    public unitTypeSelectionChanged(): void {
        const currentUnitType = this.attackerForm.controls.unitType.value;
        if (currentUnitType !== null) {
            this.attackerForm.enable();
            this.attackerForm.patchValue({
                veteranLevel: currentUnitType.veteranLevels[0] ?? null,
                hp: currentUnitType.hitpoints,
                moves: this.lastKnownMoveFrags
            });
        }
    }
}
