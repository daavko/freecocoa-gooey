import { Terrain, UnitType, VeteranLevel } from 'src/app/models/ruleset.model';

export interface WorldState {
    attacker: AttackerInfo;
    defender: DefenderInfo;
}

export interface AttackerInfo {
    unitType: UnitType;
    veteranLevel: VeteranLevel;
    hp: number;
    moves: number;
}

export interface DefenderInfo {
    unitType: UnitType;
    veteranLevel: VeteranLevel;
    hp: number;
    terrain: Terrain;
    isInCity: boolean;
    citySize: number;
    isFortified: boolean;
    extras: string[];
    buildings: string[];
    wonders: string[];
}

export interface CombatRoundResult {
    attackerHp: number;
    defenderHp: number;
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

export interface CombatResult {
    winChance: number;
    hpChances: [number, number][];
    averageLostHp: number;
    lostHpStdError: number;
}
