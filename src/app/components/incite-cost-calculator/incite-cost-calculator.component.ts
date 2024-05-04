import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { Building, UnitType } from 'src/app/models/ruleset.model';
import {
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    Observable,
    startWith,
    Subject,
    takeUntil,
    tap,
    withLatestFrom
} from 'rxjs';
import { RulesetFacade } from 'src/app/state/ruleset/ruleset.facade';
import { maxOther, passErrorToDescendants } from 'src/app/utils/form-utils';
import { MapService } from 'src/app/services/map.service';
import { MapInfo } from 'src/app/models/world-info.model';
import { CityCalculationService } from 'src/app/services/city-calculation.service';
import { InciteCostResult } from 'src/app/models/incite-info.model';

type UnitFormGroup = FormGroup<{
    unitType: FormControl<UnitType | null>;
    unitCount: FormControl<number>;
}>;

type UnitsFormValue = {
    units: {
        unitType: UnitType | null;
        unitCount: number;
    }[];
};

const nationalityValidator =
    (sizeControl: AbstractControl<number>, totalControls: AbstractControl<number>[]): ValidatorFn =>
    (): ValidationErrors | null => {
        const size = sizeControl.value;

        const total = totalControls.reduce((acc, control) => acc + control.value, 0);

        if (total !== size) {
            return { nationalitiesDoNotMatchSize: true };
        } else {
            return null;
        }
    };
const happinessValidator =
    (sizeControl: AbstractControl<number>, happinessControls: AbstractControl<number>[]): ValidatorFn =>
    (): ValidationErrors | null => {
        const size = sizeControl.value;

        const happy = happinessControls.reduce((acc, control) => acc + control.value, 0);

        if (happy !== size) {
            return { happinessDoesNotMatchSize: true };
        } else {
            return null;
        }
    };

@Component({
    selector: 'app-incite-cost-calculator',
    templateUrl: './incite-cost-calculator.component.html',
    styleUrls: ['./incite-cost-calculator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InciteCostCalculatorComponent implements OnDestroy {
    private readonly destroy$ = new Subject<void>();

    public readonly unitTypes$: Observable<UnitType[]>;
    public readonly buildings$: Observable<Building[]>;
    public readonly nationalityEnabled$: Observable<boolean>;
    public readonly inciteCostResult$: Observable<InciteCostResult>;

    public readonly mapInfoForm = new FormGroup({
        xSize: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
        ySize: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
        wrapX: new FormControl<boolean>({ value: false, disabled: true }, { nonNullable: true }),
        wrapY: new FormControl<boolean>({ value: false, disabled: true }, { nonNullable: true }),
        isometric: new FormControl<boolean>({ value: false, disabled: true }, { nonNullable: true }),
        hex: new FormControl<boolean>({ value: false, disabled: true }, { nonNullable: true })
    });

    public readonly cityInfoForm = new FormGroup({
        size: new FormControl<number>(1, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(1)]
        }),
        happyCitizens: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        }),
        contentCitizens: new FormControl<number>(1, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        }),
        unhappyCitizens: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        }),
        angryCitizens: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        }),
        xCoordinate: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0), maxOther(this.mapInfoForm.controls.xSize)]
        }),
        yCoordinate: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0), maxOther(this.mapInfoForm.controls.ySize)]
        })
    });

    public readonly cityMetaForm = new FormGroup({
        originalOwner: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] })
    });

    public readonly cityNationalityForm = new FormGroup({
        inciter: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        }),
        currentOwner: new FormControl<number>(1, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        }),
        thirdParties: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        })
    });

    public readonly cityOwnerForm = new FormGroup({
        gold: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
        capitalXCoordinate: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0), maxOther(this.mapInfoForm.controls.xSize)]
        }),
        capitalYCoordinate: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0), maxOther(this.mapInfoForm.controls.ySize)]
        })
    });

    public readonly unitsForm = new FormGroup({
        units: new FormArray<UnitFormGroup>([])
    });

    public readonly buildingsForm = new FormGroup({
        buildings: new FormControl<Building[]>([], { nonNullable: true })
    });

    public get unitsFormGroups(): UnitFormGroup[] {
        return this.unitsForm.controls.units.controls;
    }

    constructor(
        private readonly formBuilder: FormBuilder,
        rulesetFacade: RulesetFacade,
        mapService: MapService,
        cityCalc: CityCalculationService
    ) {
        this.unitTypes$ = rulesetFacade.rulesetSortedUnitTypes$;
        this.buildings$ = rulesetFacade.rulesetSortedBuildings$;
        this.nationalityEnabled$ = rulesetFacade.ruleset$.pipe(
            map((ruleset) => ruleset.citizenSettings.nationality),
            takeUntil(this.destroy$)
        );

        this.inciteCostResult$ = combineLatest([
            rulesetFacade.ruleset$,
            rulesetFacade.gameSettings$,
            this.mapInfoForm.valueChanges.pipe(
                startWith(this.mapInfoForm.value),
                filter((v): v is Required<typeof v> => this.mapInfoForm.valid)
            ),
            this.cityInfoForm.valueChanges.pipe(
                startWith(this.cityInfoForm.value),
                filter((v): v is Required<typeof v> => this.cityInfoForm.valid)
            ),
            this.cityMetaForm.valueChanges.pipe(
                startWith(this.cityMetaForm.value),
                withLatestFrom(this.nationalityEnabled$, (value, enabled) =>
                    enabled ? (value as Required<typeof value>) : undefined
                ),
                filter((v) => this.cityMetaForm.valid || v === undefined),
                startWith(undefined)
            ),
            this.cityNationalityForm.valueChanges.pipe(
                startWith(this.cityNationalityForm.value),
                withLatestFrom(this.nationalityEnabled$, (value, enabled) =>
                    enabled ? (value as Required<typeof value>) : undefined
                ),
                filter((v) => this.cityNationalityForm.valid || v === undefined),
                startWith(undefined)
            ),
            this.cityOwnerForm.valueChanges.pipe(
                startWith(this.cityOwnerForm.value),
                filter((v): v is Required<typeof v> => this.cityOwnerForm.valid)
            ),
            this.unitsForm.valueChanges.pipe(
                startWith(this.unitsForm.value),
                filter((v): v is UnitsFormValue => this.unitsForm.valid)
            ),
            this.buildingsForm.valueChanges.pipe(
                startWith(this.buildingsForm.value),
                filter((v): v is Required<typeof v> => this.buildingsForm.valid)
            )
        ]).pipe(
            map(
                ([
                    ruleset,
                    gameSettings,
                    mapInfo,
                    cityInfo,
                    cityMeta,
                    cityNationality,
                    cityOwner,
                    units,
                    { buildings }
                ]) => {
                    const { xSize, ySize, wrapX, wrapY, isometric, hex } = mapInfo;
                    return cityCalc.calculateInciteCost(
                        ruleset,
                        {
                            ownerGold: cityOwner.gold,
                            units: units.units.flatMap((unit) => Array(unit.unitCount).fill(unit.unitType)),
                            buildings,
                            cityCoordinates: { x: cityInfo.xCoordinate, y: cityInfo.yCoordinate },
                            capitalCoordinates: { x: cityOwner.capitalXCoordinate, y: cityOwner.capitalYCoordinate },
                            citySize: cityInfo.size,
                            citizenBreakdown: {
                                happy: cityInfo.happyCitizens,
                                content: cityInfo.contentCitizens,
                                unhappy: cityInfo.unhappyCitizens,
                                angry: cityInfo.angryCitizens
                            },
                            currentOwnerIsOriginalOwner: cityMeta?.originalOwner === 1,
                            inciterIsOriginalOwner: cityMeta?.originalOwner === 2,
                            mapSize: { xSize, ySize },
                            mapInfo: { wrapX, wrapY, isometric, hex },
                            nationalityBreakdown: cityNationality
                        },
                        gameSettings
                    );
                }
            )
        );

        const totalControls = [
            this.cityNationalityForm.controls.inciter,
            this.cityNationalityForm.controls.currentOwner,
            this.cityNationalityForm.controls.thirdParties
        ];
        const happinessControls = [
            this.cityInfoForm.controls.happyCitizens,
            this.cityInfoForm.controls.contentCitizens,
            this.cityInfoForm.controls.unhappyCitizens,
            this.cityInfoForm.controls.angryCitizens
        ];
        this.cityInfoForm.addValidators([
            nationalityValidator(this.cityInfoForm.controls.size, totalControls),
            happinessValidator(this.cityInfoForm.controls.size, happinessControls)
        ]);
        this.cityInfoForm.updateValueAndValidity();

        this.cityInfoForm.statusChanges
            .pipe(
                map(() => this.cityInfoForm.errors),
                distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current))
            )
            .subscribe(() => {
                passErrorToDescendants(
                    this.cityInfoForm,
                    [
                        this.cityInfoForm.controls.size,
                        this.cityInfoForm.controls.happyCitizens,
                        this.cityInfoForm.controls.contentCitizens,
                        this.cityInfoForm.controls.unhappyCitizens,
                        this.cityInfoForm.controls.angryCitizens
                    ],
                    'happinessDoesNotMatchSize'
                );
                passErrorToDescendants(
                    this.cityInfoForm,
                    [this.cityInfoForm.controls.size],
                    'nationalitiesDoNotMatchSize'
                );
                this.cityInfoForm.updateValueAndValidity();
                this.cityNationalityForm.updateValueAndValidity();
            });

        this.cityNationalityForm.addValidators([nationalityValidator(this.cityInfoForm.controls.size, totalControls)]);
        this.cityNationalityForm.updateValueAndValidity();

        this.cityNationalityForm.statusChanges
            .pipe(
                map(() => this.cityNationalityForm.errors),
                distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current))
            )
            .subscribe(() => {
                passErrorToDescendants(
                    this.cityNationalityForm,
                    [
                        this.cityNationalityForm.controls.inciter,
                        this.cityNationalityForm.controls.currentOwner,
                        this.cityNationalityForm.controls.thirdParties
                    ],
                    'nationalitiesDoNotMatchSize'
                );
                this.cityInfoForm.updateValueAndValidity();
                this.cityNationalityForm.updateValueAndValidity();
            });

        this.cityMetaForm.disable();
        this.cityNationalityForm.disable();

        this.nationalityEnabled$.subscribe((nationalityEnabled) => {
            if (nationalityEnabled) {
                this.cityNationalityForm.enable();
                this.cityMetaForm.disable();
            } else {
                this.cityNationalityForm.disable();
                this.cityMetaForm.enable();
            }
        });

        this.mapInfoForm.valueChanges.subscribe(() => {
            this.cityInfoForm.controls.xCoordinate.updateValueAndValidity();
            this.cityInfoForm.controls.yCoordinate.updateValueAndValidity();
            this.cityOwnerForm.controls.capitalXCoordinate.updateValueAndValidity();
            this.cityOwnerForm.controls.capitalYCoordinate.updateValueAndValidity();
        });

        rulesetFacade.gameSettings$.pipe(takeUntil(this.destroy$)).subscribe((settings) => {
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
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public addUnit(): void {
        const unit = this.formBuilder.group({
            unitType: this.formBuilder.control<UnitType | null>(null, [Validators.required]),
            unitCount: this.formBuilder.control<number>(1, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(1)]
            })
        });
        this.unitsForm.controls.units.push(unit);
    }

    public removeUnit(index: number): void {
        this.unitsForm.controls.units.removeAt(index);
    }
}
