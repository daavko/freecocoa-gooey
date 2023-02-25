import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable } from 'rxjs';
import {
    Effect,
    Requirement,
    REQUIREMENT_RANGES,
    RequirementRange,
    Ruleset,
    Terrain,
    UnitClass,
    UnitType,
    UnitTypeBonus,
    VeteranLevel
} from 'src/app/models/ruleset.model';
import { FreecivIniLexer } from 'src/app/services/parser/freeciv-ini-lexer';
import { FreecivIniParser } from 'src/app/services/parser/freeciv-ini-parser';
import { FreecivIniToAstVisitor, IFreecivIniToAstVisitor } from 'src/app/services/parser/freeciv-ini-to-ast-visitor';
import { IniFile, IniTable, IniValueList } from 'src/app/services/parser/freeciv-ini-ast';
import {
    entryValueAsNumber,
    entryValueAsString,
    entryValueAsTable,
    entryValueAsValueList,
    findGuaranteedEntry,
    findGuaranteedSection,
    findPossibleEntry,
    rawValueAsNumber,
    rawValueAsString
} from 'src/app/services/parser/freeciv-ini-ast-utils';

@Injectable({
    providedIn: 'root'
})
export class RulesetFetchService {
    private readonly parser = new FreecivIniParser();
    private readonly cstVisitor = new FreecivIniToAstVisitor();

    constructor(private http: HttpClient) {}

    public fetchRuleset(effectsUrl: string, terrainUrl: string, unitsUrl: string): Observable<Ruleset> {
        const effects$ = this.http.get(effectsUrl, { responseType: 'text' });
        const terrain$ = this.http.get(terrainUrl, { responseType: 'text' });
        const units$ = this.http.get(unitsUrl, { responseType: 'text' });
        return combineLatest([units$, terrain$, effects$]).pipe(
            map(([units, terrain, effects]) => {
                const unitsFile = this.parseFile(units);
                const terrainFile = this.parseFile(terrain);
                const effectsFile = this.parseFile(effects);

                const [unitClasses, unitTypes, defaultVeteranLevels] = this.extractUnitsFile(unitsFile);
                const [terrainTypes, moveFrags] = this.extractTerrainFile(terrainFile);
                const effectsList = this.extractEffectsFile(effectsFile);
                return {
                    effects: effectsList,
                    unitTypes,
                    unitClasses,
                    defaultVeteranLevels,
                    terrainTypes,
                    moveFrags
                };
            })
        );
    }

    private parseFile(file: string): ReturnType<IFreecivIniToAstVisitor['iniContents']> {
        const lexedFile = FreecivIniLexer.tokenize(file);
        if (lexedFile.errors.length > 0) {
            console.error(lexedFile.errors);
            throw new Error('Lexing error');
        }

        this.parser.input = lexedFile.tokens;
        const parsedFile = this.parser.iniContents();
        if (this.parser.errors.length > 0) {
            console.error(this.parser.errors);
            throw new Error('Parser error');
        }

        return this.cstVisitor.visit(parsedFile) as ReturnType<IFreecivIniToAstVisitor['iniContents']>;
    }

    private extractEffectsFile(file: IniFile): Effect[] {
        const effectIdPrefix = 'effect_';
        return file.sections
            .filter((section) => section.name.startsWith(effectIdPrefix))
            .map((section) => {
                const typeEntry = findGuaranteedEntry(section, 'type');
                const valueEntry = findGuaranteedEntry(section, 'value');

                let requirements: Requirement[] = [];
                const reqsEntry = findPossibleEntry(section, 'reqs');
                if (reqsEntry !== undefined) {
                    const reqs = entryValueAsTable(reqsEntry);
                    requirements = this.iniTableToRequirementsVector(reqs);
                }

                return {
                    id: section.name.substring(effectIdPrefix.length),
                    type: entryValueAsString(typeEntry),
                    value: entryValueAsNumber(valueEntry),
                    requirements
                };
            });
    }

    private iniTableToRequirementsVector(table: IniTable): Requirement[] {
        if (table.heading.length === 0 || table.rows.length === 0) {
            return [];
        }

        return table.rows.map((row) => {
            const requirementEntry: Requirement = {
                type: '',
                name: '',
                range: RequirementRange.LOCAL,
                present: true
            };

            for (let i = 0; i < table.heading.length; i++) {
                const heading = table.heading[i];
                const value = row[i];
                switch (heading) {
                    case 'type':
                        if (typeof value !== 'string') {
                            throw new TypeError('Expected requirement type to be a string');
                        }
                        requirementEntry.type = value;
                        break;
                    case 'name':
                        if (typeof value !== 'string') {
                            throw new TypeError('Expected requirement name to be a string');
                        }
                        requirementEntry.name = value;
                        break;
                    case 'range':
                        if (
                            typeof value !== 'string' ||
                            !REQUIREMENT_RANGES.includes(value.toLowerCase() as RequirementRange)
                        ) {
                            throw new TypeError('Expected requirement range to be valid');
                        }
                        requirementEntry.range = value.toLowerCase() as RequirementRange;
                        break;
                    case 'present':
                        if (typeof value !== 'boolean') {
                            throw new TypeError('Expected requirement presence to be a boolean');
                        }
                        requirementEntry.present = value;
                        break;
                    default:
                        // no-op
                        break;
                }
            }

            return requirementEntry;
        });
    }

    private mergeVeterancyNamesAndPowerFactors(
        names: IniValueList,
        powerFactors: IniValueList,
        baseRaiseChances: IniValueList
    ): VeteranLevel[] {
        if (names.length !== powerFactors.length) {
            throw new Error('Found veterancy names and power factors of differing lengths');
        }

        return names.map((name, i) => ({
            name: this.cleanTranslatableName(rawValueAsString(name)),
            powerFactor: rawValueAsNumber(powerFactors[i]),
            baseRaiseChance: rawValueAsNumber(baseRaiseChances[i])
        }));
    }

    private extractUnitsFile(file: IniFile): [UnitClass[], UnitType[], VeteranLevel[]] {
        const unitClassPrefix = 'unitclass_';
        const unitClasses: UnitClass[] = file.sections
            .filter((section) => section.name.startsWith(unitClassPrefix))
            .map((section) => {
                const nameEntry = findGuaranteedEntry(section, 'name');
                const flagsEntry = findGuaranteedEntry(section, 'flags');

                return {
                    id: section.name.substring(unitClassPrefix.length),
                    name: this.cleanTranslatableName(entryValueAsString(nameEntry)),
                    flags: entryValueAsValueList(flagsEntry).map((value) => rawValueAsString(value))
                };
            });
        const unitTypeIdPrefix = 'unit_';
        const unitTypes: UnitType[] = file.sections
            .filter((section) => section.name.startsWith(unitTypeIdPrefix))
            .map((section) => {
                const nameEntry = findGuaranteedEntry(section, 'name');
                const classEntry = findGuaranteedEntry(section, 'class');
                const attackEntry = findGuaranteedEntry(section, 'attack');
                const defenseEntry = findGuaranteedEntry(section, 'defense');
                const firepowerEntry = findGuaranteedEntry(section, 'firepower');
                const hitpointsEntry = findGuaranteedEntry(section, 'hitpoints');
                const movesEntry = findGuaranteedEntry(section, 'move_rate');
                const flagsEntry = findGuaranteedEntry(section, 'flags');

                const bonusesEntry = findPossibleEntry(section, 'bonuses');
                let bonuses: UnitTypeBonus[] = [];
                if (bonusesEntry !== undefined) {
                    const bonusesTable = entryValueAsTable(bonusesEntry);
                    bonuses = bonusesTable.rows.map((row) => {
                        const flagIndex = bonusesTable.heading.indexOf('flag');
                        const typeIndex = bonusesTable.heading.indexOf('type');
                        const valueIndex = bonusesTable.heading.indexOf('value');

                        return {
                            flag: rawValueAsString(row[flagIndex]),
                            type: rawValueAsString(row[typeIndex]),
                            value: rawValueAsNumber(row[valueIndex])
                        };
                    });
                }

                const vetNamesEntry = findPossibleEntry(section, 'veteran_names');
                const vetPowerFactsEntry = findPossibleEntry(section, 'veteran_power_fact');
                const vetBaseRaiseChancesEntry = findPossibleEntry(section, 'veteran_base_raise_chance');
                let veteranLevels: VeteranLevel[] = [];
                if (
                    vetNamesEntry !== undefined &&
                    vetPowerFactsEntry !== undefined &&
                    vetBaseRaiseChancesEntry !== undefined
                ) {
                    const vetNames = entryValueAsValueList(vetNamesEntry);
                    const vetPowerFacts = entryValueAsValueList(vetPowerFactsEntry);
                    const vetBaseRaiseChances = entryValueAsValueList(vetBaseRaiseChancesEntry);
                    veteranLevels = this.mergeVeterancyNamesAndPowerFactors(
                        vetNames,
                        vetPowerFacts,
                        vetBaseRaiseChances
                    );
                }

                return {
                    id: section.name.substring(unitTypeIdPrefix.length),
                    name: this.cleanTranslatableName(entryValueAsString(nameEntry)),
                    class: entryValueAsString(classEntry),
                    attack: entryValueAsNumber(attackEntry),
                    defense: entryValueAsNumber(defenseEntry),
                    firepower: entryValueAsNumber(firepowerEntry),
                    hitpoints: entryValueAsNumber(hitpointsEntry),
                    moves: entryValueAsNumber(movesEntry),
                    flags: entryValueAsValueList(flagsEntry).map((value) => rawValueAsString(value)),
                    bonuses,
                    veteranLevels
                };
            });

        const veteranSystemSection = findGuaranteedSection(file, 'veteran_system');
        const vetNames = entryValueAsValueList(findGuaranteedEntry(veteranSystemSection, 'veteran_names'));
        const vetPowerFacts = entryValueAsValueList(findGuaranteedEntry(veteranSystemSection, 'veteran_power_fact'));
        const vetBaseRaiseChances = entryValueAsValueList(
            findGuaranteedEntry(veteranSystemSection, 'veteran_base_raise_chance')
        );
        const vetLevels = this.mergeVeterancyNamesAndPowerFactors(vetNames, vetPowerFacts, vetBaseRaiseChances);

        return [unitClasses, unitTypes, vetLevels];
    }

    private extractTerrainFile(file: IniFile): [Terrain[], number] {
        const terrains: Terrain[] = file.sections
            .filter((section) => section.name.startsWith('terrain_'))
            .map((section) => {
                const nameEntry = findGuaranteedEntry(section, 'name');
                const defenseBonusEntry = findGuaranteedEntry(section, 'defense_bonus');

                return {
                    id: section.name.substring(8),
                    name: entryValueAsString(nameEntry),
                    defenseBonus: entryValueAsNumber(defenseBonusEntry)
                };
            });

        const paramsSection = findGuaranteedSection(file, 'parameters');
        const moveFragsEntry = findGuaranteedEntry(paramsSection, 'move_fragments');

        return [terrains, entryValueAsNumber(moveFragsEntry)];
    }

    private cleanTranslatableName(name: string): string {
        if (name.startsWith('?')) {
            const colonIndex = name.indexOf(':');
            return name.substring(colonIndex + 1);
        } else {
            return name;
        }
    }
}
