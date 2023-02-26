import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable } from 'rxjs';
import {
    RequirementRange,
    Ruleset,
    Terrain,
    UnitClass,
    UnitType,
    UnitTypeBonus,
    VeteranLevel
} from 'src/app/models/ruleset.model';
import {
    AttackerInfo,
    CombatResultStatistics,
    CombatRoundResult,
    DefenderInfo,
    WorldState
} from 'src/app/models/combat-info.model';
import { EffectResolverService } from 'src/app/services/effect-resolver.service';
import { getTerrainById, getUnitClassByName, getUnitTypeById } from 'src/app/utils/ruleset-utils';
import { randomInt } from 'src/app/utils/number-utils';

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

    public readonly combatResults$: Observable<CombatResultStatistics> = combineLatest([
        this.ruleset$,
        this.attackerInfo.pipe(filter((v): v is AttackerInfo => v !== null)),
        this.defenderInfo.pipe(filter((v): v is DefenderInfo => v !== null))
    ]).pipe(
        map(([ruleset, attackerInfo, defenderInfo]) => {
            const world: WorldState = {
                attacker: attackerInfo,
                defender: defenderInfo
            };

            console.time('combatSim');
            const result = this.simulateCombat(ruleset, world, 50000);
            console.timeEnd('combatSim');
            return result;
        })
    );

    constructor(private effectsResolver: EffectResolverService) {}

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

    public simulateCombat(ruleset: Ruleset, world: WorldState, combatRounds: number): CombatResultStatistics {
        const attUnitType = getUnitTypeById(ruleset, world.attacker.unitId);
        const defUnitType = getUnitTypeById(ruleset, world.defender.unitId);

        const attackPower = this.getTotalAttackPower(attUnitType, ruleset, world);
        const defendPower = this.getTotalDefensePower(attUnitType, defUnitType, ruleset, world);

        const [attackerFp, defenderFp] = this.getModifiedFirepower(attUnitType, defUnitType, ruleset, world);

        const rounds: CombatRoundResult[] = [];
        for (let i = 0; i < combatRounds; i++) {
            rounds.push(
                this.simulateCombatRound(
                    attackPower,
                    defendPower,
                    world.attacker.hp,
                    world.defender.hp,
                    attackerFp,
                    defenderFp
                )
            );
        }

        console.log(rounds);

        const attackerWinRounds = rounds.filter((round) => round.defenderHp <= 0);
        const defenderWinRounds = rounds.filter((round) => round.attackerHp <= 0);

        const attackerAvgLostHp =
            rounds
                .map((round) => world.attacker.hp - round.attackerHp)
                .reduce((total, roundLostHp) => total + roundLostHp, 0) / rounds.length;
        const defenderAvgLostHp =
            rounds
                .map((round) => world.defender.hp - round.defenderHp)
                .reduce((total, roundLostHp) => total + roundLostHp, 0) / rounds.length;

        const attackerAvgLostHpSquares =
            rounds
                .map((round) => world.attacker.hp - round.attackerHp)
                .map((hp) => hp ** 2)
                .reduce((total, roundLostHp) => total + roundLostHp, 0) / rounds.length;
        const defenderAvgLostHpSquares =
            rounds
                .map((round) => world.defender.hp - round.defenderHp)
                .map((hp) => hp ** 2)
                .reduce((total, roundLostHp) => total + roundLostHp, 0) / rounds.length;
        const attackerLostHpStdError = Math.sqrt(attackerAvgLostHpSquares - attackerAvgLostHp ** 2);
        const defenderLostHpStdError = Math.sqrt(defenderAvgLostHpSquares - defenderAvgLostHp ** 2);

        const result: CombatResultStatistics = {
            attacker: {
                winChance: attackerWinRounds.length / combatRounds,
                averageLostHp: attackerAvgLostHp,
                lostHpStdError: attackerLostHpStdError
            },
            defender: {
                winChance: defenderWinRounds.length / combatRounds,
                averageLostHp: defenderAvgLostHp,
                lostHpStdError: defenderLostHpStdError
            }
        };
        console.log(result);
        return result;
    }

    private simulateCombatRound(
        attackPower: number,
        defendPower: number,
        attackerStartingHp: number,
        defenderStartingHp: number,
        attackerFp: number,
        defenderFp: number
    ): CombatRoundResult {
        let attackerHp = attackerStartingHp;
        let defenderHp = defenderStartingHp;

        // TODO: variable combat rounds - unittools.cpp:291

        for (let round = 0; attackerHp > 0 && defenderHp > 0; round++) {
            if (randomInt(0, attackPower + defendPower) >= defendPower) {
                defenderHp -= attackerFp;
            } else {
                attackerHp -= defenderFp;
            }
        }

        return {
            attackerHp,
            defenderHp
        };
    }

    private getModifiedFirepower(
        attUnitType: UnitType,
        defUnitType: UnitType,
        ruleset: Ruleset,
        world: WorldState
    ): [number, number] {
        let attackerFirepower = attUnitType.firepower;
        let defenderFirepower = defUnitType.firepower;

        if (attUnitType.flags.includes('CityBuster') && world.defender.isInCity) {
            attackerFirepower *= 2;
        }

        const defenseBonusEffect = this.effectsResolver.resolveDefenseEffects(attUnitType, ruleset, world);
        if (attUnitType.flags.includes('BadWallAttacker') && defenseBonusEffect > 0) {
            attackerFirepower = 1;
        }

        if (defUnitType.flags.includes('BadCityDefender') && world.defender.isInCity) {
            attackerFirepower *= 2;
            defenderFirepower = 1;
        }

        const firepowerOneBonus = this.calculateCombatBonus(defUnitType.bonuses, 'Firepower1', attUnitType.flags);
        if (firepowerOneBonus > 0) {
            defenderFirepower = 1;
        }

        // todo: land bombardment - combat.cpp:396

        return [attackerFirepower, defenderFirepower];
    }

    private getTotalAttackPower(attUnitType: UnitType, ruleset: Ruleset, world: WorldState): number {
        let attackPower = Math.floor(
            (attUnitType.attack * POWER_FACTOR * world.attacker.veteranLevel.powerFactor) / 100
        );
        if (world.attacker.moves < ruleset.moveFrags) {
            attackPower = Math.floor((attackPower * world.attacker.moves) / ruleset.moveFrags);
        }

        // todo: attack bonus effect - combat.cpp:532

        return attackPower;
    }

    private getTotalDefensePower(
        attUnitType: UnitType,
        defUnitType: UnitType,
        ruleset: Ruleset,
        world: WorldState
    ): number {
        // combined with do_defense_multiplication, it's easier that way

        const defTile = getTerrainById(ruleset, world.defender.terrainId);
        const defUnitClass = getUnitClassByName(ruleset, defUnitType.class);

        let defensePower = this.getDefensePower(defUnitType, defUnitClass, defTile, world.defender.veteranLevel);

        const [defMultiplierBonus, defDividerBonus] = this.getDefenseBonuses(attUnitType, defUnitType);
        defensePower = Math.floor((defensePower * defMultiplierBonus) / 100);

        const defenseBonusEffect = 100 + this.effectsResolver.resolveDefenseEffects(attUnitType, ruleset, world);
        defensePower = Math.max(0, Math.floor((defensePower * defenseBonusEffect) / 100));

        defensePower = Math.floor((defensePower * 100) / defDividerBonus);

        // todo: tile defense bonus here - combat.cpp:583

        const fortifyDefenseBonusEffect =
            100 + this.effectsResolver.resolveFortifyDefendEffects(defUnitType, ruleset, world);

        defensePower = Math.floor((defensePower * fortifyDefenseBonusEffect) / 100);

        return defensePower;
    }

    private getDefensePower(
        defender: UnitType,
        defenderClass: UnitClass,
        defenderTile: Terrain,
        veteranLevel: VeteranLevel
    ): number {
        let defensePower = Math.floor((defender.defense * POWER_FACTOR * veteranLevel.powerFactor) / 100);
        if (defenderClass.flags.includes('TerrainDefense')) {
            const tileBonus = 100 + defenderTile.defenseBonus;
            defensePower = Math.floor((defensePower * tileBonus) / 100);
        }
        return defensePower;
    }

    private getDefenseBonuses(attacker: UnitType, defender: UnitType): [number, number] {
        const defenseMultiplierPct = this.calculateCombatBonus(
            defender.bonuses,
            'DefenseMultiplierPct',
            attacker.flags
        );
        const defenseMultiplier = this.calculateCombatBonus(defender.bonuses, 'DefenseMultiplier', attacker.flags);
        const totalDefenseMultiplierBonus = 100 + defenseMultiplierPct + 100 * defenseMultiplier;

        const defenseDividerPct = this.calculateCombatBonus(attacker.bonuses, 'DefenseDividerPct', defender.flags);
        const defenseDivider = this.calculateCombatBonus(attacker.bonuses, 'DefenseDivider', defender.flags);
        const totalDefenseDividerBonus = 100 + defenseDividerPct + 100 * defenseDivider;

        return [totalDefenseMultiplierBonus, totalDefenseDividerBonus];
    }

    private calculateCombatBonus(
        defenderBonuses: UnitTypeBonus[],
        targetBonusType: string,
        attackerFlags: string[]
    ): number {
        let total = 0;
        for (const bonus of defenderBonuses) {
            if (bonus.type === targetBonusType && attackerFlags.includes(bonus.flag)) {
                total += bonus.value;
            }
        }
        return total;
    }
}
