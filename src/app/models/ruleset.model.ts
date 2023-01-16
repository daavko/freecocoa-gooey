export interface Ruleset {
    effects: Effect[];
    unitTypes: UnitType[];
    unitClasses: UnitClass[];
    defaultVeteranLevels: VeteranLevel[];
    terrainTypes: Terrain[];
    moveFrags: number;
}

export interface Effect {
    id: string;
    type: string;
    value: number;
    requirements: Requirement[];
}

export enum RequirementRange {
    LOCAL = 'Local',
    CITY = 'City',
    PLAYER = 'Player'
}

export interface Requirement {
    type: string;
    name: string;
    range: RequirementRange;
    present: boolean;
}

export interface UnitType {
    id: string;
    name: string;
    class: string;
    attack: number;
    defense: number;
    firepower: number;
    hitpoints: number;
    moves: number;
    flags: string[];
    // TODO: unit-v-unit bonuses (like Destroyer vs Submarine or such)
    veteranLevels: VeteranLevel[];
}

export interface UnitClass {
    id: string;
    name: string;
    flags: string[];
}

export interface VeteranLevel {
    name: string;
    powerFactor: number;
}

export interface Terrain {
    id: string;
    name: string;
    defenseBonus: number;
}
