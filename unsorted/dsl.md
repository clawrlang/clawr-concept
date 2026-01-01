# Early Musings about DSL Meta-programming

> [!question] AI Prompt
> How do builders work? I have this code:
>
> ```swift
> @resultBuilder
> enum StatementOneOfBuilder {
>     static func buildBlock(_ parts: any StatementStartDetectable...) -> [any StatementStartDetectable] {
>         parts
>     }
> }
> ```
>
> This looks like a do-nothing function. It should be possible to replace it with the input.
>
> It is used like this:
>
> ```swift
> struct StatementOneOf: Parser {
>
>     let parsers: [any StatementStartDetectable]
>
>     init(@StatementOneOfBuilder _ build: () -> [any StatementStartDetectable]) {
>         self.parsers = build()
 >    }
>     // ...
> }
>```

> [!question] AI Prompt
> Is the builder syntax complicated? It looks lika a usual function/lambda, but it does something else. Could a different syntax make it more understandable?

Yes—result builder syntax is _intentionally deceptive_. It looks like a normal closure, but it is **not** one. Swift chose familiarity over explicitness. A different syntax _would_ be clearer, but it would be noisier and less ergonomic.

> [!question] AI Prompt
> I actually don't think it *should* be about what it does at runtime. I say “solve the problem; don't build a solution.” It should be about communicating the problem-space first and the solution space second (if at all).
>
> Having said that, I accept that there is value in knowing some things about the solution space. If you cannot trust the implementation (because someone else built it) you may need to implement it yourself. But the main concern should be “does it solve the problem?” And “what problem is it solving?”
>
> In the case of the function that just returns the argument and adds scaffolding in order to structurally “be” a `resultBuilder`, there is very little conceptual meaning in that scaffolding. It doesn't really add any information. It should be possible to just write something like `init(@GenericResultBuilder<StatementStartDetectable>)` or `init(@resultBuilder _ build: () -> [any StatementStartDetectable]) { self.parsers = build() }` or whatever. The `StatementOneOfBuilder` feels redundant.

You’re touching the *real* design tension behind result builders, and your instinct is basically right:

> **The builder type often does not represent a concept in the problem space.
> It exists only to satisfy the compiler’s transformation rules.**

That’s not accidental—but it *is* a compromise.

Let me separate this into **what problem result builders are actually solving**, **why the named builder exists**, and **why your proposed alternatives weren’t chosen**.

---

## 1. What problem result builders are *actually* solving

Result builders do **not** primarily solve a runtime problem.

They solve a **language problem**:

> *How do we allow a block of syntax to describe a structured value without introducing new syntax to the language?*

That’s it.

They are:

* A **syntax-to-AST transformation mechanism**
* With type-directed rewriting
* That preserves Swift’s existing grammar

So the “problem space” is not:

> “How do I collect these parsers?”

It is:

> “How do I let the user *write a declarative description* using ordinary Swift expressions?”

From that perspective, the runtime behavior is secondary.

---

## 2. Why the builder type exists at all

You are correct that this:

```swift
static func buildBlock(_ parts: T...) -> [T] { parts }
```

carries **no domain meaning**.

But the builder type is not there to express domain meaning.
It exists to answer *compile-time questions*:

### The compiler needs to know:

1. **What types are allowed as expressions?**
2. **How are multiple expressions combined?**
3. **What happens with `if`, `else`, `for`, `#available`, etc.?**
4. **What is the final result type?**

Those answers live on a *type*, not a function.

Even if your builder only implements `buildBlock`, the compiler still needs a **namespace** to look in.

---

## 3. Why a “generic” or anonymous builder doesn’t exist

You proposed:

```swift
init(@GenericResultBuilder<StatementStartDetectable> _ build: () -> [any StatementStartDetectable])
```

or

```swift
init(@resultBuilder _ build: () -> [any StatementStartDetectable])
```

Conceptually: **yes, that’s enough information**.

But here’s why Swift doesn’t allow it.

---

### A. Result builders are not parameterized only by element type

Two builders that both return `[T]` can behave *very differently*:

```swift
@resultBuilder
struct ArrayBuilder<T> { ... }

@resultBuilder
struct FlatteningBuilder<T> { ... }

@resultBuilder
struct OptionalSkippingBuilder<T> { ... }
```

All could return `[T]`, but:

* One may flatten
* One may drop nils
* One may reject control flow

So the *behavioral contract* is tied to the builder type, not the return type.

---

### B. Builders define **syntax affordances**, not just output shape

Whether this is allowed:

```swift
{
    if condition {
        ParserA()
    }
}
```

depends on whether the builder defines:

```swift
buildOptional(_:)
```

That cannot be inferred from `[T]`.

---

### C. Swift avoids “structural magic”

Swift generally avoids saying:

> “If a type happens to have these methods, treat it specially.”

Instead it prefers:

* Nominal types
* Explicit attributes
* Predictable lookup rules

So the explicit `StatementOneOfBuilder` is the *anchor* for that magic.

---

## 4. Why the redundancy still feels wrong (and you’re right)

You are absolutely correct that in cases like yours:

```swift
static func buildBlock(_ parts: T...) -> [T] { parts }
```

The builder adds:

* No semantics
* No constraints
* No insight into the domain

It is **pure scaffolding**.

This is the cost of:

* Reusing existing syntax
* Avoiding new grammar
* Keeping result builders general-purpose

Swift chose *uniformity* over *conceptual purity*.

---

## 5. What Swift *could* have done (but didn’t)

There are designs that would better match your “communicate the problem” principle.

### Option 1: Built-in collection builder

```swift
init(@collection(of: StatementStartDetectable) build: () -> [StatementStartDetectable])
```

✔ Problem-space aligned
✔ No boilerplate
❌ Special-case language feature

---

### Option 2: Inline builder declaration

```swift
init(
  @resultBuilder(
    buildBlock: { (parts: StatementStartDetectable...) in parts }
  )
  build: () -> [StatementStartDetectable]
)
```

✔ Zero named type
❌ Complex grammar
❌ Hard to type-check

---

### Option 3: Anonymous builder types

```swift
init(
  @resultBuilder(type: [StatementStartDetectable])
  build: () -> [StatementStartDetectable]
)
```

✔ Conceptually clean
❌ Massive compiler complexity
❌ Less extensible

Swift deliberately avoided all of these.

---

## 6. The honest truth

Result builders are **not modeling your domain**.

They are modeling **how the compiler should reinterpret a block of code**.

That’s why:

* The builder type often feels fake
* The methods feel ceremonial
* The semantics live in the compiler, not the code

Your discomfort is justified.

---

## 7. The best mental framing (aligned with your view)

Think of this:

```swift
@StatementOneOfBuilder
```

not as:

> “Use this builder”

but as:

> “Interpret the following block using *this grammar*”

The builder type is effectively a **grammar descriptor**, not a function or object.

---

## Final answer to your core claim

> *“The `StatementOneOfBuilder` feels redundant.”*

Yes.
It is redundant **for your domain**.
It is required **for the compiler**.

Swift chose:

> *Explicit compiler hooks over implicit semantic inference.*

That makes builders powerful—but often conceptually empty.

> [!question] AI Prompt
> So, if I want to create a DSL syntax for my own language, Clawr, I can choose a different strategy \[than Swift result-builders\].

Yes — **exactly**.
And this is the key conclusion your line of thinking leads to.

If you’re designing **Clawr**, you are *not* constrained by Swift’s historical trade-offs. You can design the DSL mechanism to communicate the **problem space first**, instead of retrofitting semantics onto existing syntax.

Let’s make this concrete.

---

## TL;DR

Swift result builders solve *“how do we reuse Swift syntax?”*
Clawr can solve *“how do we express intent?”*

That gives you better options.

---

## 1. What Swift optimized for (and why you don’t have to)

Swift’s constraints:

* No new grammar
* Backwards compatibility
* Nominal typing everywhere
* One feature must serve many domains (UI, parsing, testing)

> [!quote] Editor Comment
> “No new grammar” feels like a poorly chosen requirement. A result builder is *by definition* new syntax; to require reusing existing syntactic grammar for new syntax is a recipe for disaster.

Result builders are the compromise.

Clawr has none of these constraints.

So you can design:

* **Explicit intent**
* **Domain-aware syntax**
* **Clear separation of description vs execution**

---

## 2. First principle for Clawr DSLs

You already stated it:

> **Describe the problem, not the mechanism.**

So your DSL feature should answer:

* What *kind* of structure is being described?
* What rules apply?
* What transformations happen (if any)?

Not:

* Which helper type exists
* Which magic function names are present

---

## 3. Better DSL strategies Clawr can use

Here are *cleaner* alternatives than Swift-style builders.

---

### A. Explicit “grammar blocks” (recommended)

```clawr
statement oneOf {
    parserA
    parserB
    parserC
}
```

Semantics:

* `oneOf` declares *structure*
* The block declares *members*
* No confusion with runtime functions

Internally:

* The block builds an AST node
* Execution is a separate phase

This mirrors:

* Parsing Expression Grammars
* Prolog rules
* Rust macros (conceptually)

---

### B. Typed block declarations

```clawr
oneOf<StatementStartDetectable> {
    ParserA
    ParserB
}
```

✔ Problem space is explicit
✔ No hidden rewrite rules
✔ No scaffolding types

---

### C. Declarative lists with control flow made explicit

```clawr
oneOf {
    include ParserA
    include ParserB if enabled
}
```

Instead of pretending `if` is normal control flow, you encode it as **domain logic**.

---

### D. First-class DSL nodes (AST-first)

```clawr
oneOf [
    parserA,
    parserB,
    parserC
]
```

* No execution
* No side effects
* Always declarative

This aligns perfectly with your philosophy.

---

## 4. The crucial design win Clawr can have

Swift builders mix **three phases**:

1. Description
2. Transformation
3. Execution

This is why they’re confusing.

In Clawr, you can separate them:

```
Syntax  →  AST  →  Validation  →  Execution
```

So a DSL block is:

* *Never executed*
* Only interpreted

This avoids *all* the mental model issues of result builders.

---

## 5. What Swift builders are secretly doing (and hiding)

Swift result builders:

* Pretend to be closures
* But act like AST collectors
* With partial evaluation
* And restricted semantics

Clawr doesn’t need that disguise.

You can say:

> “This block is declarative.”

And mean it.

---

## 6. A direct answer to your conclusion

> *“So, if I want to create a DSL syntax for my own language, Clawr, I can choose a different strategy.”*

Yes — and you **should**.

You can:

* Make DSL blocks *non-executable*
* Encode domain rules directly in syntax
* Eliminate meaningless scaffolding
* Avoid conflating problem description with implementation hooks

Swift couldn’t do that without breaking itself.

Clawr can.

---

## 7. If you want next steps

We can:

* **a.** Design a minimal grammar for Clawr DSL blocks (AST-first)
* **b.** Compare macro-based DSLs vs grammar-level DSLs for Clawr

Both would align perfectly with your “solve the problem” principle.
