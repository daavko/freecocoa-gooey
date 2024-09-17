import { createToken, Lexer } from 'chevrotain';

/**
 * Custom parser for strings, since they can't be matched with a regular expression
 *
 * @param text - Text input
 * @param startOffset - Offset for current character
 */
function stringContentsMatcher(text: string, startOffset: number): [string] | null {
    const openingQuote = text[startOffset];
    if (openingQuote !== `"` && openingQuote !== `'` && openingQuote !== '*') {
        return null;
    }

    for (let offset = startOffset + 1; offset < text.length; offset++) {
        const char = text[offset];
        if (char === '\\') {
            // escape sequence, consume two characters
            offset += 1;
        } else if (char === openingQuote) {
            return [text.substring(startOffset, offset + 1)];
        }
    }
    return null;
}

// punctuation
const comment = createToken({
    name: 'comment',
    label: '#',
    pattern: /[#;].*/,
    start_chars_hint: ['#', ';'],
    group: Lexer.SKIPPED
});
const whitespace = createToken({ name: 'whitespace', pattern: /[ \t]+/, group: Lexer.SKIPPED });
const lineEnd = createToken({ name: 'lineEnd', label: 'EOL', pattern: /\r?\n/, group: Lexer.SKIPPED });
const comma = createToken({ name: 'comma', label: ',', pattern: ',' });
const equals = createToken({ name: 'equals', label: '=', pattern: '=' });
const braceOpening = createToken({ name: 'braceOpening', label: '{', pattern: '{' });
const braceClosing = createToken({ name: 'braceClosing', label: '}', pattern: '}' });

// file inclusion
const fileInclusionMarker = createToken({ name: 'fileInclMark', label: '*', pattern: '*include' });

// names
const sectionName = createToken({ name: 'sectionName', label: 'sectionName', pattern: /\[[ !-Z^-~]+]/ });
const entryName = createToken({
    name: 'entryName',
    label: 'entryName',
    pattern: /[a-zA-Z0-9_-][a-zA-Z0-9_.-]*[a-zA-Z0-9_-]/
});

// values
const booleanValue = createToken({ name: 'boolean', label: 'boolean', pattern: /(TRUE|FALSE)/ });
const numberValue = createToken({ name: 'number', label: 'number', pattern: /[+-]?[0-9]+(\.[0-9]+)?/ });
const stringTranslationOpening = createToken({ name: 'strTransOp', label: '_(', pattern: '_(', group: Lexer.SKIPPED });
const stringTranslationClosing = createToken({ name: 'strTransCl', label: ')', pattern: ')', group: Lexer.SKIPPED });
const stringValue = createToken({
    name: 'strCont',
    label: 'string',
    pattern: stringContentsMatcher,
    start_chars_hint: ["'", '"', '*'],
    line_breaks: true
});

// prettier-ignore
export const FreecivToken = {
    comma, equals,
    braceOpening, braceClosing,
    fileInclusionMarker,
    sectionName, entryName,
    booleanValue, numberValue, stringValue
};

// prettier-ignore
export const FREECIV_INI_TOKENS = [
    comment,
    fileInclusionMarker,
    whitespace, lineEnd,
    comma, equals,
    stringTranslationOpening, stringTranslationClosing,
    braceOpening, braceClosing,
    booleanValue, numberValue,
    sectionName, entryName,
    stringValue
];

export const FreecivIniLexer = new Lexer(FREECIV_INI_TOKENS, { ensureOptimizations: true });
