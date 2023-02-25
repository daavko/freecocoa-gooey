import { Ruleset, Terrain, UnitClass, UnitType } from 'src/app/models/ruleset.model';

export function getUnitTypeById(ruleset: Ruleset, id: string): UnitType {
    const unitType = ruleset.unitTypes.find((item) => item.id === id);
    if (unitType === undefined) {
        throw new Error(`Unit type "${id}" doesn't exist`);
    }
    return unitType;
}

export function getUnitClassById(ruleset: Ruleset, id: string): UnitClass {
    const unitClass = ruleset.unitClasses.find((item) => item.id === id);
    if (unitClass === undefined) {
        throw new Error(`Unit class "${id}" doesn't exist`);
    }
    return unitClass;
}

export function getUnitClassByName(ruleset: Ruleset, name: string): UnitClass {
    const unitClass = ruleset.unitClasses.find((item) => item.name === name);
    if (unitClass === undefined) {
        throw new Error(`Unit class with name "${name}" doesn't exist`);
    }
    return unitClass;
}

export function getTerrainById(ruleset: Ruleset, id: string): Terrain {
    const terrain = ruleset.terrainTypes.find((item) => item.id === id);
    if (terrain === undefined) {
        throw new Error(`Terrain "${id}" doesn't exist`);
    }
    return terrain;
}
