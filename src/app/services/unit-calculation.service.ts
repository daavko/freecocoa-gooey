import { Injectable } from '@angular/core';
import { BribeUnitInfo } from 'src/app/models/bribe-info.model';
import { Ruleset } from 'src/app/models/ruleset.model';
import { GameSettings } from 'src/app/models/game-settings.model';
import { integerDivision } from 'src/app/utils/number-utils';
import { MapService } from 'src/app/services/map.service';

const MAX_BRIBE_DISTANCE = 32;

@Injectable({ providedIn: 'root' })
export class UnitCalculationService {
    constructor(private readonly mapService: MapService) {}

    public calculateBribeCost(info: BribeUnitInfo, ruleset: Ruleset, gameSettings: GameSettings): number {
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

        const shieldBuildCost = Math.max(integerDivision(unitType.buildCost * gameSettings.shieldbox, 100), 1);
        cost *= integerDivision(shieldBuildCost, 10);

        // todo: EFT_UNIT_BRIBE_COST_PCT

        cost = integerDivision(cost * veteranLevel.powerFactor, 100);
        if (unitType.moves > 0) {
            cost += integerDivision(cost * veteranLevel.moveBonus, unitType.moves * ruleset.moveFrags);
        } else {
            cost += integerDivision(cost * veteranLevel.moveBonus, ruleset.moveFrags);
        }

        return Math.floor((cost / 2) * (1 + info.unitHp / unitType.hitpoints));
    }
}
