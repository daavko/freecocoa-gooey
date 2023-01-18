import { Injectable } from '@angular/core';
import {
    Effect,
    Requirement,
    RequirementRange,
    Terrain,
    UnitClass,
    UnitType,
    VeteranLevel
} from 'src/app/models/ruleset.model';

@Injectable({
    providedIn: 'root'
})
export class RulesetParserService {
    public parseEffects(input: string): Effect[] {
        const lines = this.makeLines(input);
        if (!this.fileCompatible(lines)) {
            throw new Error('Invalid options in effects file');
        }

        const headerRx = /^\s*\[effect_(?<id>\w+)]/;

        const effects: Effect[] = [];

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(headerRx);
            if (match?.groups?.['id'] !== undefined) {
                const parsedId = match.groups['id'];
                const [effect, endingIndex] = this.parseSingleEffect(lines, i + 1, parsedId);
                effects.push(effect);
                i = endingIndex;
            }
        }
        return effects;
    }

    public parseTerrain(input: string): [Terrain[], number] {
        const lines = this.makeLines(input);
        if (!this.fileCompatible(lines)) {
            throw new Error('Invalid options in terrain file');
        }

        const headerRx = /^\s*\[terrain_(?<id>\w+)]/;
        const moveFragsRx = /^\s*move_fragments\s*=\s*(?<moveFrags>[0-9]+)/;

        const terrains: Terrain[] = [];
        let moveFrags = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line === '[parameters]') {
                for (let j = i; j < lines.length; j++) {
                    const match = lines[j].match(moveFragsRx);
                    if (match?.groups?.['moveFrags'] !== undefined) {
                        const parsedValue = Number.parseInt(match.groups['moveFrags']);
                        if (Number.isNaN(parsedValue)) {
                            throw new Error(
                                `Found NaN when parsing "${match.groups['moveFrags']}" as a movement frags value`
                            );
                        }
                        moveFrags = parsedValue;
                        i = j + 1;
                        break;
                    }
                }
            }

            const match = line.match(headerRx);
            if (match?.groups?.['id'] !== undefined) {
                const parsedId = match.groups['id'];
                const [terrain, endingIndex] = this.parseSingleTerrain(lines, i + 1, parsedId);
                terrains.push(terrain);
                i = endingIndex;
            }
        }
        return [terrains, moveFrags];
    }

    public parseUnits(input: string): [UnitType[], UnitClass[], VeteranLevel[]] {
        const lines = this.makeLines(input);
        if (!this.fileCompatible(lines)) {
            throw new Error('Invalid options in units file');
        }

        const unitHeaderRx = /^\s*\[unit_(?<id>\w+)]/;
        const unitClassHeaderRx = /^\s*\[unitclass_(?<id>\w+)]/;
        const veteranNamesRx = /^\s*veteran_names\s*=\s*(?<names>_\("[^,"]+"\)(?:\s*,\s*_\("[^,"]+"\))*)/;
        const veteranPowerFactorRx = /^\s*veteran_power_fact\s*=\s*(?<powerFactors>[0-9]+(?:\s*,\s*[0-9]+)*)/;

        const unitTypes: UnitType[] = [];
        const unitClasses: UnitClass[] = [];
        const veteranLevels: VeteranLevel[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line === '[veteran_system]') {
                let names: string[] = [];
                let powerFactors: number[] = [];

                for (let j = 0; j < lines.length; j++) {
                    let match = lines[j].match(veteranNamesRx);
                    if (match?.groups?.['names'] !== undefined) {
                        names = match.groups['names'].split(',').map((value) => value.trim().slice(3, -2));
                    }

                    match = lines[j].match(veteranPowerFactorRx);
                    if (match?.groups?.['powerFactors']) {
                        powerFactors = match.groups['powerFactors'].split(',').map((value) => {
                            value = value.trim();
                            const parsedValue = Number.parseInt(value);
                            if (Number.isNaN(parsedValue)) {
                                throw new Error(
                                    `Found NaN when parsing "${value}" as a veteran level power factor value`
                                );
                            }
                            return parsedValue;
                        });
                    }

                    if (names.length > 0 && powerFactors.length > 0) {
                        i = j + 1;
                        break;
                    }
                }

                if (names.length !== powerFactors.length) {
                    throw new Error('Found veterancy names and power factors of differing lengths');
                }
                for (let j = 0; j < names.length; j++) {
                    veteranLevels.push({ name: names[j], powerFactor: powerFactors[j] });
                }
            }

            let match = line.match(unitHeaderRx);
            if (match?.groups?.['id'] !== undefined) {
                const parsedId = match.groups['id'];
                const [unitType, endingIndex] = this.parseSingleUnitType(lines, i + 1, parsedId);
                unitTypes.push(unitType);
                i = endingIndex;
                continue;
            }

            match = line.match(unitClassHeaderRx);
            if (match?.groups?.['id'] !== undefined) {
                const parsedId = match.groups['id'];
                const [unitClass, endingIndex] = this.parseSingleUnitClass(lines, i + 1, parsedId);
                unitClasses.push(unitClass);
                i = endingIndex;
            }
        }

        return [unitTypes, unitClasses, veteranLevels];
    }

    private parseSingleEffect(lines: string[], startIndex: number, parsedId: string): [Effect, number] {
        type ParseMode = 'normal' | 'reqsFoundStart' | 'reqsFoundHeading';

        const typeRx = /^\s*type\s*=\s*"(?<type>[^"]+)"/;
        const valueRx = /^\s*value\s*=\s*(?<value>-?[0-9]+)/;
        const reqsStartRx = /^\s*reqs\s*=/;
        const reqsHeadingRx = /^\s*\{\s*"[a-z]+"(?:\s*,\s*"[a-z]+")*/;
        const reqsValueRx = /^\s*(?:"[^,"]+"|TRUE|FALSE)(?:\s*,\s*(?:"[^,"]+"|TRUE|FALSE))*/;
        const reqsEndRx = /^\s*}/;

        let i = startIndex;
        let mode: ParseMode = 'normal';
        const effect: Partial<Effect> = { id: parsedId, requirements: [] };
        let effectRequirementsHeading: string[] = [];
        outerLoop: for (; i < lines.length; i++) {
            const line = lines[i];
            switch (mode) {
                case 'normal':
                    {
                        let match = line.match(typeRx);
                        if (match?.groups?.['type'] !== undefined) {
                            effect.type = match.groups['type'];
                            continue;
                        }

                        match = line.match(valueRx);
                        if (match?.groups?.['value'] !== undefined) {
                            const parsedValue = Number.parseInt(match.groups['value']);
                            if (Number.isNaN(parsedValue)) {
                                throw new Error(`Found NaN when parsing "${match.groups['value']}" as an effect value`);
                            }
                            effect.value = parsedValue;
                            continue;
                        }

                        match = line.match(reqsStartRx);
                        if (match !== null) {
                            mode = 'reqsFoundStart';
                        }
                    }
                    break;
                case 'reqsFoundStart':
                    {
                        const match = line.match(reqsHeadingRx);
                        if (match !== null) {
                            const openingBraceIndex = match[0].indexOf('{');
                            effectRequirementsHeading = match[0]
                                .slice(openingBraceIndex + 1)
                                .trim()
                                .split(',')
                                .map((value) => value.trim().slice(1, -1));
                            mode = 'reqsFoundHeading';
                        } else {
                            throw new Error('No heading found below table start');
                        }
                    }
                    break;
                case 'reqsFoundHeading':
                    {
                        let match = line.match(reqsEndRx);
                        if (match !== null) {
                            break outerLoop;
                        }

                        match = line.match(reqsValueRx);
                        if (match !== null) {
                            const parsedRequirementEntry = match[0]
                                .trim()
                                .split(',')
                                .map((value) => {
                                    value = value.trim();
                                    if (value === 'TRUE') {
                                        return true;
                                    } else if (value === 'FALSE') {
                                        return false;
                                    } else {
                                        return value.slice(1, -1);
                                    }
                                })
                                .slice(0, effectRequirementsHeading.length);
                            // FIXME: this is here because names with commas like "Aqueduct, River" break the effects
                            //  parser
                            if (effectRequirementsHeading.length !== parsedRequirementEntry.length) {
                                continue;
                            }
                            const requirementEntry: Requirement = {
                                type: '',
                                name: '',
                                range: RequirementRange.LOCAL,
                                present: true
                            };
                            for (let j = 0; j < effectRequirementsHeading.length; j++) {
                                const requirementEntryValue = parsedRequirementEntry[j];
                                switch (effectRequirementsHeading[j]) {
                                    case 'type':
                                        if (typeof requirementEntryValue !== 'string') {
                                            throw new TypeError();
                                        }
                                        requirementEntry.type = requirementEntryValue;
                                        break;
                                    case 'name':
                                        if (typeof requirementEntryValue !== 'string') {
                                            throw new TypeError();
                                        }
                                        requirementEntry.name = requirementEntryValue;
                                        break;
                                    case 'range':
                                        if (typeof requirementEntryValue !== 'string') {
                                            throw new TypeError();
                                        }
                                        // FIXME: we don't actually check ranges here...
                                        requirementEntry.range = requirementEntryValue as RequirementRange;
                                        break;
                                    case 'present':
                                        if (typeof requirementEntryValue !== 'boolean') {
                                            throw new TypeError();
                                        }
                                        requirementEntry.present = requirementEntryValue;
                                        break;
                                    case 'quiet':
                                        // no-op
                                        break;
                                    case 'survives':
                                        // no-op
                                        break;
                                    default:
                                        console.warn(
                                            `Found unknown heading entry when parsing effect: "${effectRequirementsHeading[j]}"`
                                        );
                                }
                            }
                            effect.requirements?.push(requirementEntry);
                        }
                    }
                    break;
                default:
                    throw new Error('This should never happen - invalid mode when parsing a single effect');
            }
        }
        if (effect.type !== undefined && effect.value !== undefined && effect.requirements !== undefined) {
            return [effect as Effect, i];
        } else {
            throw new Error(`Something is missing in effect "${parsedId}"`);
        }
    }

    private parseSingleTerrain(lines: string[], startIndex: number, parsedId: string): [Terrain, number] {
        const headerRx = /^\s*\[(?<id>\w+)]/;
        const nameRx = /^\s*name\s*=\s*(?:_\()?"(?<name>[^"]+)"\)?/;
        const defenseBonusRx = /^\s*defense_bonus\s*=\s*(?<defenseBonus>-?[0-9]+)/;

        const terrain: Partial<Terrain> = { id: parsedId };
        let i = startIndex;
        for (; i < lines.length; i++) {
            const line = lines[i];

            let match = line.match(nameRx);
            if (match?.groups?.['name'] !== undefined) {
                terrain.name = match.groups['name'];
                continue;
            }

            match = line.match(defenseBonusRx);
            if (match?.groups?.['defenseBonus'] !== undefined) {
                const parsedValue = Number.parseInt(match.groups['defenseBonus']);
                if (Number.isNaN(parsedValue)) {
                    throw new Error(
                        `Found NaN when parsing "${match.groups['defenseBonus']}" as a defense bonus value`
                    );
                }
                terrain.defenseBonus = parsedValue;
                continue;
            }

            if (line.match(headerRx) !== null) {
                i--;
                break;
            }
        }

        if (terrain.name !== undefined && terrain.defenseBonus !== undefined) {
            return [terrain as Terrain, i];
        } else {
            throw new Error(`Something is missing in terrain "${parsedId}"`);
        }
    }

    private parseSingleUnitType(lines: string[], startIndex: number, parsedId: string): [UnitType, number] {
        const headerRx = /^\s*\[(?<id>\w+)]/;
        const nameRx = /^\s*name\s*=\s*(?:_\()?"(\?\w+:)?(?<name>[^"]+)"\)?/;
        const classRx = /^\s*class\s*=\s*"(?<class>[^"]+)"/;
        const numericValueRx = /^\s*(?<numericValueTitle>\w+)\s*=\s*(?<numericValue>-?[0-9]+)/;
        const flagsRx = /^\s*flags\s*=\s*(?<flags>"[^,"]+"(?:\s*,\s*"[^,"]+")*)/;
        const veteranNamesRx = /^\s*veteran_names\s*=\s*(?<names>_\("[^,"]+"\)(?:\s*,\s*_\("[^,"]+"\))*)/;
        const veteranPowerFactorRx = /^\s*veteran_power_fact\s*=\s*(?<powerFactors>[0-9]+(?:\s*,\s*[0-9]+)*)/;

        let names: string[] = [];
        let powerFactors: number[] = [];
        const unitType: Partial<UnitType> = {
            id: parsedId,
            veteranLevels: [],
            flags: []
        };
        let i = startIndex;
        for (; i < lines.length; i++) {
            const line = lines[i];
            let match = line.match(nameRx);
            if (match?.groups?.['name'] !== undefined) {
                unitType.name = match.groups['name'];
                continue;
            }

            match = line.match(classRx);
            if (match?.groups?.['class'] !== undefined) {
                unitType.class = match.groups['class'];
                continue;
            }

            match = line.match(flagsRx);
            if (match?.groups?.['flags'] !== undefined) {
                unitType.flags?.push(...match.groups['flags'].split(',').map((value) => value.trim().slice(1, -1)));
                continue;
            }

            match = line.match(veteranNamesRx);
            if (match?.groups?.['names'] !== undefined) {
                names = match.groups['names'].split(',').map((value) => value.trim().slice(3, -2));
                continue;
            }

            match = line.match(veteranPowerFactorRx);
            if (match?.groups?.['powerFactors']) {
                powerFactors = match.groups['powerFactors'].split(',').map((value) => {
                    value = value.trim();
                    const parsedValue = Number.parseInt(value);
                    if (Number.isNaN(parsedValue)) {
                        throw new Error(`Found NaN when parsing "${value}" as a veteran level power factor value`);
                    }
                    return parsedValue;
                });
                continue;
            }

            match = line.match(numericValueRx);
            if (match?.groups?.['numericValueTitle'] !== undefined && match.groups['numericValue'] !== undefined) {
                const parsedValue = Number.parseInt(match.groups['numericValue']);
                if (Number.isNaN(parsedValue)) {
                    throw new Error(`Found NaN when parsing "${match.groups['numericValue']}" as a numeric value`);
                }
                switch (match.groups['numericValueTitle']) {
                    case 'attack':
                        unitType.attack = parsedValue;
                        break;
                    case 'defense':
                        unitType.defense = parsedValue;
                        break;
                    case 'firepower':
                        unitType.firepower = parsedValue;
                        break;
                    case 'hitpoints':
                        unitType.hitpoints = parsedValue;
                        break;
                    case 'move_rate':
                        unitType.moves = parsedValue;
                        break;
                    default:
                        // no-op
                        break;
                }
                continue;
            }

            if (line.match(headerRx) !== null) {
                i--;
                break;
            }
        }

        if (names.length !== powerFactors.length) {
            // FIXME: Workaround for rulesets being an utterly stupid format that can't be easily parsed
            // More info: Lists of values can be on multiple lines, but don't actually have to begin on the same line as
            // the name. Fuck you, whoever created this bullshit. I know it was like >20 years ago, but you could've
            // picked a format that had a readily available parser instead of rolling your own incompatible crap.
            if (names.length === 0) {
                console.warn(`Working around ruleset format stupidity for unit "${parsedId}"`);
                names = powerFactors.map((factor, index) => `v${index} (${factor}%)`);
            } else {
                console.info(unitType, names, powerFactors);
                throw new Error('Found veterancy names and power factors of differing lengths');
            }
        }
        for (let j = 0; j < names.length; j++) {
            unitType.veteranLevels?.push({ name: names[j], powerFactor: powerFactors[j] });
        }

        if (
            unitType.name !== undefined &&
            unitType.class !== undefined &&
            unitType.attack !== undefined &&
            unitType.defense !== undefined &&
            unitType.firepower !== undefined &&
            unitType.hitpoints !== undefined &&
            unitType.moves !== undefined
        ) {
            return [unitType as UnitType, i];
        } else {
            throw new Error(`Something is missing in unit "${parsedId}"`);
        }
    }

    private parseSingleUnitClass(lines: string[], startIndex: number, parsedId: string): [UnitClass, number] {
        const headerRx = /^\s*\[(?<id>\w+)]/;
        const nameRx = /^\s*name\s*=\s*(?:_\()?"(\?\w+:)?(?<name>[^"]+)"\)?/;
        const flagsRx = /^\s*flags\s*=\s*(?<flags>"[^,"]+"(?:\s*,\s*"[^,"]+")*)/;
        const flagsContinuationRx = /^\s*(?<flags>"[^,"]+"(?:\s*,\s*"[^,"]+")*)/;

        const unitClass: Partial<UnitClass> = {
            id: parsedId,
            flags: []
        };

        let i = startIndex;
        for (; i < lines.length; i++) {
            const line = lines[i];
            let match = line.match(nameRx);
            if (match?.groups?.['name'] !== undefined) {
                unitClass.name = match.groups['name'];
                continue;
            }

            match = line.match(flagsRx);
            if (match?.groups?.['flags'] !== undefined) {
                unitClass.flags?.push(...match.groups['flags'].split(',').map((value) => value.trim().slice(1, -1)));
                let j = i + 1;
                for (; j < lines.length; j++) {
                    const matchCont = lines[j].match(flagsContinuationRx);
                    if (matchCont?.groups?.['flags'] !== undefined) {
                        unitClass.flags?.push(
                            ...matchCont.groups['flags'].split(',').map((value) => value.trim().slice(1, -1))
                        );
                    } else {
                        break;
                    }
                }
                i = j - 1;
                continue;
            }

            if (line.match(headerRx) !== null) {
                i--;
                break;
            }
        }

        if (unitClass.name !== undefined && unitClass.flags !== undefined) {
            return [unitClass as UnitClass, i];
        } else {
            console.info(unitClass);
            throw new Error(`Something is missing in unit class "${parsedId}"`);
        }
    }

    private fileCompatible(lines: string[]): boolean {
        // missing double quote at the end of options string is intentional, there may be other options in there
        const hasCorrectOptions = lines.some((line) => line.startsWith('options="+Freeciv-ruleset-Devel-2017.Jan.02'));
        const hasCorrectVersion = lines.some((line) => line.startsWith('format_version=20'));
        return hasCorrectOptions && hasCorrectVersion;
    }

    private makeLines(input: string): string[] {
        return input.split(/[\r\n]/).filter((line) => !/^\s*$/.test(line));
    }
}
