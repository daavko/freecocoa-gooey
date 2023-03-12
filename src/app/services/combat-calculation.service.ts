import { Injectable } from '@angular/core';
import {
    Ruleset,
    Terrain,
    TerrainExtra,
    UnitClass,
    UnitType,
    UnitTypeBonus,
    VeteranLevel
} from 'src/app/models/ruleset.model';
import { CombatResult, WorldState } from 'src/app/models/combat-info.model';
import { EffectResolverService } from 'src/app/services/effect-resolver.service';
import { getUnitClassByName } from 'src/app/utils/ruleset-utils';
import { binomialProbabilityCumulative, binomialProbabilityMass } from 'src/app/utils/number-utils';

// I don't know why this exists, but it does
const POWER_FACTOR = 10;

@Injectable({
    providedIn: 'root'
})
export class CombatCalculationService {
    constructor(private effectsResolver: EffectResolverService) {}

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

        if (
            this.isLandBombardment(
                attUnitType.class,
                world.defenderMeta.terrain,
                world.defenderMeta.extras,
                world.defenderMeta.isInCity
            )
        ) {
            attackerFirepower = 1;
            defenderFirepower = 1;
        }

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

        const extrasDefenseBonus = this.getExtrasDefenseBonus(world.defenderMeta.extras, defUnitType.class);
        defensePower += Math.floor((defensePower * extrasDefenseBonus) / 100);

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

    private getExtrasDefenseBonus(tileExtras: TerrainExtra[], unitClassName: string): number {
        const naturalDefensiveBonus = tileExtras
            .filter(
                (extra) =>
                    extra.nativeUnitClasses.includes(unitClassName) &&
                    extra.flags.includes('NaturalDefense') &&
                    extra.defenseBonus > 0
            )
            .reduce((bonus, extra) => bonus + extra.defenseBonus, 0);

        // freeciv code calls this fortification_bonus
        const defensiveBonus = tileExtras
            .filter(
                (extra) =>
                    extra.nativeUnitClasses.includes(unitClassName) &&
                    !extra.flags.includes('NaturalDefense') &&
                    extra.defenseBonus > 0
            )
            .reduce((bonus, extra) => bonus + extra.defenseBonus, 0);

        return Math.floor(((naturalDefensiveBonus + 100) * (defensiveBonus + 100)) / 100) - 100;
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

    private isLandBombardment(
        attackerClassName: string,
        defenderTerrain: Terrain,
        defenderExtras: TerrainExtra[],
        defenderIsInCity: boolean
    ): boolean {
        /*
        simplified, doesn't check for things like "is this native tile surrounded by non-native tiles" and things like
        that

        technically this also recognizes things like "Cannon vs Caravel on Ocean" as "land bombardment", but original
        code also behaves like this; I guess it's just "is this unit attacking onto non-native terrain?"
         */

        if (defenderTerrain.nativeUnitClasses.includes(attackerClassName)) {
            return false;
        }

        if (
            defenderExtras.some(
                (extra) => extra.flags.includes('NativeTile') && extra.nativeUnitClasses.includes(attackerClassName)
            )
        ) {
            return false;
        }

        if (defenderIsInCity) {
            return false;
        }

        return true;
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
