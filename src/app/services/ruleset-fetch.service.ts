import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable } from 'rxjs';
import {
    Building,
    CitizenSettings,
    CityParameters,
    Effect,
    InciteCosts,
    Requirement,
    REQUIREMENT_RANGES,
    RequirementRange,
    Ruleset,
    Terrain,
    TerrainExtra,
    UnitClass,
    UnitType,
    UnitTypeBonus,
    VeteranLevel
} from 'src/app/models/ruleset.model';
import { FreecivIniLexer } from 'src/app/services/parser/freeciv-ini-lexer';
import { FreecivIniParser } from 'src/app/services/parser/freeciv-ini-parser';
import { FreecivIniToAstVisitor } from 'src/app/services/parser/freeciv-ini-to-ast-visitor';
import { IniFile, IniTable, IniValueList } from 'src/app/services/parser/freeciv-ini-ast';
import {
    entryValueAsBoolean,
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

    public fetchRuleset(baseUrl: string): Observable<Ruleset> {
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }

        const effectsFile$ = this.fetchFile(baseUrl, 'effects.ruleset');
        const terrainFile$ = this.fetchFile(baseUrl, 'terrain.ruleset');
        const unitsFile$ = this.fetchFile(baseUrl, 'units.ruleset');
        const gameFile$ = this.fetchFile(baseUrl, 'game.ruleset');
        const buildingsFile$ = this.fetchFile(baseUrl, 'buildings.ruleset');
        const citiesFile$ = this.fetchFile(baseUrl, 'cities.ruleset');

        return combineLatest([effectsFile$, terrainFile$, unitsFile$, gameFile$, buildingsFile$, citiesFile$]).pipe(
            map(([effectsFile, terrainFile, unitsFile, gameFile, buildingsFile, citiesFile]) => {
                const [unitClasses, unitTypes, defaultVeteranLevels] = this.extractUnitsFile(unitsFile);
                const [terrainTypes, terrainExtras, moveFrags] = this.extractTerrainFile(terrainFile);
                const effects = this.extractEffectsFile(effectsFile);
                const inciteCosts = this.extractGameFile(gameFile);
                const buildings = this.extractBuildingsFile(buildingsFile);
                const [cityParameters, citizenSettings] = this.extractCitiesFile(citiesFile);
                return {
                    effects,
                    unitTypes,
                    unitClasses,
                    defaultVeteranLevels,
                    terrainTypes,
                    terrainExtras,
                    moveFrags,
                    inciteCosts,
                    buildings,
                    cityParameters,
                    citizenSettings
                };
            })
        );
    }

    private fetchFile(baseUrl: string, filename: string): Observable<IniFile> {
        return this.http
            .get(`${baseUrl}/${filename}`, { responseType: 'text' })
            .pipe(map((file) => this.parseFile(file, filename)));
    }

    private parseFile(file: string, filename: string): IniFile {
        const lexedFile = FreecivIniLexer.tokenize(file);
        if (lexedFile.errors.length > 0) {
            console.error(lexedFile.errors);
            throw new Error(`Lexing error in ${filename}`);
        }

        this.parser.input = lexedFile.tokens;
        const parsedFile = this.parser.iniContents();
        if (this.parser.errors.length > 0) {
            console.error(this.parser.errors);
            throw new Error(`Parser error in ${filename}`);
        }

        return this.cstVisitor.visit(parsedFile) as IniFile;
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
                const buildCostEntry = findGuaranteedEntry(section, 'build_cost');
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
                    buildCost: entryValueAsNumber(buildCostEntry),
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

        // this makes things way easier in other parts of code
        for (const unitType of unitTypes) {
            if (unitType.veteranLevels.length === 0) {
                unitType.veteranLevels = vetLevels;
            }
        }

        return [unitClasses, unitTypes, vetLevels];
    }

    private extractTerrainFile(file: IniFile): [Terrain[], TerrainExtra[], number] {
        const terrainIdPrefix = 'terrain_';
        const terrains: Terrain[] = file.sections
            .filter((section) => section.name.startsWith(terrainIdPrefix))
            .map((section) => {
                const nameEntry = findGuaranteedEntry(section, 'name');
                const defenseBonusEntry = findGuaranteedEntry(section, 'defense_bonus');

                const nativeToEntry = findPossibleEntry(section, 'native_to');
                let nativeUnitClasses: string[] = [];
                if (nativeToEntry !== undefined) {
                    nativeUnitClasses = entryValueAsValueList(nativeToEntry).map((value) => rawValueAsString(value));
                }

                return {
                    id: section.name.substring(terrainIdPrefix.length),
                    name: this.cleanTranslatableName(entryValueAsString(nameEntry)),
                    defenseBonus: entryValueAsNumber(defenseBonusEntry),
                    nativeUnitClasses
                };
            });

        const terrainExtraIdPrefix = 'extra_';
        const terrainExtras: TerrainExtra[] = file.sections
            .filter((section) => section.name.startsWith(terrainExtraIdPrefix))
            .map((section) => {
                const nameEntry = findGuaranteedEntry(section, 'name');

                const defenseBonusEntry = findPossibleEntry(section, 'defense_bonus');
                let defenseBonus = 0;
                if (defenseBonusEntry !== undefined) {
                    defenseBonus = entryValueAsNumber(defenseBonusEntry);
                }

                const nativeToEntry = findPossibleEntry(section, 'native_to');
                let nativeUnitClasses: string[] = [];
                if (nativeToEntry !== undefined) {
                    nativeUnitClasses = entryValueAsValueList(nativeToEntry).map((value) => rawValueAsString(value));
                }

                const flagsEntry = findPossibleEntry(section, 'flags');
                let flags: string[] = [];
                if (flagsEntry !== undefined) {
                    flags = entryValueAsValueList(flagsEntry).map((value) => rawValueAsString(value));
                }

                return {
                    id: section.name.substring(terrainExtraIdPrefix.length),
                    name: this.cleanTranslatableName(entryValueAsString(nameEntry)),
                    defenseBonus,
                    nativeUnitClasses,
                    flags
                };
            });

        const paramsSection = findGuaranteedSection(file, 'parameters');
        const moveFragsEntry = findGuaranteedEntry(paramsSection, 'move_fragments');

        return [terrains, terrainExtras, entryValueAsNumber(moveFragsEntry)];
    }

    private extractGameFile(file: IniFile): InciteCosts {
        const inciteCostSection = findGuaranteedSection(file, 'incite_cost');
        const baseInciteCostEntry = findGuaranteedEntry(inciteCostSection, 'base_incite_cost');
        const improvementFactorEntry = findGuaranteedEntry(inciteCostSection, 'improvement_factor');
        const unitFactorEntry = findGuaranteedEntry(inciteCostSection, 'unit_factor');
        const totalFactorEntry = findGuaranteedEntry(inciteCostSection, 'total_factor');

        return {
            baseInciteCost: entryValueAsNumber(baseInciteCostEntry),
            improvementFactor: entryValueAsNumber(improvementFactorEntry),
            unitFactor: entryValueAsNumber(unitFactorEntry),
            totalFactor: entryValueAsNumber(totalFactorEntry)
        };
    }

    private extractBuildingsFile(file: IniFile): Building[] {
        const buildingIdPrefix = 'building_';
        return file.sections
            .filter((section) => section.name.startsWith(buildingIdPrefix))
            .map((section) => {
                const nameEntry = findGuaranteedEntry(section, 'name');
                const buildCostEntry = findGuaranteedEntry(section, 'build_cost');

                return {
                    id: section.name.substring(buildingIdPrefix.length),
                    name: this.cleanTranslatableName(entryValueAsString(nameEntry)),
                    buildCost: entryValueAsNumber(buildCostEntry)
                };
            });
    }

    private extractCitiesFile(file: IniFile): [CityParameters, CitizenSettings] {
        const parametersSection = findGuaranteedSection(file, 'parameters');
        const celebrateSizeLimitEntry = findGuaranteedEntry(parametersSection, 'celebrate_size_limit');

        const citizenSection = findGuaranteedSection(file, 'citizen');
        const nationalityEntry = findGuaranteedEntry(citizenSection, 'nationality');

        return [
            {
                celebrateSizeLimit: entryValueAsNumber(celebrateSizeLimitEntry)
            },
            {
                nationality: entryValueAsBoolean(nationalityEntry)
            }
        ];
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
