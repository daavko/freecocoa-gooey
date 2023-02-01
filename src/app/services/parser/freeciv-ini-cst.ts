import type { CstNode, IToken } from 'chevrotain';

export interface IniFileInclusionCstNode extends CstNode {
    name: 'iniFileInclusion';
    children: IniFileInclusionCstChildren;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- incompatible with chevrotain types
export type IniFileInclusionCstChildren = {
    fileInclMark: IToken[];
    strCont: IToken[];
};

export interface IniSectionCstNode extends CstNode {
    name: 'iniSection';
    children: IniSectionCstChildren;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- incompatible with chevrotain types
export type IniSectionCstChildren = {
    sectionName: IToken[];
    iniEntry?: IniEntryCstNode[];
};

export interface IniEntryCstNode extends CstNode {
    name: 'iniEntry';
    children: IniEntryCstChildren;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- incompatible with chevrotain types
export type IniEntryCstChildren = {
    entryName: IToken[];
    equals: IToken[];
    iniValue?: IniValueCstNode[];
    iniValueList?: IniValueListCstNode[];
    iniTable?: IniTableCstNode[];
};

export interface IniValueCstNode extends CstNode {
    name: 'iniValue';
    children: IniValueCstChildren;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- incompatible with chevrotain types
export type IniValueCstChildren = {
    boolean?: IToken[];
    number?: IToken[];
    strCont?: IToken[];
};

export interface IniValueListCstNode extends CstNode {
    name: 'iniValueList';
    children: IniValueListCstChildren;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- incompatible with chevrotain types
export type IniValueListCstChildren = {
    iniValue: IniValueCstNode[];
    comma?: IToken[];
};

export interface IniTableCstNode extends CstNode {
    name: 'iniTable';
    children: IniTableCstChildren;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- incompatible with chevrotain types
export type IniTableCstChildren = {
    braceOpening: IToken[];
    iniValueList?: IniValueListCstNode[];
    braceClosing: IToken[];
};

export interface IniContentsCstNode extends CstNode {
    name: 'iniContents';
    children: IniContentsCstChildren;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- incompatible with chevrotain types
export type IniContentsCstChildren = {
    iniSection?: IniSectionCstNode[];
    iniFileInclusion?: IniFileInclusionCstNode[];
};
