# Welcome to Azlan: A Simple and Powerful Language

Azlan is a new, intuitive programming language designed to help you solve problems efficiently, whether you're building small scripts, exploring data, or designing complex systems. This introduction will guide you through the **core features** of Azlan, starting with simple data management and moving into more powerful concepts like **objects** and **encapsulation**.

Whether you are an absolute beginner or already have experience with programming, Azlan’s design encourages clarity and maintainability from the very start.

## The Basics: "Hello, World!"

In Azlan, your first program might look like this:

```azlan
print("Hello, World!")
```

This simple line of code demonstrates a **function call** — `print()` — which takes a **string** (a sequence of characters) and displays it in the terminal.

Running this program would look like this:

```shell
$ azlan hello.az
Hello, World!
$ _
```

Congratulations! You’ve just written your first Azlan program.

---

### Storing and Reusing Data with Variables

Often, we need to store values for later use. This is where **variables** come in. A variable holds a value, and you can use that value multiple times throughout your program.

```azlan
let greeting = "Hello, World!"
print(greeting)
```

In this example, the `greeting` variable holds the string `"Hello, World!"`, and the `print()` function outputs it to the terminal.

## Control Flow

But programs are not useful unless they can make decisions and computations. Before we can start making decisions, however, we will need an automated process. This is the `for` loop:

```azlan
// This is a list of elements.
// Lists can be indexed and enumerated.
let names = [
  "Alice",
  "Bob",
  "Charlie",
  "Doug"
]

print("These are all the names:")
// The for loop enumerates all items in a list and runs
// a block of code for each one in turn.
for name in names {
  print(name)
}
```

Running this program would look like this:

```shell
$ azlan hello.az
These are all the names:
Alice
Bob
Charlie
Doug
$ _
```

### The `if` statement

Now that we have a list of data, we can make choices based on the constitution of each element. The `if` statement evaluates a predicate, and if that predicate is `true`, it executes a block of code. If the predicate is `false`, the block is skipped.

```azlan
let names = [
  "Alice",
  "Bob",
  "Charlie",
  "Doug"
]

print("These are the short names:")
for name in names {
  if name.length < 5 {
    print(name)
  }
}

print("These are the long names:")
for name in names {
  if name.length >= 5 {
    print(name)
  }
}
```

Running this program would look like this:

```shell
$ azlan hello.az
These are the short names:
Bob
Doug
These are the long names:
Alice
Charlie
$ _
```

if we need more complex data?

## Introducing `struct`: Simple Data Structures

As you start working with more complex programs, you’ll want to organise data efficiently. In Azlan, we offer two primary ways to structure data: **`struct`** and **`object`**.

**`struct`** is a lightweight way to store related values together. It's useful when you only need to hold and access data — without any behaviour or methods.

For example, let’s define a `struct` to represent a **Point** in 2D space:

```azlan
struct Point {
  x: real
  y: real
}

let origin: Point = {x: 0, y: 0}
let otherPoint: Point = {x: 5, y: 5}

print("Origin:", origin)
print("Other Point:", otherPoint)
```

A **`struct`** is simple and to the point: it just aggregates related values, like the `x` and `y` coordinates of a single point.


No methods, no behavior — just data. It’s a perfect starting point when you’re modeling things like **coordinates**, **data transfer objects (DTOs)**, or simple containers.

## Moving to Objects: Data and Behavior

Once you are comfortable with **simple data structures** like `struct`, you may want to start organizing your programs in a way that models both **data** and **behavior**. This is where **`object`** types come into play. Objects can hold **state** (data) and **behavior** (methods).

Let’s take a look at how an **object** works in Azlan:

```azlan
object Rectangle {
  let width: real
  let height: real

  init(w: real, h: real) {
    self.width = w
    self.height = h
  }

  area() -> real {
    return self.width * self.height
  }

mutating:

  scale(by factor: real) {
    self.width *= scale
    self.height *= scale
  }
}

let rect = Rectangle(5, 10)
print("Area:", rect.area())  // 50
rect.scale(by: 7)
print("New Area:", rect.area())  // 350
```

## Encapsulation: Protecting Your Data

The primary difference between `struct` and `object` is **encapsulation**.

In an **object**, the **internal state** (like `width` and `height` in the `Rectangle` example) is **protected**. You cannot directly change the state; instead, you must interact with it through **public methods** (`scale(by:)`, and `area()` in this case). This keeps your code more **modular**, **flexible**, and easier to maintain.

Encapsulation is a powerful concept in programming because it helps to:

- **Hide implementation details**: The user of the object doesn’t need to know how the area is calculated, just how to call the `area()` method.
- **Control access to data**: By providing controlled methods like `scale(by:)`, you can ensure that only valid changes are made to the object's state.
- **Avoid unintended side effects**: Direct access to the object's internal data can lead to unexpected changes that can break your program. Encapsulation prevents this.

> [!warning] DO NOT
> It is not recommended to add “getters” and “setters” to expose the internal state (except as a step in a larger refactoring that will eventually remove them again). Direct accessors to the structure invalidates any protection that encapsulation offers. Manipulating the state through a setter is conceptually no different from addressing the internal structure directly.

---

## When to Use `struct` vs `object`

Prefer an `object` when:

- You need to model mutable state (e.g. when modelling an entity in DDD).
- There are structurally possible states that are considered invalid and should be disallowed.
- The object has meaning that is independent of its structural composition.
- You have business rules and/or policies that dictate how data may be changed.
- You need polymorphism and/or inheritance.

Prefer a `struct`in these situations:

- Communication protocols (DTO/DAO)
- Computations on large-scale data-sets
- Whenever immutable (read-only) data is enough

### Prefer `object`

The `object` keyword creates *encapsulation*. Encapsulation has three purposes: it protects the state (the data) from incorrect manipulation, it protects referring code from having to change when the internal structure changes, and it ensures that all instances of a given type are valid at construction. This makes the `object` keyword preferable in most scenarios.

An `EmailAddress` is a `string` with additional limitations; it must for example contain a single '@' character and at least one dot. A Swedish social security number (“personnummer”) has a check-digit that ensures that the other digits have been entered correctly. Modelling types like these requires validation, and an `object` type can ensure that this validation must pass for the structure to even *exist in memory*.

A `Money` type has a different reason for choosing `object`. Money has meaning that is independent of its structure: $1.50 is the exact same value as ¢150, and the same as “$1 and ¢50.” Money can be modelled as a single integer `cents` value, as a single real value (dollars.cents), or even as two separate integer values.

When you are building a user-operated data-entry application, you should use `object` a lot. But there are scenarios where `object` is not a good fit; it’s just awkward to use. This is where `struct` would be a better choice.

### But `struct` has its uses

The `struct` keyword is preferred when the *specific structure* of the data is well known, unchanging and *essential*. Examples of this include DTOs and DAOs in communications protocols.

When you use `struct`, you should prefer immutable (`let`) variables. When data needs to change, there are typically rules and validations that need to be applied. The `struct`cannot ensure validity.

Instead `struct` should be used in situations where the data is already known and can be presumed already valid. When communicating between subsystems, or analysing big data, that is a reasonable assumption. The data has already been accepted into the system and was probably validated at that point.

---

## The Path Ahead: Advanced Concepts

Azlan provides more advanced features for experienced programmers, like **polymorphism**, **inheritance**, and **concurrency**, but don’t worry — you don’t need to learn all of these right away. You’ll be able to explore these as you become more comfortable with the basics.

At this point, focus on:

1. **Understanding the difference between data structures (`struct`) and objects**.
2. **Using encapsulation to design clean, modular programs**.
3. Experimenting with **objects** to model real-world entities and behaviors.

---

## Conclusion

Azlan is designed to help you write clean, maintainable code from day one. Start by learning how to store and manipulate simple data, then gradually introduce more powerful concepts like **objects** and **encapsulation** to structure your programs.

As you continue learning, you’ll see how Azlan’s syntax and features can help you solve problems in a more structured way — making your code easier to understand, modify, and scale.

Let’s get roaring!

---

## Want to Learn More About `struct` and `object`?

If you're curious about the differences between **`struct`** and **`object`**, check out the [advanced guide](./object-v-struct.md) here.

If you're curious about more advanced concepts in Azlan, you can check out the following links:

- [Reference semantics](./reference-semantics.md) - how Azlan makes it explicit and how it relates to the more approachable variables seen here
- [`bitstruct`](../bitstruct.md) - a compact version of `struct` that is usable for constrained memory requirements
