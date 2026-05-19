## Reusing your lexer + parser for semantic coloring

You already have the right layering:

- **Lexer**: `TokenStream` in `src/lexer/stream.ts` produces tokens with `kind`, `line`, `column`.
- **Parser**: `parse()` in `src/parser/parser.ts` consumes a `TokenStream` and builds an AST.
- **AST nodes**: many expressions carry `line`/`column` (e.g. `IdentifierExpr`, literals) in `src/parser/ast.ts`, but **not end/length**.

Semantic tokens in VS Code require **(line, startChar, length, tokenType, modifiers)**, so the key architectural question is: *where do you get `length` reliably?*

### Core recommendation: keep “spans” in the lexer layer

Structure the extension’s semantic coloring as two passes:

1. **Token-driven pass (lexer)** for things you can classify without context:
   - keywords, operators/punctuation, numbers, strings, regex, truth literals, comments (if you want)
2. **AST-driven pass (parser)** for things that need context:
   - declaration identifiers vs usages, field names, function-call targets, type-ish identifiers (as your language grows)

But for both passes, you’ll want a common “span” representation coming from lexing.

### 1) Add/derive a `Span` for each lexed token (start + length)

Right now `TokenStream.next()` returns tokens with only `line`/`column` (and values), e.g. `IDENTIFIER` has `identifier: string`, `KEYWORD` has `keyword`, etc. (`src/lexer/token.ts`).

For semantic tokens you want something like:

```ts
type Span = { line0: number; startChar0: number; length: number } // 0-based for VS Code
type LexedToken = Token & { span: Span; raw: string }
```

**Why include `raw`?** Because `value.toString()` often loses formatting (underscores, exact decimal formatting, regex modifiers, quotes), and you want the highlight length to match the original text.

Implementation detail options (pick one):

- **Best**: make the lexer produce `raw` and `startIndex/endIndex` (or `length`) as it scans. Since `Source` already tracks `location.index` and `skip(n)` advances it, you can capture “start index” before consuming and “end index” after consuming.
- **Acceptable**: compute `length` from known raw strings:
  - identifiers: `identifier.length`
  - keywords/operators/punct: literal length
  - but strings/regex/numbers become error-prone without preserving the raw lexeme.

### 2) Build a small “semantic token classifier” module independent of VS Code

Create a pure function/module that doesn’t import `vscode`:

- `src/semantic/tokens.ts`
  - input: `source: string`, `file: string`
  - output: `SemanticToken[]` in your own format:
    ```ts
    type SemanticToken = { span: Span; type: TokenType; modifiers: TokenModifier[] }
    ```

This module should:
- run your lexer to produce `LexedToken[]` (with spans)
- optionally run `parse(source, file)` to get AST for higher-level classifications
- return semantic tokens (still your own internal format)

Then a thin adapter:

- `src/extension/semantic-provider.ts`
  - converts your `SemanticToken[]` into `vscode.SemanticTokensBuilder`

This separation keeps the compiler pipeline reusable (and testable) without VS Code.

### 3) Decide “who owns” identifier classification: parser-driven, lexer-driven, or hybrid

With your current AST (`src/parser/ast.ts`), identifiers appear at least as:

- `IdentifierExpr` with `name`, `line`, `column`

But the AST doesn’t carry identifier length/end. So classification should be **AST-driven**, but spans should come from the **lexed tokens**.

A clean hybrid approach:

- Build a map from `(line0, startChar0)` → `LexedToken` for identifiers.
- Walk the AST; when you hit an `IdentifierExpr` at `(line,column)`:
  - find the corresponding lexed identifier token
  - emit a semantic token using *that* token’s `length/raw`, but choose the `tokenType` from AST context:
    - variable declaration name → `variable` + maybe `declaration` modifier
    - function call target (if it’s an identifier) → `function`
    - field labels (if you add them as nodes) → `property`

This avoids trying to reconstruct exact widths from the AST.

### 4) Concrete mapping ideas using what you have today

From `src/lexer/kinds.ts` you already have:
- `ALL_KW` keywords
- operators/punctuation sets

So lexer-only classifications can be straightforward:

- `KEYWORD` → VS Code token type `keyword`
- `INTEGER_LITERAL` / `REAL_LITERAL` → `number`
- `STRING_LITERAL` → `string`
- `REGEX_LITERAL` → `regexp` (VS Code supports it)
- `TRUTH_VALUE_LITERAL` → usually `keyword` or `number` depending on theme conventions; many grammars treat `true/false/null` as `keyword` or `constant`

Parser-driven classifications you can do even with the current AST:

- `VariableDeclarationStmt.name` should be colored as a `variable` with modifier `declaration`
  - but note: `VariableDeclarationStmt` currently has **no line/column for the name**, only the initializer has. So to color declaration *names*, you’ll either:
    - extend AST statements to include source location for the name token, or
    - in the parser, keep the consumed identifier token (or its span) on the stmt node.

That’s an important structuring point: **if you want semantic highlighting for declarations**, you’ll need the parser to preserve the location of the declared identifier token(s).

### 5) Minimal AST changes that unlock great semantic coloring

If you’re willing to tweak the AST shape, the “best ROI” is to add spans for name-bearing constructs:

- `VariableDeclarationStmt`: add `nameLoc` (or `nameSpan`)
- `DataStructureStmt.name`: add `nameLoc`
- `Field.name`: add `nameLoc`
- `DestructuringStmt.variables`: add loc per bound name
- `FunctionCallStmt.target`: already an `Expr` so it’s positioned

You already have `SourceLocation { start; end }` defined in `ast.ts` but unused; that’s a strong hint you were heading this direction:

```28:31:src/parser/ast.ts
export interface SourceLocation {
    start: number
    end: number
}
```

If you attach a `loc` (start/end index) or `span` (line/col/len) to nodes, semantic highlighting becomes much simpler and doesn’t require token↔AST backflips.

## Suggested folder/module layout

- `src/lexer/*` (keep)
- `src/parser/*` (keep)
- `src/semantic/`
  - `lex.ts` → “lex with spans/raw”
  - `classify.ts` → lexer-only + AST-based classification producing `SemanticToken[]`
  - `legend.ts` → list of semantic token types/modifiers you support (independent of VS Code)
- `src/extension/`
  - `semantic-provider.ts` → VS Code adapter + registration
  - `extension.ts` → activation and wiring

This keeps “language intelligence” reusable outside VS Code (tests, future LSP, etc.).

If you tell me which constructs you want colored first (just keywords/literals, or also decls/usages/types), I can outline the exact data you need to carry through lexer/parser to make that reliable with minimal churn.