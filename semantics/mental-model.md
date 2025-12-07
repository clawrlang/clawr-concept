# Understanding `let`, `mut`, and `ref`: a Mental Model

## The Common Misconception

When programmers first encounter `mut` and `ref` variables, they often make a critical assumption: that assigning a `mut` variable to a `ref` variable creates a shared reference between them. This assumption comes from years of training in traditional object-oriented programming, where nearly everything behaves like a pointer.

**This assumption is wrong.**

If it were true, it would violate the fundamental guarantee that `mut` provides: isolated, independent mutability. Understanding why requires unlearning some deeply ingrained mental habits.

## The Traditional OOP Mental Model

In traditional object-oriented languages (Java, JavaScript, Python, C++, etc.), we're taught to think of "objects" as blocks of memory, and variables as pointers to those blocks. Multiple variables can store the same memory address and therefore reference the same object. When the object is updated through any variable, all other variables see the change immediately—because they're all pointing to the same thing.

This mental model works for those languages because it reflects their implementation. But it's a poor foundation for reasoning about programs, especially when you need guarantees about isolation and controlled sharing.

## A Better Mental Model

Think of variables not as pointers, but as three distinct kinds of things:

### `ref` variable: A Shared Reference

A `ref` variable *is* a pointer. Or you can think of it as a hand. It is a *reference* to some entity somewhere in the system. The hand might grab onto an entity, manipulate it or use it for a while, and then let go of it. Or it might hold on to one entity forever.

Multiple hands can reach for the same entity. When any hand manipulates it, all hands are affected by the change because they're all interacting with the same thing. This is shared mutable state. And it might be how many programmers think of object-oriented programming.

The `ref` keyword is analogous to `class` types in other languages (e.g. Java, C#, Swift…). It indicates reference semantics.

### `mut` variable: A Data Container

A `mut` variable is like a drawer or a box of data. You can reach inside the drawer and change things around. You can copy the contents of one drawer into another. But you can never make two drawers “become the same drawer.” **Each drawer is its own distinct container**. This means that two variables can never change one another’s content. Changes made to one container can never be reflected in any other’s.

Critically: declaring a `mut`variable guarantees that its state/data can never change unless the variable itself is explicitly mentioned as the target of mutation.

The `mut` keyword is analogous to `struct` in languages where the type defines the semantics.

### `let` variable: A Named Value or a Definition

A `let` variable is essentially an assigned name for a particular value—what we might call a “*constant*.” The value can be a number (like $π$ or the integer 6) or a more complex structure (like GPS coordinates or the current configuration of your program). We could also say that we *define* the constant when we assign a value to it. Once defined, the constant is fixed.

A value cannot change and still remain the same value. Similarly, a `let` variable is immutable and can only refer to its initial contents. Even if the named value is a large data structure—with arbitrarily many layers of nested structures—the variable itself is locked to the initial combination of field values. Even the tiniest change to that structure would construct a new value and the variable could not refer to that and still be considered constant.

The `let` keyword is analogous to `let` variables with `struct` types in Swift. The runtime implementation of `let` can be exactly the same as for `mut`; the difference is at compile-time, where the compiler disallows any action other than reads.

This is why `let` and `mut` variables can be freely assigned to each other. The copy operation is implicit in their identical isolation guarantees.

## The Key Insight: Assignment Semantics

The mental model clarifies what happens during assignment:

**`let` → `mut` assignment: Copy value**
```
let x: SomeData = { value: 42 }
mut y = x
y.value = 99 // Does not change x
```
This copies the contents of `x` into `y`. They are now two independent drawers with identical contents. Changing `y` does not affect `x`.

**`ref` → `ref` assignment: Share entity**
```
ref x: SomeData = { value: 42 }
ref y = x
y.value = 99 // Also changes x
```
Both `x` and `y` now reference the same entity. Changes through either reference affect the same underlying entity.

**`mut` → `ref` assignment: Not Allowed**

```clawr
mut x: SomeData = { value: 42 }
ref y = x // What would this mean?
y.value = 99 // What does this do?
```

This is where the misconception emerges. In traditional OOP, you might expect `y` to “reference” `x`, creating shared mutable state. But that would break `mut`’s guarantee of isolation.

Instead, one of two things must happen:

1. The operation is **disallowed** (compile error)
2. A new independent entity is created from `x`’s contents, and `y` references that new entity

Either way, `x` remains isolated. Modifications through `y` cannot affect `x`.

Clawr will indeed disallow direct assignment across semantic borders. And implicitly copying the value can lead to confusion. Therefore the value must be explicitly copied.

```clawr
mut x: SomeData = { value: 42 }
ref y = copy x // Explicitly create a copy
y.value = 99 // Does not change x
```

## Why This Matters for Domain Logic

This distinction isn't academic—it directly impacts how you solve problems:

**With `mut` variables**, you can reason locally. A function that takes a `mut` parameter knows it has exclusive access to that container. No other part of the program can observe or interfere with changes. This makes it trivial to maintain invariants and reason about state transitions.

**With `ref` variables**, you explicitly opt into sharing. When you see `ref` in a signature, you know that modifications may be visible elsewhere. This is sometimes necessary (updating a shared entity, coordinating between systems), but it's marked and intentional.

**With `let` variables**, you have complete freedom. Immutable values can be freely copied, passed around, and shared without any concern for interference.

## Historical Context: Why We Think in Pointers

Early implementations of functions used "the stack" for local variables. Each variable was allocated a fixed memory area—a physical drawer. Assigning one variable to another meant copying bytes from one memory region to another. If the data was large, the entire structure was copied. Changes to one variable couldn't possibly affect another because they occupied different memory.

Some variables contained memory addresses pointing to "the heap"—dynamically allocated memory. These variables could store the same address and reference the same data, creating shared mutable state.

Languages like C# formalized this distinction: `struct` types are stack-allocated (copy semantics), while `class` types are heap-allocated (reference semantics). This created intuitive behavior as a direct consequence of implementation.

But implementation details make poor mental models. The stack/heap distinction is about *how* the machine works, not *why* your program behaves the way it does.

## Advanced: Mixing Semantics

I said before that `let` and `mut` variables cannot be manipulated by other references. This is true as long as the fields of your data structures are not `ref`. The recommendation is to make all fields `let` or `mut` to avoid this scenario, but that is not always feasible.

Just like a `struct` in languages like C# and Swift can contain fields that refer to `class` types, Clawr types can contain `ref` fields (and still be assigned to `let` or `mut` variables). Mixing semantics complicates the metaphor.

When dealing with `mut` variables, a `ref` field becomes like a hand inside a drawer. That mental image may be somewhat disturbing; in this case it might be better to think of it as a web-link. It can still refer to an entity shared with other variables. That shared entity is not inside the drawer; only the link is. Therefore, it might still be manipulated in unexpected ways from the `mut` variable’s perspective.

> [!tip]
> Prefer `mut` and `let` fields when possible. Fields without explicit semantics default to `mut`.
> 
> Neither `mut` nor `let` fields in a `ref` variable can ever cause a problem. The issue only occurs in one direction.

## The Value of Clear Semantics

The `let`/`mut`/`ref` model separates concerns:

- `let`: "This value never changes"
- `mut`: "This is my container that only I can manipulate"  
- `ref`: "This is a reference to an entity that resides elsewhere and may be shared by others"

These guarantees let you encode domain logic directly. You're not building solutions around memory management—you're expressing the actual rules of your problem domain. When you see `mut` in your code, you know isolation. When you see `ref`, you know sharing. When you see `let`, you know immutability.

This is how you reason about business logic rather than fight with implementation details.
