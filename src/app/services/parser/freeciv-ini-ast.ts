export interface IniFile {
    sections: IniSection[];
    // only for posterity, we don't actually support file inclusions
    fileInclusions: IniFileInclusion[];
}

export interface IniSection {
    name: string;
    entries: IniEntry[];
}

export interface IniEntry {
    name: string;
    value: IniValue;
}

export type IniRawValue = string | boolean | number;

export type IniValueList = IniRawValue[];

export interface IniTable {
    heading: string[];
    rows: IniValueList[];
}

export type IniValue = IniRawValue | IniValueList | IniTable;

export interface IniFileInclusion {
    file: string;
}
