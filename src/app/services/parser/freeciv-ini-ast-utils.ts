import {
    IniEntry,
    IniFile,
    IniRawValue,
    IniSection,
    IniTable,
    IniValueList
} from 'src/app/services/parser/freeciv-ini-ast';

export function entryValueAsString(entry: IniEntry): string {
    if (typeof entry.value === 'string') {
        return entry.value;
    } else {
        throw new TypeError(
            `Expected value for entry "${entry.name}" to be a string, found ${typeof entry.value} instead`
        );
    }
}

export function entryValueAsNumber(entry: IniEntry): number {
    if (typeof entry.value === 'number') {
        return entry.value;
    } else {
        throw new TypeError(
            `Expected value for entry "${entry.name}" to be a number, found ${typeof entry.value} instead`
        );
    }
}

export function entryValueAsBoolean(entry: IniEntry): boolean {
    if (typeof entry.value === 'boolean') {
        return entry.value;
    } else {
        throw new TypeError(
            `Expected value for entry "${entry.name}" to be a boolean, found ${typeof entry.value} instead`
        );
    }
}

export function entryValueAsValueList(entry: IniEntry): IniValueList {
    if (Array.isArray(entry.value)) {
        return entry.value;
    } else if (typeof entry.value === 'string' || typeof entry.value === 'number' || typeof entry.value === 'boolean') {
        return [entry.value];
    } else {
        throw new TypeError(
            `Expected value for entry "${entry.name}" to be an array, found ${typeof entry.value} instead`
        );
    }
}

export function entryValueAsTable(entry: IniEntry): IniTable {
    if (typeof entry.value === 'object' && !Array.isArray(entry.value)) {
        return entry.value;
    } else {
        throw new TypeError(
            `Expected value for entry "${entry.name}" to be a table, found ${typeof entry.value} instead`
        );
    }
}

export function rawValueAsString(rawValue: IniRawValue): string {
    if (typeof rawValue === 'string') {
        return rawValue;
    } else {
        throw new TypeError(`Expected value to be a string, found ${typeof rawValue} instead`);
    }
}

export function rawValueAsNumber(rawValue: IniRawValue): number {
    if (typeof rawValue === 'number') {
        return rawValue;
    } else {
        throw new TypeError(`Expected value to be a number, found ${typeof rawValue} instead`);
    }
}

export function rawValueAsBoolean(rawValue: IniRawValue): boolean {
    if (typeof rawValue === 'boolean') {
        return rawValue;
    } else {
        throw new TypeError(`Expected value to be a boolean, found ${typeof rawValue} instead`);
    }
}

export function findPossibleSection(file: IniFile, sectionName: string): IniSection | undefined {
    return file.sections.find((section) => section.name === sectionName);
}

export function findGuaranteedSection(file: IniFile, sectionName: string): IniSection {
    const section = findPossibleSection(file, sectionName);

    if (section === undefined) {
        throw new Error(`Section "${sectionName}" missing`);
    }

    return section;
}

export function findPossibleEntry(section: IniSection, entryName: string): IniEntry | undefined {
    return section.entries.find((entry) => entry.name === entryName);
}

export function findGuaranteedEntry(section: IniSection, entryName: string): IniEntry {
    const entry = findPossibleEntry(section, entryName);

    if (entry === undefined) {
        throw new Error(`Entry "${entryName}" missing in section "${section.name}"`);
    }

    return entry;
}
