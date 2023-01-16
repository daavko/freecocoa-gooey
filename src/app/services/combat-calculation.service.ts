import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, tap } from 'rxjs';
import { Effect, RequirementRange, Ruleset, Terrain, UnitClass, UnitType } from 'src/app/models/ruleset.model';
import { AttackerInfo, CombatResults, DefenderInfo } from 'src/app/models/combat-info.model';
import { rules } from '@typescript-eslint/eslint-plugin';

const handleableRequirementTypes = [
    'Extra' /*of range Local*/,
    'UnitClass' /*of range Local*/,
    'Building' /*of range Player and City*/,
    'CityTile' /*of range Local*/,
    'MinSize' /*of range City*/
];

// I don't know why this exists, but it does
const POWER_FACTOR = 10;

@Injectable({
    providedIn: 'root'
})
export class CombatCalculationService {
    private readonly collator = new Intl.Collator('en');
    private readonly ruleset = new BehaviorSubject<Ruleset | null>(null);
    private readonly attackerInfo = new BehaviorSubject<AttackerInfo | null>(null);
    private readonly defenderInfo = new BehaviorSubject<DefenderInfo | null>(null);

    public readonly ruleset$ = this.ruleset.asObservable().pipe(filter((value): value is Ruleset => value !== null));
    public readonly defendEffects$ = this.ruleset$.pipe(
        map((ruleset) => ruleset.effects.filter((effect) => effect.type === 'Defend_Bonus'))
    );
    public readonly fortifyDefendEffects$ = this.ruleset$.pipe(
        map((ruleset) => ruleset.effects.filter((effect) => effect.type === 'Fortify_Defense_Bonus'))
    );
    public readonly defendExtras$ = this.defendEffects$.pipe(
        map((effects) =>
            effects
                .flatMap((effect) => effect.requirements)
                .filter((requirement) => requirement.type === 'Extra' && requirement.range === RequirementRange.LOCAL)
                .map((requirement) => requirement.name)
                .filter((building, index, array) => array.indexOf(building) === index)
                // eslint-disable-next-line @typescript-eslint/unbound-method -- safe, collator doesn't use this
                .sort(this.collator.compare)
        )
    );
    public readonly defendBuildings$ = this.defendEffects$.pipe(
        map((effects) =>
            effects
                .flatMap((effect) => effect.requirements)
                .filter((requirement) => requirement.type === 'Building' && requirement.range === RequirementRange.CITY)
                .map((requirement) => requirement.name)
                .filter((building, index, array) => array.indexOf(building) === index)
                // eslint-disable-next-line @typescript-eslint/unbound-method -- safe, collator doesn't use this
                .sort(this.collator.compare)
        )
    );
    public readonly defendWonders$ = this.defendEffects$.pipe(
        map((effects) =>
            effects
                .flatMap((effect) => effect.requirements)
                .filter(
                    (requirement) => requirement.type === 'Building' && requirement.range === RequirementRange.PLAYER
                )
                .map((requirement) => requirement.name)
                .filter((building, index, array) => array.indexOf(building) === index)
                // eslint-disable-next-line @typescript-eslint/unbound-method -- safe, collator doesn't use this
                .sort(this.collator.compare)
        )
    );

    public readonly combatResults$: Observable<CombatResults> = combineLatest([
        this.ruleset$,
        this.defendEffects$,
        this.fortifyDefendEffects$,
        this.attackerInfo.pipe(filter((v): v is AttackerInfo => v !== null)),
        this.defenderInfo.pipe(filter((v): v is DefenderInfo => v !== null))
    ]).pipe(
        map(([ruleset, defendEffects, fortifyDefendEffects, attackerInfo, defenderInfo]) => {
            const attackerUnit = ruleset.unitTypes.find((unit) => unit.id === attackerInfo.unitId);
            const defenderUnit = ruleset.unitTypes.find((unit) => unit.id === defenderInfo.unitId);
            const terrain = ruleset.terrainTypes.find((terrain) => terrain.id === defenderInfo.terrainId);

            if (attackerUnit === undefined || defenderUnit === undefined || terrain === undefined) {
                throw new Error('This should not happen');
            }

            const defenderUnitClass = ruleset.unitClasses.find((cl) => cl.name === defenderUnit.class);

            if (defenderUnitClass === undefined) {
                throw new Error('This should also not happen');
            }

            const attackPower = this.getAttackPower(ruleset, attackerUnit, attackerInfo);
            let defensePower = this.getDefensePower(terrain, defenderUnit, defenderUnitClass, defenderInfo);
            const breakdownDefensePower = defensePower;

            const defenseBonusEffect = 100 + this.resolveDefenseEffects(defendEffects, attackerUnit, defenderInfo);
            const fortifyDefenseBonusEffect =
                100 +
                this.resolveFortifyDefendEffects(fortifyDefendEffects, defenderUnit, defenderUnitClass, defenderInfo);
            defensePower = Math.floor((defensePower * defenseBonusEffect) / 100);
            defensePower = Math.floor((defensePower * fortifyDefenseBonusEffect) / 100);

            let attackerFirepower = attackerUnit.firepower;
            let defenderFirepower = defenderUnit.firepower;

            if (attackerUnit.flags.includes('CityBuster')) {
                attackerFirepower *= 2;
            }

            if (attackerUnit.flags.includes('BadWallAttacker') && defenseBonusEffect > 100) {
                attackerFirepower = 1;
            }

            if (defenderUnit.flags.includes('BadCityDefender')) {
                attackerFirepower *= 2;
                defenderFirepower = 1;
            }

            let winChance: number | undefined;
            if (attackerFirepower === 0) {
                winChance = 0;
            } else if (defenderFirepower === 0) {
                winChance = 1;
            }

            const attackerNoDeathRoundsCount = Math.floor(
                (attackerInfo.hp + defenderFirepower - 1) / defenderFirepower
            );
            const defenderNoDeathRoundsCount = Math.floor(
                (defenderInfo.hp + attackerFirepower - 1) / attackerFirepower
            );

            const attackerRoundLoseProb =
                attackPower + defensePower === 0 ? 0.5 : defensePower / (attackPower + defensePower);
            const defenderRoundLoseProb = 1 - attackerRoundLoseProb;

            let binomSave = Math.pow(defenderRoundLoseProb, defenderNoDeathRoundsCount - 1);
            let accumProb = binomSave;

            for (let round = 1; round < attackerNoDeathRoundsCount; round++) {
                const n = round + defenderNoDeathRoundsCount - 1;
                binomSave *= n;
                binomSave /= round;
                binomSave *= attackerRoundLoseProb;
                accumProb += binomSave;
            }
            accumProb *= defenderRoundLoseProb;

            console.log(accumProb);

            const result: CombatResults = {
                winChance: winChance !== undefined ? winChance : accumProb,
                breakdown: {
                    attackPower,
                    defensePower: breakdownDefensePower,
                    defenseBonusEffect: defenseBonusEffect - 100,
                    fortifyBonusEffect: fortifyDefenseBonusEffect - 100
                }
            };
            return result;
        })
    );

    public setRuleset(ruleset: Ruleset): void {
        console.info('Ruleset update', ruleset);
        this.ruleset.next(ruleset);
    }

    public pushAttackerInfo(info: AttackerInfo): void {
        console.info('Attacker info update', info);
        this.attackerInfo.next(info);
    }

    public pushDefenderInfo(info: DefenderInfo): void {
        console.info('Defender info update', info);
        this.defenderInfo.next(info);
    }

    private getAttackPower(ruleset: Ruleset, unit: UnitType, attackerInfo: AttackerInfo): number {
        let baseAttackPower = Math.floor((unit.attack * POWER_FACTOR * attackerInfo.veteranLevel) / 100);
        if (attackerInfo.moves < ruleset.moveFrags) {
            baseAttackPower = Math.floor((baseAttackPower * attackerInfo.moves) / ruleset.moveFrags);
        }
        return baseAttackPower;
    }

    private getDefensePower(tile: Terrain, unit: UnitType, unitClass: UnitClass, defenderInfo: DefenderInfo): number {
        let baseDefensePower = Math.floor((unit.defense * POWER_FACTOR * defenderInfo.veteranLevel) / 100);
        if (unitClass.flags.includes('TerrainDefense')) {
            const tileDefense = 100 + tile.defenseBonus;
            baseDefensePower = Math.floor((baseDefensePower * tileDefense) / 100);
        }
        return baseDefensePower;
    }

    private resolveDefenseEffects(effects: Effect[], attacker: UnitType, defenderInfo: DefenderInfo): number {
        let tally = 0;
        for (const effect of effects) {
            let applies = true;
            reqLoop: for (const req of effect.requirements) {
                let roundPassed;
                switch (req.type) {
                    case 'Building':
                        if (req.range === RequirementRange.CITY) {
                            roundPassed =
                                defenderInfo.isInCity && defenderInfo.buildings.includes(req.name)
                                    ? req.present
                                    : !req.present;
                        } else if (req.range === RequirementRange.PLAYER) {
                            roundPassed = defenderInfo.wonders.includes(req.name) ? req.present : !req.present;
                        } else {
                            // can't handle
                            applies = false;
                            break reqLoop;
                        }
                        break;
                    case 'CityTile':
                        roundPassed =
                            req.range === RequirementRange.LOCAL && defenderInfo.isInCity ? req.present : !req.present;
                        break;
                    case 'MinSize':
                        roundPassed =
                            req.range === RequirementRange.CITY &&
                            defenderInfo.isInCity &&
                            defenderInfo.citySize >= Number.parseInt(req.name)
                                ? req.present
                                : !req.present;
                        break;
                    case 'Extra':
                        roundPassed =
                            req.range === RequirementRange.LOCAL && defenderInfo.extras.includes(req.name)
                                ? req.present
                                : !req.present;
                        break;
                    case 'UnitClass':
                        roundPassed =
                            req.range === RequirementRange.LOCAL && req.name === attacker.class
                                ? req.present
                                : !req.present;
                        break;
                    default:
                        // unknown restriction, bail out
                        applies = false;
                        break reqLoop;
                }
                if (!roundPassed) {
                    applies = false;
                    break;
                }
            }
            if (applies) {
                tally += effect.value;
            }
        }
        return tally;
    }

    private resolveFortifyDefendEffects(
        effects: Effect[],
        defender: UnitType,
        defenderClass: UnitClass,
        defenderInfo: DefenderInfo
    ): number {
        let tally = 0;
        for (const effect of effects) {
            let applies = true;
            reqLoop: for (const req of effect.requirements) {
                let roundPassed;
                switch (req.type) {
                    case 'CityTile':
                        roundPassed =
                            req.range === RequirementRange.LOCAL && defenderInfo.isInCity ? req.present : !req.present;
                        break;
                    case 'Activity':
                        roundPassed =
                            req.range === RequirementRange.LOCAL && req.name === 'Fortified' && defenderInfo.isFortified
                                ? req.present
                                : !req.present;
                        break;
                    case 'UnitClassFlag':
                        roundPassed =
                            req.range === RequirementRange.LOCAL && defenderClass.flags.includes(req.name)
                                ? req.present
                                : !req.present;
                        break;
                    case 'UnitFlag':
                        roundPassed =
                            req.range === RequirementRange.LOCAL && defender.flags.includes(req.name)
                                ? req.present
                                : !req.present;
                        break;
                    default:
                        // unknown restriction, bail out
                        applies = false;
                        break reqLoop;
                }
                if (!roundPassed) {
                    applies = false;
                    break;
                }
            }
            if (applies) {
                tally += effect.value;
            }
        }
        return tally;
    }
}
