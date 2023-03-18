import { Coordinates, MapInfo } from 'src/app/models/world-info.model';

// Freeciv map utils
// No math is explained, it just is what it is

export function mapDistance(mapInfo: MapInfo, tile0: Coordinates, tile1: Coordinates): number {
    const [dx, dy] = mapDistanceVector(mapInfo, tile0, tile1);
    return mapVectorToDistance(mapInfo, dx, dy);
}

function mapDistanceVector(mapInfo: MapInfo, tile0: Coordinates, tile1: Coordinates): [number, number] {
    // actually implements base_map_distance_vector() since Freeciv just gets tile coords from tile index in
    // map_distance_vector() and then the real computation is done in base_map_distance_vector()
    if (mapInfo.wrapX || mapInfo.wrapY) {
        const nativeTile0 = mapToNativePos(mapInfo, tile0);
        const nativeTile1 = mapToNativePos(mapInfo, tile1);

        let dx = nativeTile1.x - nativeTile0.x;
        let dy = nativeTile1.y - nativeTile0.y;
        if (mapInfo.wrapX) {
            const halfXSize = Math.floor(mapInfo.xSize) / 2;
            dx = fcWrap(dx + halfXSize, mapInfo.xSize) - halfXSize;
        }
        if (mapInfo.wrapY) {
            const halfYSize = Math.floor(mapInfo.ySize) / 2;
            dy = fcWrap(dy + halfYSize, mapInfo.ySize) - halfYSize;
        }

        const nativeDeltaVector: Coordinates = { x: nativeTile0.x + dx, y: nativeTile1.x + dy };
        const mapDeltaVector = nativeToMapPos(mapInfo, nativeDeltaVector);
        return [mapDeltaVector.x - tile0.x, mapDeltaVector.y - tile0.y];
    } else {
        return [tile1.x - tile0.x, tile1.y - tile0.y];
    }
}

function mapToNativePos(mapInfo: MapInfo, coord: Coordinates): Coordinates {
    if (mapInfo.isometric) {
        const natY = coord.x + coord.y - mapInfo.xSize;
        return {
            x: Math.floor((2 * coord.x - natY - (natY & 1)) / 2),
            y: natY
        };
    } else {
        return {
            ...coord
        };
    }
}

function nativeToMapPos(mapInfo: MapInfo, coord: Coordinates): Coordinates {
    if (mapInfo.isometric) {
        const mapX = Math.floor((coord.y + (coord.y & 1)) / 2) + coord.x;
        return {
            x: mapX,
            y: coord.y - mapX + mapInfo.xSize
        };
    } else {
        return {
            ...coord
        };
    }
}

function fcWrap(value: number, range: number): number {
    if (value < 0) {
        if (value % range != 0) {
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

function mapVectorToDistance(mapInfo: MapInfo, dx: number, dy: number): number {
    if (mapInfo.hex) {
        return mapVectorToRealDistance(mapInfo, dx, dy);
    } else {
        return Math.abs(dx) + Math.abs(dy);
    }
}

function mapVectorToRealDistance(mapInfo: MapInfo, dx: number, dy: number): number {
    const absdx = Math.abs(dx);
    const absdy = Math.abs(dy);

    if (mapInfo.hex) {
        if (mapInfo.isometric) {
            if ((dx < 0 && dy > 0) || (dx > 0 && dy < 0)) {
                return absdx + absdy;
            } else {
                return Math.max(absdx, absdy);
            }
        } else {
            if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) {
                return absdx + absdy;
            } else {
                return Math.max(absdx, absdy);
            }
        }
    } else {
        return Math.max(absdx, absdy);
    }
}
