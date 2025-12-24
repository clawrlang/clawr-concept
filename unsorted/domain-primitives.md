# Inspirations from Ada

![RAWR|150](../images/rawr.png)
Ada is named for Ada Lovelace, the assistant to Charles Babbage in the design of the [Analytical Engine](https://en.wikipedia.org/wiki/Analytical_engine).

> She was the first to recognise that the machine had applications beyond pure calculation. Ada Lovelace is often considered to be the first computer programmer.
> —<https://en.wikipedia.org/wiki/Ada_Lovelace>

In Ada, you can specify types as ranges.

```ada
type Score is range 0 .. 1_000_000;
```

This feature is perfect for defining [domain primitives](https://software.sawano.se/2017/09/domain-primitives.html). Domain-driven design (DDD) uses [value objects](https://www.milanjovanovic.tech/blog/value-objects-in-dotnet-ddd-fundamentals) for two main purposes: on the one hand it allows for consistent computations, and on the other is supports fail-fast validation, and security by design. *Domain primitives* is another term for the latter.

In Clawr, domain primitives can be created using a syntax that is inspired by Ada’s ranged types:

```clawr
domain EntityId = string @matching(/^a-z0-9$/g) @maxlength(256)
domain Version = integer @range(0..2^32-1) // This fits in 32 bits
```

Or, equivalently:

```clawr
// Not types -- just aliases to reduce typing:
typealias EntityIdConstraint = string @matching(/^a-z0-9$/g) @maxlength(256)
typealias Versionrange = integer @range(0..2^32-1) // This fits in 32 bits

// Types -- with type checking:
domain EntityId = EntityIdConstraint
domain Version = VersionRange
```

Constraints make the compiler automatically inject range checking as necessary so that you do not need to worry about the implementation details. It the value is known to have a constraint that places it in a subset to the required constraint, no type-checking is needed. If the constraint is a range and the value is known to match one of its limits, it is only necessary to check the other limit.

A `domain` type is a strict type, however. It is a very ergonomic declaration and in runtime, it is probably just the internal value without adornment. But two domain types with the same definition can still not allow mutual assignment without explicit conversion.

**`domain` creates a new type.**

These are two different types:

```clawr
domain EntityId = string @matching(/^a-z0-9$/g) @maxlength(256)
domain EntityType = string @matching(/^a-z0-9$/g) @maxlength(256)

let x: EntityId = ...
let y: EntityName = x // Compile-time error - different types
```

**`typealias` does not create a type.**

These ara two aliases for the same constraint:

```clawr
typealias EntityId = string @matching(/^a-z0-9$/g) @maxlength(256)
typealias EntityType = string @matching(/^a-z0-9$/g) @maxlength(256)

let x: EntityId = ...
let y: EntityName = x // Allowed - same type (`string`)
```

The above is equivalent to:

```clawr
let x: string @matching(/^a-z0-9$/g) @maxlength(256) = ...
let y: string @matching(/^a-z0-9$/g) @maxlength(256) = x
```

## Implicit Types

```clawr
let x = 5
```

The initial value (5) is of a highly constrained type (`integer @value(5)`). This is not a type you would typically assign a variable, but in this case the variable is defined as immutable (`let`) and can be implicitly typed. Therefore it *does* have that type.

Maybe this type-system (with implicit typing) can be used to afford Haskell-like optimisation too?

```clawr
let x = 5 // integer @value(5)
let y = x * 3 // integer @value(15)
```

This could replace any reference to `x` with let numeric value 5 and any reference to `y` with the value 15.

## Future Directions

Support provably subset regex types:

```clawr
type Lowercase = string @matching(/^[a-z]+$/)
type Alphanumeric = string @matching(/^[a-z0-9]+$/)

let lower: Lowercase = "abc"
let alpha: Alphanumeric = lower  // Could prove this is safe (lowercase ⊂ alphanumeric)
```

Regex subset relationships can get complex quickly. This might not be possible, or might be very hard to maintain. Therefore it is not scheduled for v1, but a potential future direction.
