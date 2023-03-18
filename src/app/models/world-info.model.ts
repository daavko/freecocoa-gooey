export interface Coordinates {
    x: number;
    y: number;
}

export interface MapInfo {
    xSize: number;
    ySize: number;
    wrapX: number;
    wrapY: number;
    isometric: boolean;
    hex: boolean;
}
