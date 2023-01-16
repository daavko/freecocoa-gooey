export interface AttackerInfo {
    unitId: string;
    veteranLevel: number;
    hp: number;
    moves: number;
}

export interface DefenderInfo {
    unitId: string;
    veteranLevel: number;
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
}
