# Semantics Decided per Variable

In C# and Swift, the keywords `struct` and `class` define the behaviour when assigning variables to each other. A `struct` is copied structurally (either immediately or at the next mutation), while a `class` instance is shared between variables. All variables of `struct` type employ copy semantics and all `class` variables are implicitly referential. This is unknown to the reader of the code unless they look up each type.

There are three semantic modes for variables: immutable values, mutable state (in isolation) and shared mutable state. Immutable values cannot cause much confusion as they can never change. Mutable state adds some small level of complexity as the state can change unexpectedly, though that is unlikely if the state is isolated to a small scope. Shared mutable state is the most likely culprit for surprising state changes.

> Aside: The Swift community uses terms like value semantics and reference semantics to refer to the different kinds of mutable types. In other contexts, values are generally considered immutable, though, so the term “value semantics” actually makes no sense. Hence the terminology will not be adopted here. I have elected to use the term “copy semantics” instead,

The semantic mode is decided by the types. That is unfortunate. I want it to be decided on a per-variable basis. That offers the highest granularity as well as clarity:

```azlan
let origin = 3DPoint(x: 0, y: 0, z: 0) // immutable value

mut mutablePoint = origin // a mutable copy of the `origin`
mutablePoint.x = 100 // changes the state of this variable without affecting `origin`

mut otherMutable = mutablePoint // copy of `mutablePoint`
otherMutable.y = 42 // (100, 42, 0) - but mutablePoint is still (100, 0, 0)

ref referencedPoint = mutablepoint // (100, 0, 0) another copy, but one that can be referenced through other variables.
ref otherReference = referencedPoint // these point to the same entity
```

In the above code, the `origin` is immutable (`let` keyword). This is equivalent to a `let` variable with a `struct` type in Swift. No matter what the code does it can never change `origin` from the value it was initially assigned (except to descope the variable). This immutability applies to the entire structure of `origin`. Immutable variables must always be assigned a value as part of their declaration or shortly thereafter.

The variable `mutablePoint` is defined using the `mut` keyword (short for “mutable”). This is equivalent to a `var` / `struct` combination in Swift. The structural content of the variable can be changed but the structural content isn't shared with other variables. Assigning `mutablePoint` to `otherMutable` creates a copy of the structure with the state it has at the time. That state can be mutated afterwards but altering one copy does not affect the other.

The `ref` variables both refer to  the same `3DPoint` instance; the same memory area. “Ref,” being short for “referential,” means that shared mutable state is in play; extra care must be taken when modifying this state. Modifying the state of either variable immediately changes the state of the other one too. They are not two separate things, they are two different names for/pointers to a single thing. This is equivalent to a `class` type variable in Swift.

Maybe the compiler (or IDEs) should warn when adding `ref` variables? “Are you really sure you want shared mutable state? This is dangerous.” A comment might be added to turn off the warning. That indicates that you probably understand the warning and choose to use it anyway.

> [!question] Possibly Silly Idea
> Would there be cause to define a mutable object that cannot be reassigned? A sort of `let ref` or `ref let`?
>
> Maybe with `services`, but probably not with `object` or `struct` type variables. And with `service` `ref` is always the case, and it might be ok to make it implicit with a solo `let`.
>
> It feels wrong to use `let` for anything that is not immutable. Maybe a `ref` variable should never be reassigned anyway? Maybe it should trigger a compiler warning if it is.

> [!question] Possibly Silly Idea
> Maybe `object` and `struct` type variables shouldn’t be able to use `ref`? If you need a globally referenced object, you must use a `service` instead.
> 
> This might be stupid, because what about DDD entities?

> [!question] Not Too Wild Idea
> Maybe it should be illegal to assign a `mut` or `let` variable to a `ref` and vice versa? On the other hand it might be useful to be able to create a prototype value that is copied to multiple variables. Maybe introduce a keyword or otherwise make the copying explicit.
>
> ```azlan
> let cust = Customer()
> mut mutableCust = cust
> ref sharedCust = cust // Error: immediate copy must be explicit
>
> ref sharedCust1 = copy cust // Explicit copy; no error
> ref sharedCust2 = sharedCust1
> mut mutableCust = sharedCust1 // Error: immediate copy must be explicit 
> ```
