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

let routeData: [LogInfo] = [
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
    let cents: integer
}

// A companion object defines “static” members and methods.
// It has full access to the internal data of the main object type.

companion Money {
    let zero: Money = { cents: 0 }

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
