import { Injectable } from '@angular/core';
import { Building, Ruleset } from 'src/app/models/ruleset.model';
import { INCITE_IMPOSSIBLE_COST, InciteCostResult, IncitedCityInfo } from 'src/app/models/incite-info.model';
import { EffectResolverService } from 'src/app/services/effect-resolver.service';
import { MapService } from 'src/app/services/map.service';
import { UnitCalculationService } from 'src/app/services/unit-calculation.service';
import { GameSettings } from 'src/app/models/game-settings.model';
import { integerDivision } from 'src/app/utils/number-utils';

@Injectable({
    providedIn: 'root'
})
export class CityCalculationService {
    constructor(
        private effectsResolver: EffectResolverService,
        private mapService: MapService,
        private unitService: UnitCalculationService
    ) {}

    public calculateInciteCost(
        ruleset: Ruleset,
        cityInfo: IncitedCityInfo,
        gameSettings: GameSettings
    ): InciteCostResult {
        let cost = cityInfo.ownerGold + ruleset.inciteCosts.baseInciteCost;

        for (const unit of cityInfo.units) {
            cost += this.unitService.unitBuildCost(unit, gameSettings) * ruleset.inciteCosts.unitFactor;
        }

        for (const building of cityInfo.buildings) {
            cost += this.improvementBuildCost(building, gameSettings) * ruleset.inciteCosts.improvementFactor;
        }

        if (!this.isCityUnhappy(cityInfo)) {
            cost *= 2;
        }
        if (this.isCityHappy(ruleset, cityInfo)) {
            cost *= 2;
        }

        if (!ruleset.citizenSettings.nationality) {
            if (cityInfo.currentOwnerIsOriginalOwner === undefined || cityInfo.inciterIsOriginalOwner === undefined) {
                throw new TypeError('original owner must be specified when citizen nationality is disabled');
            }

            if (!cityInfo.currentOwnerIsOriginalOwner) {
                if (cityInfo.inciterIsOriginalOwner) {
                    cost /= 2;
                } else {
                    cost = (cost * 2) / 3;
                }
            }
        }

        let dist = 32;
        const distToCapital = this.mapService.mapDistance(
            cityInfo.cityCoordinates,
            cityInfo.capitalCoordinates,
            cityInfo.mapSize,
            cityInfo.mapInfo
        );
        if (distToCapital < dist) {
            dist = distToCapital;
        }

        const size = Math.max(
            1,
            cityInfo.citySize +
                cityInfo.citizenBreakdown.happy -
                cityInfo.citizenBreakdown.unhappy -
                cityInfo.citizenBreakdown.angry * 3
        );
        cost *= size;
        cost *= ruleset.inciteCosts.totalFactor;
        cost = cost / (dist + 3);

        if (ruleset.citizenSettings.nationality) {
            if (cityInfo.nationalityBreakdown === undefined) {
                throw new TypeError('nationality breakdown must be specified when citizen nationality is enabled');
            }

            const costPerCitizen = Math.floor(cost / cityInfo.citySize);
            const {
                inciter: inciterCitizens,
                currentOwner: currentOwnerCitizens,
                thirdParties: thirdPartiesCitizens
            } = cityInfo.nationalityBreakdown;
            cost = costPerCitizen * (currentOwnerCitizens + 0.7 * thirdPartiesCitizens + 0.5 * inciterCitizens);
        }

        const inciteCostPct = this.effectsResolver.resolveInciteCostPctEffect(
            ruleset,
            cityInfo.units.length,
            cityInfo.buildings
        );
        cost += (cost * inciteCostPct) / 100;
        cost /= 100;

        return { cost, impossible: cost >= INCITE_IMPOSSIBLE_COST };
    }

    private improvementBuildCost(building: Building, gameSettings: GameSettings): number {
        // TODO: this doesn't take into account the EFT_IMPR_BUILD_COST_PCT effect, but it's not used in LTT/X so I
        //  don't really care about it for now
        return Math.max(integerDivision(building.buildCost * gameSettings.shieldbox, 100), 1);
    }

    private isCityHappy(ruleset: Ruleset, cityInfo: IncitedCityInfo): boolean {
        const { happy, unhappy, angry } = cityInfo.citizenBreakdown;
        const { citySize } = cityInfo;
        return (
            citySize >= ruleset.cityParameters.celebrateSizeLimit &&
            happy >= Math.floor((citySize + 1) / 2) &&
            unhappy === 0 &&
            angry === 0
        );
    }

    private isCityUnhappy(cityInfo: IncitedCityInfo): boolean {
        const { happy, unhappy, angry } = cityInfo.citizenBreakdown;
        return happy < unhappy + 2 * angry;
    }
}
