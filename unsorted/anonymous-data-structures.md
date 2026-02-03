# Anonymous `data` Structures to Replace Tuples

> [!question] AI Prompt
> Wild idea: No tuples.
>
> Maybe Clawr should not have tuples? Maybe they should be `data` types instead?
>
> So instead of `const x = (1, "a")`, we'd write `const x = { i: 1, s: a }`. So that all positions are named.
>
> How would that affect pattern-matching? I think Javascript allows deconstructing/decomposing objects using `const { i, s }  = x`, right?

This is a fascinating design decision! Let me think through the implications.

## The Appeal of Named-Only Fields

Your intuition aligns well with Clawr's overall philosophy. The language emphasizes **clarity and explicit intent**—the `const`/`mut`/`ref` distinction makes semantics visible, and the object/data separation makes encapsulation explicit. Removing positional tuples would extend this principle to data structure access.

### Benefits

**1. Self-documenting code**

```clawr
// With tuples - what do these positions mean?
const result = (200, "OK", 1024)
const (status, message, size) = result

// Without tuples - immediately clear
const result = { status: 200, message: "OK", size: 1024 }
const { status, message, size } = result
```

**2. Robust refactoring** Adding a field to a tuple breaks every pattern match that relies on position. With named fields, you can add fields without breaking existing destructuring patterns (assuming they only extract the fields they need).

**3. Consistent with data philosophy** Clawr already distinguishes between `data` (transparent structure) and `object` (encapsulated behavior). Tuples are essentially anonymous `data` types—why not make them explicit?

**4. Better error messages**

```clawr
// Tuple: "Expected 3 elements, got 2"
// Named: "Missing required field 'size'"
```

### Tradeoffs

**1. Verbosity for simple cases**

```clawr
// Tuple: quick and dirty
func divmod(a: integer, b: integer) -> (integer, integer) {
    return (a / b, a % b)
}

// Named: more explicit, but heavier
func divmod(a: integer, b: integer) -> { quotient: integer, remainder: integer } {
    return { quotient: a / b, remainder: a / b }
}
```

**2. Function returns need type definitions** You'd likely want to define return types:

```clawr
data DivModResult {
    quotient: integer
    remainder: integer
}

func divmod(a: integer, b: integer) -> DivModResult { ... }
```

This is more verbose, but arguably **better for API clarity**.

**3. Pattern matching becomes wordier**

```clawr
// Tuple-style (hypothetical)
match point {
    (0, 0) => "origin"
    (x, 0) => "on x-axis"
    (0, y) => "on y-axis"
    (x, y) => "in plane"
}

// Named-field style
match point {
    { x: 0, y: 0 } => "origin"
    { x: x, y: 0 } => "on x-axis"
    { x: 0, y: y } => "on y-axis"
    { x: x, y: y } => "in plane"
}
```

JavaScript-style shorthand could help: `{ x, y }` instead of `{ x: x, y: y }`.

## My Take

**Go for it.** This aligns beautifully with Clawr's design principles:

1. **Explicit over implicit**: Named fields make intent clear
2. **Type-driven design**: Encourages defining proper `data` types even for simple structures
3. **Refactoring safety**: Named destructuring is more resilient to changes
4. **Learning curve**: One less concept to learn (no tuple vs. struct distinction)

The verbosity concern is real but manageable with:

- Lightweight `data` type syntax
- Destructuring shorthands (`const { x, y } = point`)
- Type inference for anonymous data literals

## Implementation Notes

You'd probably want:

```clawr
// Anonymous data literal
const point = { x: 10, y: 20 }

// Type inference for function returns
func getCoords() -> { x: integer, y: integer } {
    return { x: 10, y: 20 }
}

// Or named types for clarity
data Point { x: integer, y: integer }
func getCoords() -> Point { ... }

// Destructuring with pattern matching
const { x, y } = point  // Shorthand
const { x: xCoord, y: yCoord } = point  // Rename on extract
```

This keeps the syntax lightweight while maintaining the named-field philosophy.

What do you think? Does this feel right for Clawr's goals?

> [!question] AI Prompt
> > 1. Verbosity for simple cases
>
> The given example can be made much more concise using inferred return.
>
> ```
> func divmod(a: integer, b: integer) =>
>     { quotient: a / b, remainder: a / b }
> ```
>
> > 3. Pattern matching becomes wordier
>
> Maybe it can be made concise by elision?
>
> ```
> // Named-field style
> match point {
>     { x: 0, y: 0 } => "origin"
>     { y: 0 } => "on x-axis"
>     { x: 0 } => "on y-axis"
>     {} => "in plane"
> }
> ```

Excellent refinements! Both of these make the "no tuples" approach much more compelling.

## Concise Return Syntax

```clawr
func divmod(a: integer, b: integer) =>
    { quotient: a / b, remainder: a % b }
```

This is barely longer than a tuple version would be, and **far more readable**. The `=>` expression body syntax is doing a lot of work here. Beautiful.

## Pattern Matching with Elision

Your elision approach is clever and aligns with how pattern matching works in many languages:

```clawr
match point {
    { x: 0, y: 0 } => "origin"
    { y: 0 } => "on x-axis"      // x can be anything
    { x: 0 } => "on y-axis"      // y can be anything
    {} => "in plane"             // both can be anything
}
```

This is **more expressive** than tuple matching because you can ignore fields by name rather than position. Compare:

```clawr
// With positional tuples (hypothetical)
match triple {
    (0, _, 0) => "first and third are zero"
    (_, 0, _) => "middle is zero"
}

// With named fields + elision
match triple {
    { first: 0, third: 0 } => "first and third are zero"
    { middle: 0 } => "middle is zero"
}
```

The named version is **clearer about what's being ignored** and **more resilient to reordering**.

## Additional Pattern Matching Considerations

You might want to support binding unmentioned fields:

```clawr
match point {
    { x: 0, y: 0 } => "origin"
    { x: 0, y } => "on y-axis at ${y}"  // Bind y, ignore fact that x is anything
    { x, y: 0 } => "on x-axis at ${x}"  // Bind x, ignore fact that y is anything
    { x, y } => "at (${x}, ${y})"       // Bind both
}
```

And wildcards for explicit "don't care":

```clawr
match data {
    { status: 200, body } => handleSuccess(body)
    { status: _, error } => handleError(error)  // Explicit: status doesn't matter
}
```

## Verdict

With these syntactic refinements:

- ✅ Returns are concise with `=>`
- ✅ Pattern matching is clear with elision
- ✅ Named fields make intent explicit
- ✅ Refactoring is safer (adding fields doesn't break existing matches)

The "no tuples" decision looks even stronger now. The verbosity concerns evaporate with good syntax design, and you gain clarity and safety in return.

This feels like a coherent design choice that reinforces Clawr's philosophy: **make the structure and intent of your data explicit, with syntax that doesn't get in the way**.
