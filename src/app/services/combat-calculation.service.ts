import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Ruleset, Terrain, UnitClass, UnitType, UnitTypeBonus, VeteranLevel } from 'src/app/models/ruleset.model';
import { CombatResult, CombatResultStatistics, CombatRoundResult, WorldState } from 'src/app/models/combat-info.model';
import { EffectResolverService } from 'src/app/services/effect-resolver.service';
import { getUnitClassByName } from 'src/app/utils/ruleset-utils';
import { binomialProbabilityCumulative, binomialProbabilityMass, randomInt } from 'src/app/utils/number-utils';

// I don't know why this exists, but it does
const POWER_FACTOR = 10;

@Injectable({
    providedIn: 'root'
})
export class CombatCalculationService {
    private readonly ruleset = new BehaviorSubject<Ruleset | null>(null);
    constructor(private effectsResolver: EffectResolverService) {}

    public setRuleset(ruleset: Ruleset): void {
        console.info('Ruleset update', ruleset);
        this.ruleset.next(ruleset);
    }

    public calculateResultChances(ruleset: Ruleset, world: WorldState): [CombatResult, CombatResult] {
        const attUnitType = world.attacker.unitType;
        const defUnitType = world.defender.unitType;

        const attackPower = this.getTotalAttackPower(attUnitType, ruleset, world);
        const defendPower = this.getTotalDefensePower(attUnitType, defUnitType, ruleset, world);

        const [attackerFp, defenderFp] = this.getModifiedFirepower(attUnitType, defUnitType, ruleset, world);

        const attackerRoundWinChance = attackPower / (attackPower + defendPower);
        const defenderRoundWinChance = 1 - attackerRoundWinChance;

        const attackerCombatResult: CombatResult = {
            winChance: 0,
            hpChances: [],
            averageLostHp: 0,
            lostHpStdError: 0
        };

        const defenderCombatResult: CombatResult = {
            winChance: 0,
            hpChances: [],
            averageLostHp: 0,
            lostHpStdError: 0
        };

        /*
        TODO:
        basically, generate two sets of "win streaks", one for attacker final win, one for defender final win
        then, add wins for the other side at the beginning
        then, compute permutations, that gives us how many of those are there in total
        then, compute chance for this win streak (just the regular reduce()), multiply by permutation count
        add up all streaks together
        bam, chances for results

        variant 2:
        compute binomial stuffs for however many rounds are possible (there should be a very limited number of those,
        like up to 39*2 for 20hp 1fp units)
        then, we just map those to lost HP, get avgLostHp, get avgLostHpStdErr
        then, we could in theory compute the next unit for all scenarios where defenderCount > 0
        this should be 39^attackerCount for 20hp 1fp units (can we optimize this somehow? probably not, but still)
         */

        // Math.ceil to account for cases like 3 hp and 2 fp
        const attackerRequiredWinRounds = Math.ceil(world.defender.hp / attackerFp);
        const defenderRequiredWinRounds = Math.ceil(world.attacker.hp / defenderFp);
        const attackerMaximumLoseRounds = Math.max(defenderRequiredWinRounds - 1, 0);
        const defenderMaximumLoseRounds = Math.max(attackerRequiredWinRounds - 1, 0);

        // TODO: refactor those two loops into a single function
        //  (actually, should probably refactor this entire thing, it's a huge mess right now)
        for (let i = 0; i <= defenderMaximumLoseRounds; i++) {
            // defender win
            const roundProbability =
                binomialProbabilityMass(attackerMaximumLoseRounds + i, i, attackerRoundWinChance) *
                defenderRoundWinChance;
            const defenderHpLeft = world.defender.hp - i * attackerFp;
            defenderCombatResult.hpChances.push([defenderHpLeft, roundProbability]);
        }
        for (let i = 0; i <= attackerMaximumLoseRounds; i++) {
            // attacker win
            const roundProbability =
                binomialProbabilityMass(defenderMaximumLoseRounds + i, i, defenderRoundWinChance) *
                attackerRoundWinChance;
            const attackerHpLeft = world.attacker.hp - i * defenderFp;
            attackerCombatResult.hpChances.push([attackerHpLeft, roundProbability]);
        }

        const defenderWinChance = binomialProbabilityCumulative(
            attackerRequiredWinRounds + defenderRequiredWinRounds - 1,
            defenderMaximumLoseRounds,
            attackerRoundWinChance
        );
        defenderCombatResult.winChance = defenderWinChance;
        const attackerWinChance = 1 - defenderWinChance;
        attackerCombatResult.winChance = attackerWinChance;

        const [defenderAvgLostHp, defenderLostHpStdErr] = this.avgLostHpFromHpChances([
            ...defenderCombatResult.hpChances.map<[number, number]>(([result, probability]) => [
                world.defender.hp - result,
                probability
            ]),
            [world.defender.hp, attackerWinChance]
        ]);
        defenderCombatResult.averageLostHp = defenderAvgLostHp;
        defenderCombatResult.lostHpStdError = defenderLostHpStdErr;
        const [attackerAvgLostHp, attackerLostHpStdErr] = this.avgLostHpFromHpChances([
            ...attackerCombatResult.hpChances.map<[number, number]>(([result, probability]) => [
                world.attacker.hp - result,
                probability
            ]),
            [world.attacker.hp, defenderWinChance]
        ]);
        attackerCombatResult.averageLostHp = attackerAvgLostHp;
        attackerCombatResult.lostHpStdError = attackerLostHpStdErr;

        attackerCombatResult.hpChances.push([0, defenderWinChance]);
        defenderCombatResult.hpChances.push([0, attackerWinChance]);

        return [attackerCombatResult, defenderCombatResult];
    }

    // Leaving this here for now, even though it's not used anywhere
    public simulateCombat(ruleset: Ruleset, world: WorldState, combatRounds: number): CombatResultStatistics {
        const startTime = performance.now();
        const attUnitType = world.attacker.unitType;
        const defUnitType = world.defender.unitType;

        const attackPower = this.getTotalAttackPower(attUnitType, ruleset, world);
        const defendPower = this.getTotalDefensePower(attUnitType, defUnitType, ruleset, world);

        const [attackerFp, defenderFp] = this.getModifiedFirepower(attUnitType, defUnitType, ruleset, world);

        const beforeCombatTime = performance.now();
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

        const afterCombatTime = performance.now();
        const attackerWinRounds = rounds.filter((round) => round.defenderHp <= 0);
        const defenderWinRounds = rounds.filter((round) => round.attackerHp <= 0);

        let attLostHpTotal = 0;
        let attLostHpSquaresTotal = 0;
        let defLostHpTotal = 0;
        let defLostHpSquaresTotal = 0;

        for (const round of rounds) {
            const attRoundLostHp = world.attacker.hp - round.attackerHp;
            const defRoundLostHp = world.defender.hp - round.defenderHp;
            attLostHpTotal += attRoundLostHp;
            attLostHpSquaresTotal += attRoundLostHp ** 2;
            defLostHpTotal += defRoundLostHp;
            defLostHpSquaresTotal += defRoundLostHp ** 2;
        }

        const attackerAvgLostHp = attLostHpTotal / rounds.length;
        const defenderAvgLostHp = defLostHpTotal / rounds.length;

        const attackerAvgLostHpSquares = attLostHpSquaresTotal / rounds.length;
        const defenderAvgLostHpSquares = defLostHpSquaresTotal / rounds.length;
        const attackerLostHpStdError = Math.sqrt(attackerAvgLostHpSquares - attackerAvgLostHp ** 2);
        const defenderLostHpStdError = Math.sqrt(defenderAvgLostHpSquares - defenderAvgLostHp ** 2);

        const endTime = performance.now();
        console.log(
            `effects ${beforeCombatTime - startTime}, calc ${afterCombatTime - beforeCombatTime}, stats ${
                endTime - afterCombatTime
            }`
        );
        return {
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

        while (attackerHp > 0 && defenderHp > 0) {
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

        if (attUnitType.flags.includes('CityBuster') && world.defenderMeta.isInCity) {
            attackerFirepower *= 2;
        }

        const defenseBonusEffect = this.effectsResolver.resolveDefenseEffects(attUnitType, ruleset, world);
        if (attUnitType.flags.includes('BadWallAttacker') && defenseBonusEffect > 0) {
            attackerFirepower = 1;
        }

        if (defUnitType.flags.includes('BadCityDefender') && world.defenderMeta.isInCity) {
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

        const defTile = world.defenderMeta.terrain;
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

    private avgLostHpFromHpChances(hpResults: [number, number][]): [number, number] {
        const weightedHpResults = hpResults.map(([result, probability]) => result * probability);
        const weightedLostHpSum = weightedHpResults.reduce((sum, result) => sum + result, 0);
        const weightedLostHpSquaresSum = hpResults.reduce(
            (sum, [result, probability]) => sum + result ** 2 * probability,
            0
        );
        const weightedLostHpStdErr = Math.sqrt(weightedLostHpSquaresSum - weightedLostHpSum ** 2);
        return [weightedLostHpSum, weightedLostHpStdErr];
    }
}
