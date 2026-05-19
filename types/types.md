# Primitive Types in Clawr

![RAWR|150](../images/rawry.png)
Every language needs primitive types. Here is a proposed set for Clawr:

- `integer`: an arbitrarily sized integer value.
- `real`: a floating-point value of unspecified precision.
- `decimal`: a base-10 floating-point value of unspecified precision.
- `boolean`: a value of `true` or `false`
- `ternary`: an truth-value with three states (`negative`, `unset` and `positive`)
- `character`: this could be simple as in C or more complex as in Swift
- `string`: a fixed list or sequence of characters
- `regex`: a regular expression/pattern for string matching
- `error`: a type for indicating issues at runtime
- *lambda*: a callable function with a specific signature
- *tuple*: a list of values of varying (but specific) types
- *array*: ordered collection with fixed size (`[T]` / `Array<T>`)

These are foundational types that can be aggregated into `data` structures and other [user-defined types](./user-types.md).

## Ternary Mode

Clawr should support ternary architectures whenever they become mainstream. It is reasonable to expect that balanced ternary could take over the baton from binary in the future. In practical terms this is probably a very distant future as there is so much existing infrastructure that will need to be replaced, but being prepared is never a mistake. And actually being able to utilise ternary—albeit on a small scale—in the near future could spell competitive advantage.

A 64 bit `integer`could be translated to a 54 trit ternary without loss (as $3^{54} \gg 2^{64}$). For numeric values, the width of a register is not all that important; it is the range of representable values that matters. A similar case can be made for floating-point numbers.

There is a proposed standard called [ternary27](https://cdn.hackaday.io/files/1649077055381088/Ternary27%20Standard.pdf). It is based on IEEE 754, but adapted to ternary, and might be a good fit for `real` types on ternary hardware. It does however only use 27 trits and does not have the range nor precision of 64 bit binary. To match IEEE 754 “double precision” we will need 54 trits. That is not covered by the documentation I found, but its model can probably be extended.

The `character` type (and by extension `string`) is probably less forward compatible. I suppose ASCII and ISO 8859-1 could be represented by converting the numeric value from base 2 to base 3. But UTF-8 will be a bit more awkward.

> [!note]
> It is not necessary to make a final decision regarding a ternary runtime before starting implementation work on Clawr. It is, however, good to have a rough plan regarding how ternary fits with the syntax and semantics.

### Compatibility

All ternary types should behave as their binary equivalents when not explicitly taking advantage of the ternary range.

Numbers are just numbers. Their representation uses balanced ternary instead of binary, and they will have larger capacity in ternary mode, but syntactically there will be no difference.

A `ternary` can replace a `boolean` in `if` statements and `while` loops. The `up` value counts as `true` and the `down` value as `false`. The `else` branch will be executed for two states.

```clawr
if ternaryValue { print("Value is positive/true") }
else { print("Value is either false/negative or unknown/zero")}

if !ternaryValue { print("Value is negative/false") }
else { print("Value is either true/positive or unknown/zero")}
```

## Arbitrary Precision

### Integers

Clawr uses arbitrarily-sized integers by default, eliminating overflow errors and removing the need for separate int8, int16, int32, int64 types. The compiler optimises storage based on proven value ranges or explicit annotations:

```clawr
count: integer  // Grows as needed
age: integer @range(0..150)  // Compiler uses appropriate fixed size
```

If the value is known to fit in 64 bits or less (or 256 bits or less?) the compiler can output optimised code for that datatype instead of the slower arbitrary-size implementation.

### Floating-Point

The `real` type supports specific precisions (single, double, quadruple, octuple) following IEEE 754, with double precision as the default. For applications requiring arbitrary decimal precision, use the `decimal` type instead.

In ternary mode, `real` precisions are mapped to balanced ternary floating-point representations that meet or exceed the corresponding IEEE 754 binary precision. For example, a `real` with 54 trits can provide greater range and precision than the 64 bit double precision of IEEE 754.

---
---
# User-Defined Types

There are several classes of user-defined types:

- A `data` structure is a simple aggregate of related information.
- An `object` is an encapsulated (hidden) `data` structure with behaviour-first design.
- A `trait` is an an abstract interface that may be implemented by `data` oriented types.
- A `service` is an object whose state is defined by the system, not (or not primarily) by a `data` structure.
- A `role` is a capability that a `service` may embody.
- An `enum` is a list of available values a type allows.
- A `union` type can have values that are structured in multiple ways.

---
---
# User-Defined Type Constraints `object` vs `data`

Clawr does not have value-type vs reference-type distinctions like some other languages. Instead, it enforces consistent encapsulation rules based on whether a type is defined as an `object` or a `data` structure.

## Objects vs. Data Structures

In Domain-Driven Design (DDD), the term "anaemic" (derived from the medical condition of low red blood cell count) is used to highlight the problems of exposing data directly to manipulation. An anaemic model requires validation before it can be persisted, as the volume of code that modifies it cannot be fully trusted to be free of bugs. Without encapsulation, there is a risk that the data will become inconsistent or that business logic will be scattered and hard to maintain, leading to fragile systems.

A "rich model," in contrast, uses encapsulation to ensure that its state remains valid. By embedding the business rules within the model itself, the need for external validation is removed, and the model can evolve without breaking its internal logic. This approach also clarifies the application's intent and the goals of its users, as the rules are encapsulated in a more intuitive and predictable manner.

Encapsulation offers another advantage: loose coupling. Loose coupling reduces dependencies between components, allowing changes in one part of the system to have minimal impact on other parts. By hiding the internal state of an object and exposing only the methods that interact with it, you not only protect its state from direct manipulation, reducing the risk of shared mutable state. You also improve flexibility in terms of implementation details.

Robert C. Martin (Uncle Bob) succinctly captures the distinction between objects and data structures:

> - An Object is a set of functions that operate upon implied data elements.
> - A Data Structure is a set of data elements operated upon by implied functions.
>
> — <https://blog.cleancoder.com/uncle-bob/2019/06/16/ObjectsAndDataStructures.html>

The key takeaway here is that an object’s state is hidden away (“implied”), instead only exposing “functions” for interaction. The data structure, conversely, exposes data-elements, “implying” that they have some use, but says nothing about what that usage amounts to.

### In Clawr

Clawr borrows Uncle Bob’s terminology in the keywords `object` and `data`. A `data` type defines structure for direct interaction with data elements.

```clawr
// “A Data Structure is a set of data elements operated upon by implied functions.”

data LogInfo {
  position: { latitude: real, longitude: real }
  velocity: { heading: real, speed: real }
}

const routeData: [LogInfo] = [
  {
    position: {latitude: 10.1, longitude: 12.2},
    velocity: {heading: 120.0, speed: 98.5}
  }, ...
]
```

An `object` is a *meaningful* entity that hides a `data` structure in its bowels. The `object` exposes interaction points (methods) that hide the specific implementation from dependent code. A `companion` object defined in the same module has full access to the hidden `data`.

```clawr
// “An Object is a set of functions that operate upon implied data elements.”

object Money {

    func dollars() => self.cents / 100
    func cents() => self.cents % 100

data:
    const cents: integer
}

// A companion object defines “static” members and methods.
// It has full access to the internal data of the main object type.

companion Money {
    const zero: Money = { cents: 0 }

    func cents(_ c: integer) => { cents: c }
    func dollars(_ d: integer, cents: integer = 0) => {
        cents: d * 100 + cents
    }
    func amount(_ a: real) => {
        cents: integer(Math.round(a * 100))
    }
}
```

## The `service` Type

An `object` is just an encapsulated `data` structure. In some cases, however, we might want to access and modify system-wide data such as on-device sensors, a database or the Internet. This is where the `service` type comes in.

A `service` is similar to an `object`. It is defined by its interface and its behavioural capabilities, not by its composition. While it can (and probably will) have an internal `data` structure to perhaps maintain a cache or other state information, its main source of data comes from external resources far away from its own memory address.

```clawr
service UserRepository {
    func getUser(id: integer) -> User {
        // Fetch user from database or external subsystem
    }

mutating:
    func updateUser(_ user: User) {
        // Update user in database or external subsystem
    }
}
```

A `service` type can only use `SHARED` semantics. Variables must always be declared as `ref`.
As it’s data is defined externally, making isolated copies of it’s memory will only cause weird behaviour.

## Visibility and Headers

An early idea was to support header files. A published header file could declare “public” APIs, while a private header could declare “package-internal” code. Code that is “private” would only be declared in the implementation-file.

Headers are, however, rather complex to use. That might be the main problem with this idea.

My current idea is to use a `helper` keyword:

- All `object` and `service` fields are hidden and all `data` fields are public. That cannot change.
- All methods of an object are public unless marked `helper`. A `helper` method can only be used by other methods of the same `object` (or by factories defined in the same module).
- Free functions are publicly available. If marked `helper` they cannot be accessed outside their package/target.
- Types are publicly available. If marked `helper` they cannot be accessed outside their package/target.

## Proof of Concept

There are a few proof of concept compilers for Clawr, demonstrating syntax and exploring runtime implementations.

- <https://github.com/clawrlang/clawr-poc> — Early exploration into syntax *and* runtime
- <https://github.com/clawrlang/clawr-swift-parsing> — Focus on syntax, not runtime
- <https://github.com/clawrlang/clawr-runtime> — Focus on runtime, not syntax

They also demonstrate the other big language idea of Clawr: a [variable-driven semantics model](../semantics/variable-scope.md).

---
---
# Service Types

A `service` is an `object` with special privileges. A simple `object` is an encapsulation of data. A `service` has access to system resources. It can produce side effects outside its allocated data. For example:

- File I/O operations
- Network requests
- Database connections
- System clock access
- Random number generation
- Logging/console output

Unlike an `object` or exposed `data` structure that exists to aggregate and manipulate specific information, the purpose of a `service` is to provide functionality such as persistence, networking and infrastructure.

To reinforce the conceptual difference, contractual types for services are segregated from contract types for `object`/`data` types. They use different terminology (even if they are implemented exactly the same way in the runtime).

A data-oriented structure conforms to `traits`, inherent characteristics that define how its fields can be read, modified and converted. A `service` takes on a `role`, a competence guarantee defining a set of tasks it is capable of performing.

| **Type Class**                    | **Conformance** | **Conceptual Semantics**  |
| --------------------------------- | --------------- | ------------------------- |
| `object`, `data`, `enum`, `union` | `trait`         | Inherent Characteristics  |
| `service`                         | `role`          | Functional Responsibility |

There is no significant runtime difference between an `object` and a `service` (nor a `data` structure for that matter). Nor is there any runtime difference between a `trait` and a `role`. Their differences are entirely conceptual (apart from privileges—which are enforced at compile-time).

## Restrictions

An `object` can be assigned to `const`, `mut` or `ref` variables as needed. It excels at maintaining isolation constraints using copy-on-write. A `service`, on the other hand, can only ever be *referenced*.

A `service` is an *entity*, not a *variable*. It is an *agent*, not a *data container.* It represents a system resource, not its own identity, and certainly not a “value.” Therefore, it is meaningless to copy-on-write a `service`. It is incoherent to refer to a `service` as immutable. A `service` variable can only be defined as `ref`. Its *configuration* might be immutable; it might reference copy-on-write *fields*. But the `service` itself must always apply reference semantics.

Additionally:

- `object` and `data` types cannot (or at least should not) contain `service` fields,
- `service` types can reference other services via `ref` fields.

```clawr
// Compiler error examples:
object Student {
data:
    ref logger: Logger  // ❌ Error: objects cannot reference services
}

service DatabaseService {
data:
    ref logger: Logger  // ✓ OK: services can reference other services
}
```

This ensures clear separation: domain objects remain pure data, while services handle infrastructure concerns.

## Dispose Method

Services will often need cleanup, e.g. closing a file handle. When a `service` is descoped (its last variable reference is released) it will call a `destruct()` or `deinit()` method to dispose of resources it alone has depended upon.

---
---
# Traits and Roles

> *What is the difference between a `trait` and a `role`? They both seem to do the same thing. Aren’t they both interfaces?*
> — Frequently asked question

Technically, syntactically, and maybe even semantically, traits and roles are indeed the same thing. The runtime implementation is actually identical.

The difference is conceptual. A `trait` hides irrelevant data and emphasises essential information; a `role` signals a capability.

- `role` applies to `service` types.
- `trait` applies to `data` and `object` types.

Because a `service` is a tool that does not apply copy-on-write, it must always be referenced by `ref` variables, `ref` parameters and `ref` return values. And because a `role` an only apply to `service` entities, the same rule applies to it.

A `trait` is a model type. Just like both `object` and `data`, it can apply to variables of *any* semantics `const`, `mut` and `ref` as needed. It can also be returned as a *uniquely referenced return value* and assigned semantics by the caller.

Example roles include:

- Manager types (like a `UserAccessManager`)
- Repositories (`FriendsGraph`)
- Message sending capability (`SMSSender`, `EmailService`…)
- Strategy pattern

> Actually… a `role` *is* maybe a *Strategy* by definition. Maybe the keyword should be `strategy` instead of `role`?

No. a `role` is a capability. A `strategy` is an algorithmic variation. A `FriendsGraph` is not a strategy.

Example traits include:

- `StringRepresentable` (can be “`toString()`-ed”)
- `Arithmetic` (can be used in arithmetics operations)
- `Entity` (has state that can be persisted and reconstituted as data)
- `Serializable` (as JSON, YAML…)
- `Hashable`
- `Categorised`
