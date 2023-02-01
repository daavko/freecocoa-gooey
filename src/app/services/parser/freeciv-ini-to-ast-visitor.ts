import { FreecivIniParser } from 'src/app/services/parser/freeciv-ini-parser';
import { ICstVisitor } from 'chevrotain';
import {
    IniContentsCstChildren,
    IniEntryCstChildren,
    IniFileInclusionCstChildren,
    IniSectionCstChildren,
    IniTableCstChildren,
    IniValueCstChildren,
    IniValueListCstChildren
} from 'src/app/services/parser/freeciv-ini-cst';
import {
    IniEntry,
    IniFile,
    IniFileInclusion,
    IniRawValue,
    IniSection,
    IniTable,
    IniValueList
} from 'src/app/services/parser/freeciv-ini-ast';

export interface IFreecivIniToAstVisitor extends ICstVisitor<unknown, unknown> {
    iniContents(children: IniContentsCstChildren): IniFile;
    iniSection(children: IniSectionCstChildren): IniSection;
    iniEntry(children: IniEntryCstChildren): IniEntry;
    iniValue(children: IniValueCstChildren): IniRawValue;
    iniValueList(children: IniValueListCstChildren): IniValueList;
    iniTable(children: IniTableCstChildren): IniTable;
    iniFileInclusion(children: IniFileInclusionCstChildren): IniFileInclusion;
}

const parserInstance = new FreecivIniParser();
const FreecivIniBaseVisitor = parserInstance.getBaseCstVisitorConstructor();

// chevrotain has absolutely horrible typing, so we kinda have to type things on our own

export class FreecivIniToAstVisitor extends FreecivIniBaseVisitor implements IFreecivIniToAstVisitor {
    constructor() {
        super();
        this.validateVisitor();
    }
    public iniContents(children: IniContentsCstChildren): IniFile {
        const sections =
            children.iniSection?.map((section) => this.visit(section) as ReturnType<typeof this.iniSection>) ?? [];
        const fileInclusions =
            children.iniFileInclusion?.map(
                (fileInclusion) => this.visit(fileInclusion) as ReturnType<typeof this.iniFileInclusion>
            ) ?? [];
        return {
            sections,
            fileInclusions
        };
    }

    public iniSection(children: IniSectionCstChildren): IniSection {
        const entries = children.iniEntry?.map((entry) => this.visit(entry) as ReturnType<typeof this.iniEntry>) ?? [];
        return {
            name: children.sectionName[0].image.slice(1, -1),
            entries
        };
    }

    public iniEntry(children: IniEntryCstChildren): IniEntry {
        let value: IniEntry['value'];
        if (children.iniValue !== undefined) {
            value = this.visit(children.iniValue) as ReturnType<typeof this.iniValue>;
        } else if (children.iniValueList !== undefined) {
            value = this.visit(children.iniValueList) as ReturnType<typeof this.iniValueList>;
        } else if (children.iniTable !== undefined) {
            value = this.visit(children.iniTable) as ReturnType<typeof this.iniTable>;
        } else {
            throw new Error('FreecivIniToAstVisitor: Unable to find valid value for entry. This should never happen.');
        }
        return {
            name: children.entryName[0].image,
            value
        };
    }

    public iniValue(children: IniValueCstChildren): IniRawValue {
        let value: IniRawValue;
        if (children.boolean !== undefined) {
            switch (children.boolean[0].image.toLowerCase()) {
                case 'true':
                    value = true;
                    break;
                case 'false':
                    value = false;
                    break;
                default:
                    throw new Error(
                        'FreecivIniToAstVisitor: Somehow got an invalid boolean value. This should never happen.'
                    );
            }
        } else if (children.number !== undefined) {
            value = Number.parseFloat(children.number[0].image);
            if (Number.isNaN(value)) {
                throw new Error(
                    'FreecivIniToAstVisitor: Somehow got NaN when parsing a number value. This should never happen.'
                );
            }
        } else if (children.strCont !== undefined) {
            value = children.strCont[0].image.slice(1, -1);
        } else {
            throw new Error('FreecivIniToAstVisitor: Unable to find value type. This should never happen.');
        }
        return value;
    }

    public iniValueList(children: IniValueListCstChildren): IniValueList {
        return children.iniValue.map((value) => this.visit(value) as ReturnType<typeof this.iniValue>);
    }

    public iniTable(children: IniTableCstChildren): IniTable {
        let heading: IniValueList = [];
        if (children.iniValueList?.[0] !== undefined) {
            heading = this.visit(children.iniValueList[0]) as ReturnType<typeof this.iniValueList>;
        }
        const rows =
            children.iniValueList?.slice(1)?.map((row) => this.visit(row) as ReturnType<typeof this.iniValueList>) ??
            [];
        return {
            type: 'table',
            heading,
            rows
        };
    }

    public iniFileInclusion(children: IniFileInclusionCstChildren): IniFileInclusion {
        return {
            file: children.strCont[0].image
        };
    }
}
