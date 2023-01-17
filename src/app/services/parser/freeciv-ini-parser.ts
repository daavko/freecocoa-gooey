import { CstParser, ParserMethod, CstNode } from 'chevrotain';
import { FREECIV_INI_TOKENS, FreecivToken } from './parser-constants';

export class FreecivIniParser extends CstParser {
    public IniFileInclusion!: ParserMethod<unknown[], CstNode>;
    public IniSection!: ParserMethod<unknown[], CstNode>;
    public IniEntry!: ParserMethod<unknown[], CstNode>;
    public IniValue!: ParserMethod<unknown[], CstNode>;
    public IniValueList!: ParserMethod<unknown[], CstNode>;
    public IniTable!: ParserMethod<unknown[], CstNode>;
    public IniContents!: ParserMethod<unknown[], CstNode>;

    constructor() {
        super(FREECIV_INI_TOKENS);

        this.RULE('IniFileInclusion', () => {
            this.CONSUME(FreecivToken.fileInclusionMarker);
            this.CONSUME(FreecivToken.stringValue);
        });

        this.RULE('IniSection', () => {
            this.CONSUME(FreecivToken.sectionName);
            this.MANY({
                DEF: () => this.SUBRULE(this.IniEntry)
            });
        });

        this.RULE('IniEntry', () => {
            this.CONSUME(FreecivToken.entryName);
            this.CONSUME(FreecivToken.equals);
            this.OR([
                {
                    GATE: () => this.LA(2).tokenType !== FreecivToken.comma,
                    ALT: () => this.SUBRULE(this.IniValue)
                },
                { ALT: () => this.SUBRULE(this.IniValueList) },
                { ALT: () => this.SUBRULE(this.IniTable) }
            ]);
        });

        this.RULE('IniValue', () => {
            this.OR([
                { ALT: () => this.CONSUME(FreecivToken.booleanValue) },
                { ALT: () => this.CONSUME(FreecivToken.numberValue) },
                { ALT: () => this.CONSUME(FreecivToken.stringValue) }
            ]);
        });

        this.RULE('IniValueList', () => {
            this.AT_LEAST_ONE_SEP({
                SEP: FreecivToken.comma,
                DEF: () => this.SUBRULE(this.IniValue)
            });
        });

        this.RULE('IniTable', () => {
            this.CONSUME(FreecivToken.braceOpening);
            this.MANY({
                DEF: () => this.SUBRULE(this.IniValueList)
            });
            this.CONSUME(FreecivToken.braceClosing);
        });

        this.RULE('IniContents', () => {
            this.MANY({
                DEF: () =>
                    this.OR([
                        { ALT: () => this.SUBRULE(this.IniSection) },
                        { ALT: () => this.SUBRULE(this.IniFileInclusion) }
                    ])
            });
        });

        this.performSelfAnalysis();
    }
}
