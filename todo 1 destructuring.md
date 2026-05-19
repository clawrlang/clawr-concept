### Short answer

Given where your codebase is, **(1) enriching the AST / type info for properties is the next natural step**, and **(2) evaluating `Expr` to get a runtime object is much heavier and can safely wait**. For adding new base types like `integer`, I’d also approach it in **small, type-inference-focused steps around `DataStructure`**, before wiring them fully into destructuring.

### How I’d sequence the next steps

#### 1. Strengthen static type info for data structures (no evaluation yet)

- **Introduce a notion of “`data` shape” / field lattices**:
    - For each `DataStructure` in the AST, build a map like `name -> Record<fieldName, Lattice>`.
    - This can be done in a simple “definition collection” pass over the AST (no expressions evaluated).
- **Introduce an environment for variable types** (still static):
    - When you see `const struct: Structure = {...}` or even just `const struct = {...}` later, you’ll want to assign a `Lattice` (or “`data`-lattice”) to `struct`.
    - Initially you can restrict this to explicit `DataStructure`-typed variables to keep inference simple.

This work directly supports destructuring without requiring an interpreter.

#### 2. Use property type info in destructuring lowering

Once you have “`data` shapes”:

- **For `const {a: x} = struct`**:
    - Look up `obj` in the variable-type environment → get some “object type” with field `a`’s `Lattice`.
    - From that, call your existing `lowerType(fieldLattice)` to get the C type for `x`.
    - This replaces the current ternary-only shortcut in `lowerDestructuredVarType` with real logic.
- You can still **start by only supporting cases where the object type is known** and fields have `ternary` lattices, then extend to `integer` later.

This keeps destructuring purely a **compile-time rewrite plus type lookup**, which plays to your existing design.

#### 3. Add `integer` support in small, inference-centric steps

Instead of jumping into full general inference, I’d do:

- **Step 3a: Explicit integer field types only**
    - In `DataStructure` definitions, allow fields annotated as `integer` (you already do).
    - In a test, define something like:
        - `data Pair { a: integer, b: integer }`
	    - `const {a, b} = p`
	  - Provide just enough typing logic so that:
	    - `p` is known to be a `Pair`.
	    - `a` and `b` get their lattices from `Pair`’s definition, and lower to `int` / `BigInt*` via `lowerType`.
- **Step 3b: Limited inference for literals used as initializers**
	- For `const p = { a: 1, b: 2 }`, treat `DataLiteral` as a struct-like literal:
		- infer `a` and `b` as small integer ranges or at least `integer` type.
	- Update your environment-building pass to assign a composite lattice to `p` from its fields.
- Only when these are stable would I add more general constraints/inference logic.

This lines up with what you said: **“Inferring the types of the fields of the `DataStructure` before moving on to lowering.”**

#### 4. Defer evaluating `Expr` (option 2) until you really need it

- **Evaluating `Expr` to get a destructured object runtime value** implies:
    - An interpreter or constant-evaluator for expressions.
    - Handling operators, function calls, etc., which is a lot more surface area than you need right now.
- Given your current IR and goals, destructuring can stay **purely syntactic + type-directed**:
    - Desugar to multiple `VariableDeclaration`s.
    - Use compile-time types only.
- Later, if you introduce constant-folding, you can add an “expression evaluator” phase. But that’s orthogonal to making destructuring + type lowering work.

### Concrete “baby-step” roadmap from here

- **A. Add a simple “type environment” pass** over `Program` that:
    - Collects `DataStructure` definitions → `structName -> fieldName -> Lattice`.
    - (Optionally) collects variable types for explicitly typed declarations.
- **B. Extend `lowerDestructuredVarType`** to:
    - Take a type environment (or a lookup function).
    - For `parent.initializer` being an `Identifier`, look up its object type and then the field’s `Lattice`, then `lowerType`.
    - For any unsupported pattern (initializer not an `Identifier` with known object type), throw a clear error for now.
- **C. Write a focused test** that:
    - Declares a `DataStructure` with `ternary` fields and then destructures from a variable of that type.
    - Asserts that the IR has separate variable declarations with `int8_t` and the correct property-access initializers.
- **D. Repeat for `integer`**:
    - First with explicit field types and explicit variable type, then with simple literal-based inference.

If you’d like, I can next sketch a minimal “type environment” interface and how it would thread into your existing `lower` function, staying compatible with your current AST and IR.

---

### Minimal typing pass shape

Here’s a small, focused interface you can grow over time.

**Types**

```ts
// Something like:
import type { Program, Stmt, Expr } from '../parser'
import type { Lattice } from '../stdlib'

export type TypeEnv = Record<string, Lattice>

export interface TypingResult {
    env: TypeEnv
    // Later: errors, warnings, etc.
}
```

**Entry point**

```ts
export function inferTypes(program: Program): TypingResult {
    const env: TypeEnv = {}

    for (const stmt of program.body) {
        inferStmt(stmt, env)
    }

    return { env }
}
```

**Per-statement handling (first baby steps)**

```ts
function inferStmt(stmt: Stmt, env: TypeEnv): void {
    switch (stmt.kind) {
        case 'VariableDeclaration':
            // Step 1: handle explicit annotation only
            if (stmt.valueSet) {
                env[stmt.name] = stmt.valueSet
            }
            // Step 2 (later): if no valueSet, use initializer to infer
            return

        // You can ignore other stmt kinds for the first test
        default:
            return
    }
}
```

For the very first test “variable assigned to another” you don’t even need assignment statements yet if your surface language only has declaration-with-initializer. You can instead use:

```clawr
const x: ternary = ambiguous
const y = x
```

and treat the second line as a declaration whose initializer references `x`.

A minimal **expression helper** (for later) that copies types on identifier use:

```ts
function inferExpr(expr: Expr, env: TypeEnv): Lattice | undefined {
    switch (expr.kind) {
        case 'Identifier':
            return env[expr.name]
        // later: TruthLiteral -> { type: 'ternary', ... } etc.
        default:
            return undefined
    }
}
```

And then for declarations without explicit `valueSet`:

```ts
case 'VariableDeclaration':
    if (stmt.valueSet) {
        env[stmt.name] = stmt.valueSet
    } else {
        const inferred = inferExpr(stmt.initializer, env)
        if (inferred) env[stmt.name] = inferred
    }
    return
```

### Example test for “y gets x’s type”

In a new typing test file, you can directly build an AST and assert on `env`:

```ts
import { describe, it, expect } from 'bun:test'
import type { Program } from '../../src/parser'
import { TruthValue, type Lattice } from '../../src/stdlib'
import { inferTypes } from '../../src/typing' // whatever path you choose

describe('type inference', () => {
    it('propagates the type from x to y', () => {
        const ternaryLattice: Lattice = { type: 'ternary' } // unconstrained

        const program: Program = {
            kind: 'Program',
            file: 'test',
            body: [
                {
                    kind: 'VariableDeclaration',
                    semantics: 'const',
                    name: 'x',
                    valueSet: ternaryLattice,
                    initializer: {
                        kind: 'TruthLiteral',
                        value: TruthValue.ambiguous,
                        line: 1,
                        column: 12,
                    },
                },
                {
                    kind: 'VariableDeclaration',
                    semantics: 'const',
                    name: 'y',
                    valueSet: undefined,
                    initializer: {
                        kind: 'Identifier',
                        name: 'x',
                        line: 2,
                        column: 12,
                    },
                },
            ],
        }

        const { env } = inferTypes(program)

        expect(env.x).toEqual(ternaryLattice)
        expect(env.y).toEqual(ternaryLattice)
    })
})
```

This gives you:

- A concrete `inferTypes(program): { env }` interface.
- A first, very small test that proves you can **track** variables and copy types via `y = x`.
- A natural place to plug in more logic later (data-structure fields, destructuring, integers, etc.).
