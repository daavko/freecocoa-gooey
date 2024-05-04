import { Injectable } from '@angular/core';
import { BribeCostResult, BribeUnitInfo } from 'src/app/models/bribe-info.model';
import { Ruleset, UnitType } from 'src/app/models/ruleset.model';
import { GameSettings } from 'src/app/models/game-settings.model';
import { integerDivision } from 'src/app/utils/number-utils';
import { MapService } from 'src/app/services/map.service';

const MAX_BRIBE_DISTANCE = 32;

@Injectable({ providedIn: 'root' })
export class UnitCalculationService {
    constructor(private readonly mapService: MapService) {}

    public calculateBribeCost(info: BribeUnitInfo, ruleset: Ruleset, gameSettings: GameSettings): BribeCostResult {
        const { veteranLevel, unitType } = info;

        let cost = info.gold + ruleset.inciteCosts.baseBribeCost;

        const tileToCapitalDistance = this.mapService.mapDistance(
            info.unitCoords,
            info.capitalCoords,
            info.mapSize,
            info.mapInfo
        );
        const distance = Math.min(tileToCapitalDistance, MAX_BRIBE_DISTANCE);

        cost = integerDivision(cost, distance + 2);

        const shieldBuildCost = this.unitBuildCost(unitType, gameSettings);
        cost *= integerDivision(shieldBuildCost, 10);

        // todo: EFT_UNIT_BRIBE_COST_PCT

        cost = integerDivision(cost * veteranLevel.powerFactor, 100);
        if (unitType.moves > 0) {
            cost += integerDivision(cost * veteranLevel.moveBonus, unitType.moves * ruleset.moveFrags);
        } else {
            cost += integerDivision(cost * veteranLevel.moveBonus, ruleset.moveFrags);
        }

        return { cost: Math.floor((cost / 2) * (1 + info.unitHp / unitType.hitpoints)) };
    }

    public unitBuildCost(unitType: UnitType, gameSettings: GameSettings): number {
        // todo: this doesn't take into account the EFT_UNIT_BUILD_COST_PCT effect, but it's not used in LTT/X so I
        //  don't really care about it for now
        return Math.max(integerDivision(unitType.buildCost * gameSettings.shieldbox, 100), 1);
    }
}
