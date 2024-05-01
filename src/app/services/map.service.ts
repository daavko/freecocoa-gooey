import { Injectable } from '@angular/core';
import { Coordinates, MapInfo, MapRatio, MapSize } from 'src/app/models/world-info.model';
import { integerDivision } from 'src/app/utils/number-utils';
import { GameSettings } from 'src/app/models/game-settings.model';

@Injectable({ providedIn: 'root' })
export class MapService {
    public mapDistance(coord0: Coordinates, coord1: Coordinates, mapSize: MapSize, mapInfo: MapInfo): number {
        const distanceVector = this.mapDistanceVector(coord0, coord1, mapSize, mapInfo);
        return this.mapVectorToDistance(distanceVector, mapInfo);
    }

    private mapVectorToDistance(coord: Coordinates, map: MapInfo): number {
        const { x: dx, y: dy } = coord;
        if (map.hex) {
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (map.isometric) {
                if ((dx < 0 && dy > 0) || (dx > 0 && dy < 0)) {
                    return absDx + absDy;
                } else {
                    return Math.max(absDx, absDy);
                }
            } else {
                if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) {
                    return absDx + absDy;
                } else {
                    return Math.max(absDx, absDy);
                }
            }
        } else {
            return Math.abs(dx) + Math.abs(dy);
        }
    }

    private mapDistanceVector(
        coord0: Coordinates,
        coord1: Coordinates,
        mapSize: MapSize,
        mapInfo: MapInfo
    ): Coordinates {
        const { xSize, ySize } = mapSize;
        if (mapInfo.wrapX || mapInfo.wrapY) {
            const { x: natX0, y: natY0 } = this.mapToNativePosition(coord0, mapSize, mapInfo);
            const { x: natX1, y: natY1 } = this.mapToNativePosition(coord1, mapSize, mapInfo);

            let dx = natX1 - natX0;
            let dy = natY1 - natY0;
            if (mapInfo.wrapX) {
                dx = this.wrap(dx + integerDivision(xSize, 2), xSize) - integerDivision(xSize, 2);
            }
            if (mapInfo.wrapY) {
                dy = this.wrap(dy + integerDivision(ySize, 2), ySize) - integerDivision(ySize, 2);
            }

            const modX1 = natX0 + dx;
            const modY1 = natY0 + dy;
            const modMapCoord0 = this.nativeToMapPosition({ x: natX0, y: natY0 }, mapSize, mapInfo);
            const modMapCoord1 = this.nativeToMapPosition({ x: modX1, y: modY1 }, mapSize, mapInfo);

            return { x: modMapCoord1.x - modMapCoord0.x, y: modMapCoord1.y - modMapCoord0.y };
        } else {
            return { x: coord1.x - coord0.x, y: coord1.y - coord0.y };
        }
    }

    private mapToNativePosition(coord: Coordinates, mapSize: MapSize, map: MapInfo): Coordinates {
        if (map.isometric) {
            const { x: mapX, y: mapY } = coord;
            const natY = mapX + mapY - mapSize.xSize;
            const natX = integerDivision(2 * mapX - natY - (natY & 1), 2);
            return { x: natX, y: natY };
        } else {
            return coord;
        }
    }

    private nativeToMapPosition(coord: Coordinates, mapSize: MapSize, mapInfo: MapInfo): Coordinates {
        if (mapInfo.isometric) {
            const { x: natX, y: natY } = coord;
            const mapX = integerDivision(natY + (natY & 1), 2) + natX;
            const mapY = natY - mapX + mapSize.xSize;
            return { x: mapX, y: mapY };
        } else {
            return coord;
        }
    }

    private wrap(value: number, range: number): number {
        if (value < 0) {
            if (value % range !== 0) {
                return (value % range) + range;
            } else {
                return 0;
            }
        } else {
            if (value >= range) {
                return value % range;
            } else {
                return value;
            }
        }
    }

    public resolveTopologySize(game: GameSettings, map: MapInfo): MapSize {
        switch (game.mapsize) {
            case 'FULLSIZE': {
                const ratio = this.getMapRatio(map);
                return this.getMapSizes(game.size, ratio, map);
            }
            case 'PLAYER': {
                const mapSize = (game.aifill * game.tilesperplayer * 100) / game.landmass;
                const ratio = this.getMapRatio(map);
                return this.getMapSizes(mapSize, ratio, map);
            }
            case 'XYSIZE':
                return { xSize: game.xsize, ySize: game.ysize };
        }
    }

    private getMapRatio(map: MapInfo): MapRatio {
        if (map.wrapX) {
            if (map.wrapY) {
                return { xRatio: 1, yRatio: 1 };
            } else {
                return { xRatio: 3, yRatio: 2 };
            }
        } else {
            if (map.wrapY) {
                return { xRatio: 2, yRatio: 3 };
            } else {
                return { xRatio: 1, yRatio: 1 };
            }
        }
    }

    private getMapSizes(size: number, ratio: MapRatio, map: MapInfo): MapSize {
        const even = 2;
        const iso = map.isometric ? 2 : 1;

        const iSize = Math.floor(Math.sqrt(size / (ratio.xRatio * ratio.yRatio * iso * even * even)) + 0.49);

        const xSize = Math.floor(ratio.xRatio * iSize * even);
        const ySize = Math.floor(ratio.yRatio * iSize * even * iso);

        return { xSize, ySize };
    }
}
