# Azlan: Working with Reference Semantics (`ref`)

## Overview

In Azlan, most variables are either immutable (`let`) or copied to isolate mutations (`mut`). However, sometimes you may want a variable to refer to the same data as another, without making copies. This is where the **`ref`** keyword comes in.

The **`ref`** keyword allows multiple variables to share the same memory, making them references to the same underlying data. This can be very useful when you want to work with the same piece of data in different places without duplicating it. However, it's important to understand the rules and constraints around `ref` variables to avoid unintended side effects.

In this section, we’ll cover how `ref` behaves and how it compares with `let` and `mut` variables.

## The Difference Between `let`, `mut` and `ref`

The `ref` keyword is used the same way that you have used `let` and `mut` thus far in tutorials.

```azlan
ref myVariable = initial_value
// or
ref myOtherVariable: type
```

Like `mut`, `ref` declares a mutable variable, but unlike `mut` its scope is not limited. Here is a rundown of how to think of the three keywords:

You should default to using `let` as this declares an immutable variable. Immutable variables are guaranteed to never change from their initial value. This is a very powerful tool for reducing the cognitive load when reasoning about your code.

When you need mutable variables (i.e., variables that can change), prefer the `mut` keyword. Mutability adds some cognitive complexity, but a `mut` variable is guaranteed a local scope which means that a variable cannot change unless it is explicitly referenced.

When you assign a variable to another variable, you copy its data to a new location. [^cow] The copies are logically separate and changes to one variable will not affect the other.

[^cow]: In actuality the copy is not made immediately, but when the first next modification is done. This is called *copy-on-write*, but it’s just an implementation detail that you do not need to delve into to understand the conceptual implications.

The `ref` keyword breaks this rule. When variables are declared using `ref` they can refer to **the same underlying memory block** and assigning one `ref` variable to another does not create a copy.

## When Should You Use `ref`?

- **Sharing data**: Use `ref` when you want multiple variables to share the same data. Any changes made through one `ref` will affect all others that point to the same memory.
- **Memory efficiency**: `ref` can save memory—and improve performance—when working with large data structures because no copies are made.

However, use caution when working with `ref` because shared memory can lead to unexpected behaviour if not managed properly. We’ll explore this further with examples.

---

You should not assign `let`/`mut` to `ref` variables or vice versa. It will cause confusion. But to mitigate the confusion if you still need it, the required `copy` keyword makes the copying explicit.

### 1. **`let` to `ref`: Copying the Data**

When a `let` variable is assigned to a `ref`, the data must be copied immediately. This preserves the immutability of the original variable. Since the `ref` variable references a *copy* of the original structure, and not the variable itself, changes made to it won’t break the immutability of the `let`  contract.

```azlan
// `let` variable (immutable or “constant”)
let p = Point(5, 10)

// Assigning a `let` variable to a `ref` triggers an immediate copy
ref q = copy p
   // The `copy` keyword makes immediate copying explicit.
   // Without it, the compiler will report an error.

// `q` is a copy of `p`, not a reference, so modifying `q` does not affect `p`
print(q)  // Point(5, 10)
print(p)  // Point(5, 10) -- `p` remains unchanged
```

### Key Points

- **`let` variables** are *immutable constants*.
- **Assigning a `let` to a `ref`** creates an immediate **copy**. The original `let` variable is not affected by changes to the `ref`.

---

## 2. **`mut` to `ref`: Copying to Preserve Local Scope**

When a `mut` variable (mutable) is assigned to a `ref`, a **copy** is also made. This ensures that the local scope of the mut variable is preserved, and changes to the ref do not affect it.

```azlan
// `mut` variable (mutable)
mut r = Point(1, 2)

// Assigning a `mut` variable to a `ref` requires an immediate copy
// to maintain the local scope of the `mut` variable.
ref s = copy r

// `s` is a copy of `r`, so modifying `s` does not affect `r`
s.x = 20
print(s)  // Point(20, 2)
print(r)  // Point(1, 2) -- `r` remains unchanged because `r` is isolated
```

### Key Points

- **`mut` variables** are mutable, but their **local scope is protected** when assigned to a `ref`.
- **Assigning a `mut` to a `ref`** creates an immediate **copy** to preserve the local scope guarantee. Changes to `s` will not affect `r`.

---

## 3. **`ref` to `ref`: Sharing the Same Memory**

When a `ref` variable is assigned to another `ref`, no copying occurs. Instead, the two variables **share** the same memory. Any change to one `ref` will affect the other, since both point to the same data in memory.

```azlan
// `ref` variables point to the same memory
ref t = s  // `t` and `s` now share the same memory

// Modifying `t` also modifies `s` because they point to the same data
t.x = 30
print(t)  // Point(30, 2)
print(s)  // Point(30, 2) -- `s` is modified because `t` and `s` share memory
print(r)  // Point(1, 2) -- `r` is not affected by `t` and `s` because `r` is isolated
```

### Key Points

- **`ref` variables** share the same memory location. They point to the same data.
- **Changes to one `ref`** will affect all other `ref` variables that share the same memory.

---

## Reference Semantics: A Conceptual Model

To understand how `ref` works, it's useful to think about the differences between the types of variables:

- **`let` variables** are **immutable** — once a value is assigned, it cannot be changed.
- **`mut` variables** are **mutable** but isolated to their scope. When assigned to a `ref`, they are copied to preserve isolation.
- **`ref` variables** share data with other `ref` variables, which allows them to behave like **pointers** to the same memory location.

This distinction helps clarify how data flows between variables in Azlan and how you can work with different types of variable scopes effectively.

---

## Wrapping Up

In this section, you learned the following:

- **`let` to `ref`** creates a **copy** of the data because `let` variables are immutable.
- **`mut` to `ref`** also results in a **copy** to preserve the **local scope** of the `mut` variable.
- **`ref` to `ref`** creates a **shared reference**, meaning changes made through one `ref` will affect the others.

As you advance in Azlan, you'll be able to make use of `ref` to manage shared data more effectively. However, it's important to understand the **trade-offs**: **copying** gives you safe isolation, while **reference semantics** gives you more powerful control over shared data — but it requires caution to avoid unexpected changes.

---

## Next Steps

- Try experimenting with `let`, `mut`, and `ref` in your own programs.
- Think about how sharing data using `ref` can improve memory efficiency in certain use cases, and how it might introduce risks in others.
- Next, you can dive deeper into advanced topics like **ownership** and **borrowing** (coming soon!) to get an even better handle on how Azlan handles references at a low level.

---

## Suggested Follow-up Reading

- **Advanced Memory Management in Azlan**: Explore how Azlan uses reference counting and other techniques to manage memory efficiently.
- **Encapsulation and Data Integrity**: Learn how to combine `ref` and `object` types to ensure that your data is not only efficient but safe and encapsulated.
