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
    NONE = 'none',
    LOCAL = 'local',
    CARDINALLY_ADJACENT = 'cadjacent',
    ADJACENT = 'adjacent',
    CITY = 'city',
    CONTINENT = 'continent',
    PLAYER = 'player',
    ALLIED = 'allied',
    WORLD = 'world'
}

export const REQUIREMENT_RANGES = [
    RequirementRange.NONE,
    RequirementRange.LOCAL,
    RequirementRange.CARDINALLY_ADJACENT,
    RequirementRange.ADJACENT,
    RequirementRange.CITY,
    RequirementRange.CONTINENT,
    RequirementRange.PLAYER,
    RequirementRange.ALLIED,
    RequirementRange.WORLD
] as const;

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
    bonuses: UnitTypeBonus[];
    veteranLevels: VeteranLevel[];
}

export interface UnitTypeBonus {
    flag: string;
    type: string;
    value: number;
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
