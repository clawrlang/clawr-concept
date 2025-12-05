# Objects vs. Data Structures

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

An `object` is a *meaningful* entity that hides a `data` structure in its bowels. The `object` exposes interaction points (methods) that hide the specific implementation from dependent code. A `factory` method (and any other method) on the `object` has full access to the hidden `data`.

```clawr
// “An Object is a set of functions that operate upon implied data elements.”

object Money {

    func dollars() => self.cents / 100
    func cents() => self.cents % 100

static:
    let zero: Money = { cents: 0 }

factory:
    func cents(_ c: integer) => { cents: c }
    func dollars(_ d: integer, cents: integer = 0) => {
        cents: d * 100 + cents
    }
    func amount(_ a: real) => {
	    cents: integer(Math.round(a * 100)
	}

data:
    let cents: integer
}
```

I have not considered visibility modifiers. All methods are public and all fields internal to the `object` according to the current conception. An early idea, however, was to support header files. A published header file could declare “public” APIs, while a private header could declare “package-internal” code. Code that is “private” would only be declared in the implementation-file.

Headers are, however, rather complex to use. That might be the main problem with this idea.
