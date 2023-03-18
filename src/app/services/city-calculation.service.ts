import { Injectable } from '@angular/core';
import { Ruleset } from 'src/app/models/ruleset.model';
import { INCITE_IMPOSSIBLE_COST, IncitedCityInfo } from 'src/app/models/incite-info.model';
import { mapDistance } from 'src/app/utils/map-utils';
import { EffectResolverService } from 'src/app/services/effect-resolver.service';

@Injectable({
    providedIn: 'root'
})
export class CityCalculationService {
    constructor(private effectsResolver: EffectResolverService) {}

    public calculateInciteCost(ruleset: Ruleset, cityInfo: IncitedCityInfo): number {
        let cost = cityInfo.ownerGold + ruleset.inciteCosts.baseInciteCost;

        for (const unit of cityInfo.units) {
            // TODO: this doesn't take into account the EFT_UNIT_BUILD_COST_PCT effect, but it's not used in LTT/X so I
            //  don't really care about it for now
            cost += unit.buildCost * ruleset.inciteCosts.unitFactor;
        }

        for (const building of cityInfo.buildings) {
            // TODO: this doesn't take into account the EFT_IMPR_BUILD_COST_PCT effect, but it's not used in LTT/X so I
            //  don't really care about it for now
            cost += building.buildCost * ruleset.inciteCosts.improvementFactor;
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
        for (const coordinates of cityInfo.capitalCoordinates) {
            const distToCapital = mapDistance(cityInfo.mapInfo, cityInfo.cityCoordinates, coordinates);
            if (distToCapital < dist) {
                dist = distToCapital;
            }
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
        cost *= cost / (dist + 3);

        if (ruleset.citizenSettings.nationality) {
            if (cityInfo.nationalityBreakdown === undefined) {
                throw new TypeError('nationality breakdown must be specified when citizen nationality is enabled');
            }

            const costPerCitizen = Math.floor(cost / cityInfo.citySize);
            const {
                inciter: inciterCitizens,
                cityOwner: cityOwnerCitizens,
                thirdParty: thirdPartyCitizens
            } = cityInfo.nationalityBreakdown;
            cost = costPerCitizen * (cityOwnerCitizens + 0.7 * thirdPartyCitizens + 0.5 * inciterCitizens);
        }

        const inciteCostPct = this.effectsResolver.resolveInciteCostPctEffect(
            ruleset,
            cityInfo.units.length,
            cityInfo.buildings
        );
        cost += (cost * inciteCostPct) / 100;
        cost /= 100;

        return Math.floor(Math.min(cost, INCITE_IMPOSSIBLE_COST));
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
