import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { RequirementRange, Terrain, TerrainExtra } from 'src/app/models/ruleset.model';
import { RulesetFacade } from 'src/app/state/ruleset/ruleset.facade';
import { isOriginalItemIndex } from 'src/app/utils/array-utils';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DefenderMetaInfo } from 'src/app/models/combat-info.model';

@Component({
    selector: 'app-defender-meta-form',
    templateUrl: './defender-meta-form.component.html',
    styleUrls: ['./defender-meta-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenderMetaFormComponent implements OnInit {
    @Output()
    public readonly defenderMetaInfo = new EventEmitter<DefenderMetaInfo>();

    public readonly defenderMetaForm = new FormGroup({
        terrain: new FormControl<Terrain | null>(null, [Validators.required]),
        isInCity: new FormControl<boolean>(false),
        citySize: new FormControl<number>(1, [Validators.required]),
        tileExtras: new FormControl<TerrainExtra[]>([]),
        cityBuildings: new FormControl<string[]>([]),
        playerWonders: new FormControl<string[]>([])
    });

    public readonly terrains$: Observable<Terrain[]>;
    public readonly extras$: Observable<TerrainExtra[]>;
    public readonly buildings$: Observable<string[]>;
    public readonly wonders$: Observable<string[]>;

    constructor(rulesetFacade: RulesetFacade) {
        const collator = new Intl.Collator('en');

        this.terrains$ = rulesetFacade.ruleset$.pipe(
            map((ruleset) => {
                const terrains: Terrain[] = [...ruleset.terrainTypes];
                return terrains.sort((a, b) => collator.compare(a.name, b.name));
            })
        );

        const defendBonusEffects$ = rulesetFacade.ruleset$.pipe(
            map((ruleset) => ruleset.effects.filter((effect) => effect.type === 'Defend_Bonus'))
        );
        this.extras$ = combineLatest([rulesetFacade.ruleset$, defendBonusEffects$]).pipe(
            map(([ruleset, effects]) => {
                const extras: TerrainExtra[] = [...ruleset.terrainExtras];
                const effectExtraNames = effects
                    .flatMap((effect) => effect.requirements)
                    .filter(
                        (requirement) => requirement.type === 'Extra' && requirement.range === RequirementRange.LOCAL
                    )
                    .map((requirement) => requirement.name)
                    .filter((extra, index, array) => isOriginalItemIndex(extra, index, array));
                return extras
                    .filter(
                        (extra) =>
                            extra.defenseBonus > 0 ||
                            (extra.flags.includes('NativeTile') && extra.nativeUnitClasses.length > 0) ||
                            effectExtraNames.includes(extra.name)
                    )
                    .sort((a, b) => collator.compare(a.name, b.name));
            })
        );
        this.buildings$ = defendBonusEffects$.pipe(
            map((effects) =>
                effects
                    .flatMap((effect) => effect.requirements)
                    .filter(
                        (requirement) => requirement.type === 'Building' && requirement.range === RequirementRange.CITY
                    )
                    .map((requirement) => requirement.name)
                    .filter((building, index, array) => isOriginalItemIndex(building, index, array))
                    // eslint-disable-next-line @typescript-eslint/unbound-method -- safe, collator doesn't use this
                    .sort(collator.compare)
            )
        );
        this.wonders$ = defendBonusEffects$.pipe(
            map((effects) =>
                effects
                    .flatMap((effect) => effect.requirements)
                    .filter(
                        (requirement) =>
                            requirement.type === 'Building' && requirement.range === RequirementRange.PLAYER
                    )
                    .map((requirement) => requirement.name)
                    .filter((wonder, index, array) => isOriginalItemIndex(wonder, index, array))
                    // eslint-disable-next-line @typescript-eslint/unbound-method -- safe, collator doesn't use this
                    .sort(collator.compare)
            )
        );
    }

    public ngOnInit(): void {
        this.defenderMetaForm.valueChanges.subscribe((formValue) => {
            if (this.defenderMetaForm.invalid) {
                return;
            }

            const { terrain, isInCity, citySize, tileExtras, cityBuildings, playerWonders } = formValue;
            if (
                terrain == null ||
                isInCity == null ||
                citySize == null ||
                tileExtras == null ||
                cityBuildings == null ||
                playerWonders == null
            ) {
                return;
            }

            this.defenderMetaInfo.next({
                terrain,
                isInCity,
                citySize,
                extras: tileExtras,
                buildings: cityBuildings,
                wonders: playerWonders
            });
        });
    }
}
