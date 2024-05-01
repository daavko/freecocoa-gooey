import { UnitType, VeteranLevel } from 'src/app/models/ruleset.model';
import { Coordinates, MapInfo, MapSize } from 'src/app/models/world-info.model';

export interface BribeUnitInfo {
    unitType: UnitType;
    unitHp: number;
    veteranLevel: VeteranLevel;
    unitCoords: Coordinates;
    gold: number;
    capitalCoords: Coordinates;
    mapSize: MapSize;
    mapInfo: MapInfo;
}
