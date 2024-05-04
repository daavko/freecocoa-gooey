import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RulesetFacade } from 'src/app/state/ruleset/ruleset.facade';
import { combineLatest, filter, map, Observable, Subject, takeUntil } from 'rxjs';
import { UnitType, VeteranLevel } from 'src/app/models/ruleset.model';
import { UnitCalculationService } from 'src/app/services/unit-calculation.service';
import { DeepNonNullable } from 'src/app/utils/utility-types';
import { MapService } from 'src/app/services/map.service';
import { MapInfo } from 'src/app/models/world-info.model';
import { maxOther } from 'src/app/utils/form-utils';
import { BribeCostResult } from 'src/app/models/bribe-info.model';

@Component({
    selector: 'app-bribe-cost-calculator',
    templateUrl: './bribe-cost-calculator.component.html',
    styleUrls: ['./bribe-cost-calculator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BribeCostCalculatorComponent implements OnDestroy {
    private readonly destroy$ = new Subject<void>();

    public readonly sortedUnitTypes$: Observable<UnitType[]>;
    public readonly availableVeteranLevels$: Observable<VeteranLevel[]>;
    public readonly maxHp$: Observable<number>;
    public readonly bribeCostResult$: Observable<BribeCostResult>;

    public readonly mapInfoForm = new FormGroup({
        xSize: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
        ySize: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
        wrapX: new FormControl<boolean>({ value: false, disabled: true }, { nonNullable: true }),
        wrapY: new FormControl<boolean>({ value: false, disabled: true }, { nonNullable: true }),
        isometric: new FormControl<boolean>({ value: false, disabled: true }, { nonNullable: true }),
        hex: new FormControl<boolean>({ value: false, disabled: true }, { nonNullable: true })
    });

    public readonly bribedUnitForm = new FormGroup({
        unitType: new FormControl<UnitType | null>(null, [Validators.required]),
        veteranLevel: new FormControl<VeteranLevel | null>({ value: null, disabled: true }, [Validators.required]),
        hp: new FormControl<number>(
            { value: 0, disabled: true },
            { nonNullable: true, validators: [Validators.required] }
        ),
        xCoordinate: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, maxOther(this.mapInfoForm.controls.xSize)]
        }),
        yCoordinate: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, maxOther(this.mapInfoForm.controls.ySize)]
        })
    });

    public readonly unitOwnerForm = new FormGroup({
        capitalXCoordinate: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, maxOther(this.mapInfoForm.controls.xSize)]
        }),
        capitalYCoordinate: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, maxOther(this.mapInfoForm.controls.ySize)]
        }),
        gold: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] })
    });

    public readonly gameInfoForm = new FormGroup({
        shieldBox: new FormControl<number>({ value: 0, disabled: true }, { nonNullable: true })
    });

    constructor(rulesetFacade: RulesetFacade, unitCalc: UnitCalculationService, mapService: MapService) {
        this.sortedUnitTypes$ = rulesetFacade.rulesetSortedUnitTypes$;

        const bribedUnitType$ = this.bribedUnitForm.controls.unitType.valueChanges.pipe(
            filter((value): value is UnitType => value !== null)
        );
        this.availableVeteranLevels$ = bribedUnitType$.pipe(map((attacker) => attacker.veteranLevels));
        this.maxHp$ = bribedUnitType$.pipe(map((unitType) => unitType.hitpoints));

        this.mapInfoForm.valueChanges.subscribe(() => {
            this.bribedUnitForm.controls.xCoordinate.updateValueAndValidity();
            this.bribedUnitForm.controls.yCoordinate.updateValueAndValidity();
            this.unitOwnerForm.controls.capitalXCoordinate.updateValueAndValidity();
            this.unitOwnerForm.controls.capitalYCoordinate.updateValueAndValidity();
        });

        rulesetFacade.gameSettings$.pipe(takeUntil(this.destroy$)).subscribe((settings) => {
            this.gameInfoForm.patchValue({
                shieldBox: settings.shieldbox
            });
            const mapInfo: MapInfo = {
                wrapX: settings.topology.includes('WRAPX'),
                wrapY: settings.topology.includes('WRAPY'),
                isometric: settings.topology.includes('ISO'),
                hex: settings.topology.includes('HEX')
            };
            const mapSize = mapService.resolveTopologySize(settings, mapInfo);
            this.mapInfoForm.patchValue({
                ...mapSize,
                ...mapInfo
            });
        });

        this.bribeCostResult$ = combineLatest([
            this.bribedUnitForm.valueChanges.pipe(
                filter(
                    (v): v is DeepNonNullable<Required<typeof v>> =>
                        this.bribedUnitForm.valid && v.unitType != null && v.veteranLevel != null
                )
            ),
            this.unitOwnerForm.valueChanges.pipe(filter((v): v is Required<typeof v> => this.unitOwnerForm.valid)),
            this.mapInfoForm.valueChanges.pipe(
                filter((v): v is DeepNonNullable<Required<typeof v>> => this.mapInfoForm.valid)
            ),
            rulesetFacade.ruleset$,
            rulesetFacade.gameSettings$
        ]).pipe(
            map(([bribedUnit, unitOwner, mapInfoForm, ruleset, gameSettings]) => {
                const mapSize = { xSize: mapInfoForm.xSize, ySize: mapInfoForm.ySize };
                const mapInfo = {
                    wrapX: mapInfoForm.wrapX,
                    wrapY: mapInfoForm.wrapY,
                    isometric: mapInfoForm.isometric,
                    hex: mapInfoForm.hex
                };
                return unitCalc.calculateBribeCost(
                    {
                        unitCoords: { x: bribedUnit.xCoordinate, y: bribedUnit.yCoordinate },
                        capitalCoords: { x: unitOwner.capitalXCoordinate, y: unitOwner.capitalYCoordinate },
                        gold: unitOwner.gold,
                        unitHp: bribedUnit.hp,
                        mapSize,
                        mapInfo,
                        veteranLevel: bribedUnit.veteranLevel,
                        unitType: bribedUnit.unitType
                    },
                    ruleset,
                    gameSettings
                );
            })
        );
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public unitTypeSelectionChanged(): void {
        const currentUnitType = this.bribedUnitForm.controls.unitType.value;
        if (currentUnitType !== null) {
            this.bribedUnitForm.enable();
            this.bribedUnitForm.patchValue({
                veteranLevel: currentUnitType.veteranLevels[0] ?? null,
                hp: currentUnitType.hitpoints
            });
        }
    }
}
