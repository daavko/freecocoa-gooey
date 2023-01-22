import { CstParser, ParserMethod, CstNode, IToken } from 'chevrotain';
import { FREECIV_INI_TOKENS, FreecivToken } from './parser-constants';

export class FreecivIniParser extends CstParser {
    public iniFileInclusion!: ParserMethod<unknown[], CstNode>;
    public iniSection!: ParserMethod<unknown[], CstNode>;
    public iniEntry!: ParserMethod<unknown[], CstNode>;
    public iniValue!: ParserMethod<unknown[], CstNode>;
    public iniValueList!: ParserMethod<unknown[], CstNode>;
    public iniTable!: ParserMethod<unknown[], CstNode>;
    public iniContents!: ParserMethod<unknown[], CstNode>;

    constructor() {
        super(FREECIV_INI_TOKENS);

        this.RULE('iniFileInclusion', () => {
            this.CONSUME(FreecivToken.fileInclusionMarker);
            this.CONSUME(FreecivToken.stringValue);
        });

        this.RULE('iniSection', () => {
            this.CONSUME(FreecivToken.sectionName);
            this.MANY({
                DEF: () => this.SUBRULE(this.iniEntry)
            });
        });

        this.RULE('iniEntry', () => {
            this.CONSUME(FreecivToken.entryName);
            this.CONSUME(FreecivToken.equals);
            this.OR([
                {
                    GATE: (): boolean => this.LA(2).tokenType !== FreecivToken.comma,
                    ALT: (): CstNode => this.SUBRULE(this.iniValue)
                },
                { ALT: (): CstNode => this.SUBRULE(this.iniValueList) }
            ]);
        });

        this.RULE('iniValue', () => {
            this.OR([
                { ALT: (): IToken => this.CONSUME(FreecivToken.booleanValue) },
                { ALT: (): IToken => this.CONSUME(FreecivToken.numberValue) },
                { ALT: (): IToken => this.CONSUME(FreecivToken.stringValue) }
            ]);
        });

        this.RULE('iniValueList', () => {
            this.AT_LEAST_ONE_SEP({
                SEP: FreecivToken.comma,
                DEF: () => this.SUBRULE(this.iniValue)
            });
        });

        this.RULE('iniTable', () => {
            this.CONSUME(FreecivToken.braceOpening);
            this.MANY({
                DEF: () => this.SUBRULE(this.iniValueList)
            });
            this.CONSUME(FreecivToken.braceClosing);
        });

        this.RULE('iniContents', () => {
            this.MANY({
                DEF: () =>
                    this.OR([
                        { ALT: (): CstNode => this.SUBRULE(this.iniSection) },
                        { ALT: (): CstNode => this.SUBRULE(this.iniFileInclusion) }
                    ])
            });
        });

        this.performSelfAnalysis();
    }
}
