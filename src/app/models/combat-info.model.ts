import { VeteranLevel } from 'src/app/models/ruleset.model';

export interface WorldState {
    attacker: AttackerInfo;
    defender: DefenderInfo;
}

export interface AttackerInfo {
    unitId: string;
    veteranLevel: VeteranLevel;
    hp: number;
    moves: number;
}

export interface DefenderInfo {
    unitId: string;
    veteranLevel: VeteranLevel;
    hp: number;
    terrainId: string;
    isInCity: boolean;
    citySize: number;
    isFortified: boolean;
    extras: string[];
    buildings: string[];
    wonders: string[];
}

export interface CombatResults {
    winChance: number;
    breakdown: CombatResultsBreakdown;
}

export interface CombatResultsBreakdown {
    attackPower: number;
    defensePower: number;
    defenseBonusEffect: number;
    fortifyBonusEffect: number;
}

export interface CombatRoundResult {
    attackerHp: number;
    defenderHp: number;
    attackerVeteranUpgrade: boolean;
    defenderVeteranUpgrade: boolean;
}

export interface CombatResultStatistics {
    attacker: UnitCombatResultStatistics;
    defender: UnitCombatResultStatistics;
}

export interface UnitCombatResultStatistics {
    winChance: number;
    averageLostHp: number;
    lostHpStdError: number;
}
