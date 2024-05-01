export interface GameSettings {
    topology: Topology[];
    shieldbox: number;
    aifill: number;
    mapsize: MapSizeSpecifier;
    xsize: number;
    ysize: number;
    size: number;
    tilesperplayer: number;
    landmass: number;
}

export type Topology = 'WRAPX' | 'WRAPY' | 'ISO' | 'HEX';

export type MapSizeSpecifier = 'FULLSIZE' | 'PLAYER' | 'XYSIZE';

export function settingsStringToTopology(input: string): Topology[] {
    const splitInput = input.split('|');
    const topologies: Topology[] = [];
    for (const topology of splitInput) {
        if (topology === 'WRAPX' || topology === 'WRAPY' || topology === 'ISO' || topology === 'HEX') {
            topologies.push(topology);
        } else {
            throw new Error(`Invalid topology: ${topology}`);
        }
    }
    return topologies;
}

export function settingsStringToMapSize(input: string): MapSizeSpecifier {
    if (input === 'FULLSIZE' || input === 'PLAYER' || input === 'XYSIZE') {
        return input;
    } else {
        throw new Error(`Invalid map size: ${input}`);
    }
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
    topology: ['WRAPX', 'ISO'],
    shieldbox: 100,
    aifill: 5,
    mapsize: 'FULLSIZE',
    xsize: 64,
    ysize: 64,
    size: 4,
    tilesperplayer: 100,
    landmass: 30
};
