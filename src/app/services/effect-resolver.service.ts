import { Injectable } from '@angular/core';
import { RequirementRange, Ruleset, UnitType } from 'src/app/models/ruleset.model';
import { WorldState } from 'src/app/models/combat-info.model';
import { getUnitClassByName } from 'src/app/utils/ruleset-utils';

@Injectable({
    providedIn: 'root'
})
export class EffectResolverService {
    public resolveDefenseEffects(attacker: UnitType, ruleset: Ruleset, world: WorldState): number {
        const effects = ruleset.effects.filter((effect) => effect.type === 'Defend_Bonus');
        const defenderInfo = world.defender;

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
                        console.warn(`Unknown effect requirement type found: "${req.type}"`, req);
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

    public resolveFortifyDefendEffects(defender: UnitType, ruleset: Ruleset, world: WorldState): number {
        const effects = ruleset.effects.filter((effect) => effect.type === 'Fortify_Defense_Bonus');
        const defenderClass = getUnitClassByName(ruleset, defender.class);
        const defenderInfo = world.defender;

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
                        console.warn(`Unknown effect requirement type found: "${req.type}"`, req);
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
