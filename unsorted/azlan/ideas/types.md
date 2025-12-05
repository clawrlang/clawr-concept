# Kinds of Types

Uncle Bob (Robert Martin) defines the difference between objects and data structures:

> - An Object is a set of functions that operate upon implied data elements.
> - A Data Structure is a set of data elements operated upon by implied functions.
>
> — <https://blog.cleancoder.com/uncle-bob/2019/06/16/ObjectsAndDataStructures.html>

The deliberation is summarised:

> - Classes make functions visible while keeping data implied. Data structures make data visible while keeping functions implied.
> - Classes make it easy to add types but hard to add functions. Data structures make it easy to add functions but hard to add types.
> - Data Structures expose callers to recompilation and redeployment. Classes isolate callers from recompilation and redeployment.

I think this would be a good way to define types. Rather than saying that a `struct` belongs on the stack and therefore has “value semantics” and a `class` belongs on the heap and has “reference semantics,” we should separate types as being encapsulated objects vs exposed data structures.

```azlan.header
// A `struct` (data structure) is a set of data points that imply functions
struct 3DPoint {
    // A `struct` type can only declare variables (fields)
    // It cannot define methods

    x: real
    y: real
    z: real
}
```

Data structures are useful when sending information between processes (as DAOs and DTOs). They are also useful when the functionality applied to them might change over time, for example when performing analysis on a given set of data.

When modelling a domain or defining specific logic and rules, encapsulation is better. Encapsulated objects can ensure a cohesive state and protect invariants. They also protect client code from redesign (as pointed out by Uncle Bob).

```azlan.header
// An `object` is a set of functions that implies data
object Money: Equatable {
    // An `object` type can only declare functions (methods)
    // It cannot declare fields

    dollars(): integer
    cents(): integer

    // Operators (binary and unary) should be declared in the type
    // it operates on. As in C# at least one of the inputs (or the output)
    // must match the containing type
    op Money + Money: Money
    op Money - Money: Money
    op -Money: Money
}
```

The `Money` type is a “value object” in DDD terms, as it is both immutable and has the `Equatable` trait. Objects are also highly suitable as DDD entities. To allow mutation, Azlan requires methods to be entered in a clearly labeled section for the purpose:

```azlan.header
object Customer {
    name(): string
    address(): Address

mutating:

    correctName(string)
    changeLegalName(string)
    move(to: Address)
}
```

The two distinct methods to change the name are inspired by [a talk from Dennis Traub](https://www.youtube.com/watch?v=-ZfobxldW9w).

We will also have `service` types. These are objects that access external services like the screen, a database or a server on the Internet. Services have externally defined state so they cannot possibly be considered side-effect free. Yet there might still be cause to allow `let` to declare that the assigned service cannot be replaced?

```azlan
service BankAccount {
    balance(): Money
    deposit(amount: Money)
    withdraw(amount: Money)
}

mut acnt: BankAccount // Error, a `service` cannot have isolated scope.
let acnt: BankAccount // Maybe okay, but the `service` is not immutable.
ref acnt: BankAccount // Allowed, a `service` will always use ref semantics.
```

Not sure if we need to define `abstract` types? Swift seems to get by without them, instead using `protocol` and concrete types. It does allow inheritance when the type is a `class` but not if it's a `struct`; does that mean that inheritance cannot be implemented if `ref` semantics is not guaranteed? If so, is there a problem if inheritance is not supported? Do data-structures (encapsulated or exposed) really need it?

I believe inheritance can be supported though. I do not believe it is the semantics of the type that sets the limitation, but rather the stack allocation part. If all `object` variables (reference or local scopes) are heap allocated, their types can define methods in virtual tables and hence achieve polymorphic inheritance. And if we can solve inheritance for `objects`, we should have no problem solving it for `structs`.

We should at least have a keyword like Java/C# `interface`, Swift’s (and Obj C’s) `protocol` or in other languages: `trait` to indicate capabilities and allow dependency inversion. My suggestion is `role` as the implementing/conforming type works much like an employee taking on a role in the organisation. But maybe even that should come in two flavours: `role` (or `capacity` or `capability`) for `services` vs `trait` for `objects`?

```azlan.header
trait Equatable {
    static func == (Self a, Self b): bool
}

object Money: Equatable {
    dollars(): integer // function that operates as a getter
    cents(): integer
}

role MoneyStore {
    balance(): Money
    deposit(amount: Money)
    withdraw(amount: Money)
}

service BankAccount: MoneyStore { }

object List<T> {
    item(at index: integer): T?
    add(_ item: T)
    remove(at index: integer)
    remove(_ item: T) if T: Equatable
}
```

## Built-in Types

Built-in “primitive” types are discussed in detail a [different document](./primitive-types.md).

And we’ll probably need a super-abstract `any` type.

I do not believe we need `anystruct`, `anyobject` or `anyservice`. Nor `anymut` or `anyref`.
