export interface Coordinates {
    x: number;
    y: number;
}

export interface MapSize {
    xSize: number;
    ySize: number;
}

export interface MapRatio {
    xRatio: number;
    yRatio: number;
}

export interface MapInfo {
    wrapX: boolean;
    wrapY: boolean;
    isometric: boolean;
    hex: boolean;
}
