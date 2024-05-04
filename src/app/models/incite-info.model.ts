import { Building, UnitType } from 'src/app/models/ruleset.model';
import { Coordinates, MapInfo, MapSize } from 'src/app/models/world-info.model';

// 1000 * 1000 * 1000
export const INCITE_IMPOSSIBLE_COST = 1_000_000_000;

export interface IncitedCityInfo {
    ownerGold: number;
    units: UnitType[];
    buildings: Building[];
    citySize: number;
    citizenBreakdown: {
        happy: number;
        content: number;
        unhappy: number;
        angry: number;
    };
    // only used when citizen nationality is disabled
    currentOwnerIsOriginalOwner?: boolean;
    // only used when citizen nationality is disabled
    inciterIsOriginalOwner?: boolean;
    cityCoordinates: Coordinates;
    capitalCoordinates: Coordinates;
    mapSize: MapSize;
    mapInfo: MapInfo;
    // only used when citizen nationality is enabled
    nationalityBreakdown?: {
        inciter: number;
        currentOwner: number;
        thirdParties: number;
    };
}

export interface InciteCostResult {
    cost: number;
    impossible: boolean;
}
