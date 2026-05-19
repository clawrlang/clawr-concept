Perfect. Here is the concrete rule table and implementation-ready spec text.

**Identifier Rules (Normative)**
1. Unicode base:
    - Use UAX #31 identifier classes.
    - Start class: XID_Start or underscore.
    - Continue class: XID_Continue or underscore.

2. Normalization:
    - Normalize every identifier to NFC at lexing time.
    - Token payload stores normalized form.
    - Equality and symbol lookup use normalized form only.

3. Reserved implementation glyphs:
    - Disallow these code points in user identifiers:
        - U+00B7 ·
        - U+00B8 ¸
        - U+02C7 ˇ
        - U+02DB ˛

4. Forbidden code point classes:
    - Cc (control characters)
    - Cf (format characters, including bidi control characters)
    - Cs (surrogates)
    - Co (private-use)
    - Cn (unassigned)
    - Variation Selectors block
    - Combining marks are allowed only where XID_Continue already allows them.

5. Emoji and symbol policy:
    - Disallow emoji presentation characters and most symbol categories as identifier characters.
    - This keeps identifiers textual and review-friendly while still allowing international scripts.

6. Keywords:
    - Keyword check runs after NFC normalization.
    - If normalized identifier matches a keyword, tokenize as keyword.

**Lexer Rule Table (Implementation-Oriented)**
1. Read first code point:
    - If underscore: valid identifier start.
    - Else must match Unicode property XID_Start.
    - Otherwise: not an identifier start.

2. Read subsequent code points:
    - Accept while underscore or XID_Continue.
    - Stop at first non-matching code point.

3. Validate forbidden set on the collected identifier:
    - If any reserved glyph appears: error.
    - If any forbidden class appears: error.

4. Normalize:
    - identifier = identifier.normalize(NFC)

5. Classify token:
    - If normalized identifier is keyword: KEYWORD.
    - Else if truth literal: TRUTH_LITERAL.
    - Else IDENTIFIER.

**Practical Regex Guidance for TypeScript**
1. Start test:
    - /[_\p{XID_Start}]/u

2. Continue test:
    - /[_\p{XID_Continue}]/u

3. Reserved glyph test:
    - /[·¸ˇ˛]/u

4. Optional strict symbol guard:
    - Reject if any code point is in general categories So, Sm, Sc, Sk unless explicitly whitelisted.

Note: property escapes require a JS runtime with Unicode property support (modern Node/Bun are fine).

**Diagnostics (Recommended Wording)**
1. Reserved glyph:
    - Reserved implementation glyph `<char>` is not allowed in Clawr identifiers

3. Invalid start:
    - Invalid identifier start character `<char>`

4. Invalid continuation:
    - Invalid identifier character `<char>` in identifier

5. Forbidden format/control:
    - Forbidden Unicode character `<char>` in identifier

**Pass/Fail Examples**
1. Should pass:
    - gräsklippare
    - Καλημέρα
    - 变量
    - имя_переменной
    - café
    - éclair (decomposed form; normalizes to NFC equivalent)

2. Should fail:
    - abc·def
    - abc¸def
    - abcˇdef
    - abc˛def
    - 🐶🐮
    - a`<zero-width-joiner>`b
    - a`<right-to-left-override>`b
