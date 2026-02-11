# Types are Sets

A mathematical set is …

- a container? No.
- A collection? Maybe, sort-a?

I would say that a set *is* its members. But that might be too abstract or unspecific?

A datatype (or simply “type”) in programming can be thought of as a set. The set of all vehicles or the set of all animals are some examples.

A subclass is essentially a subset of a larger set. The set of all dogs is a subset to the set of all animals and the set of all cars is a subset to the set of all vehicles.

A subset adds constraints/information about members of the set. If you know that an animal is a dog, you have more information than if you just know that it is an animal.

## Types as Layout

In C, a type is just a structure laid out in memory. When you name a field, you also define its location in memory relative to its parent structure. And when you want to reference that field, the type system knows the size and offset to access.

This is a very concrete and solution-oriented way of thinking. You know that the code runs on a processor, and you know that you have access to memory which is addressed linearly. You know all these technical details, but when you think hard about *them*, you cannot also think hard about *your domain.*

You probably do not write code with the purpose of accessing memory. You probably write code to construct a complex finance system, or to regulate the irrigation of a farm, or to catalogue parts, or to compute statistics on big data, etc. You should not spend all your cognitive energy on technical implementation details when your domain is probably plenty complex enough as it is.

## Types as Behaviour

Modern “high level” languages (especially “object-oriented” languages) reduce the importance of layout when defining types. Instead a type represents data or behaviours. A `UserManager` has abilities to manage a `User`. A `Counter`increments an `integer` in steps. You cannot perform user management with a `Counter`, and you cannot count in steps with a `UserManager`.

This is a better way to think about types than the C approach. The type of an object/value determines what it can be used for, and where in the code it is legal to use it.

But Clawr takes it one step further: it considers types *sets*.

## Types as Sets

Let's start with a question: What is an `integer`?

C programmers would perhaps answer “64 or 32 bits.” There is no semantics implied. The value can be bit-shifted, multiplied, XOR'ed, printed as an ASCII character… There is no semantics at all implied in the typename. All it is, is a size for layout.

A C#, Java or Swift programmer—or really any programmer at all—would probably say something similar. An integer is a numeric value that is used in arithmetics, but it can also be used in bitwise Boolean operations in most other languages, maybe in all of them.

But even if we ignore the discrepancy of treating integers as bitfields, most languages agree that an `integer` is a numeric value that fits in a specific size (width) of binary bits.

Some languages define a `BigInteger` type that can be any size. It grows arbitrarily as needed. This is useful, but does not significantly change the definition: an `integer` is a number that can fit in the given representation.

For Clawr, types are sets and subsets. An `integer` is defined as any member of $\mathbb{Z}$ (realisable through some `BigInteger` implementation), but you can also constrain the available range of integers. An `integer @range(0..100)` guarantees that the value cannot exceed the given range. This is a subset of $\mathbb{Z}$ and effectively a new type.

Just as a `Dog` can be passed to any function which accepts an `Animal` argument, or assigned to an `Animal` variable, a constrained integer can be used wherever a less constrained integer is called for. As long as the value's type is guaranteed to be a subset of the required type, no limitations are imposed.

If a value is not known to be in the needed range, a runtime check will be injected and the process will exit (“panic”) if that check fails.

Considering types as sets has some benefits:

1. Ternary support: sizes expressed in binary bits do not make much sense when the hardware uses ternary bits (a.k.a “trits”).
2. Runtime checks: values can be assigned with impunity. (This can be considered a downside as there is no compile-time guarantee. But the truth is that it is never a guarantee that an operation does not overflow.)
3. Speed Optimisation: If values can be proven to always remain small, the `BigInteger` overhead can be skipped.
4. Memory Optimisation: Several values can be packed into a single addressable unit (Ada style) for reduced memory footprint.

### `boolean` $\subset$ `ternary`

There may be consequences that make it impractical, but is possible to consider `boolean` as a subset of `ternary`:

```clawr
enum ternary { false, unset, true }

type boolean = ternary @values(false, true)

// or alternatively:
type boolean = ternary @except(unset)
```

Anywhere a `ternary` value is requested, a `boolean` can be used. And anywhere a `boolean` value is returned, it can be assigned to a `ternary` variable.

I am not making a design choice or a recommendation here, but it is not inconceivable that the Clawr runtime could even change the logical representation of `false` when a `boolean` typed value is assigned to a `ternary` variable (or vice versa). Even if that is invisible in the Clawr source code. What is important is the semantic *intent*, not the actual execution.

It might be awkward if we support bitfields. A binary processor will need `false` to be represented by a zero bit, whilst a ternary processor needs zero to mean `unset`. But I think this problem can be mitigated — if not entirely eliminated — as long as we do not *equate* false/true with these numeric values. As long as we think of the values semantically (as truth values, not numeric values) it should not matter what transistor states are used to represent them.

## `bitfield` and `tritfield`

Persistence media, communications protocols and encryption algorithms operate on anonymised data. Set theory is probably not highly relevant for these types, but let’s not fully close that door prematurely.

Data can be either binary or ternary in nature (or use any other radix though that is not considered at this time). To read and manipulate such data, Clawr uses the types `bitfield` and `tritfield`. A `bitfield` is essentially a collection of positioned `boolean` values, and a `tritfield` is the same but with fully `ternary` values.

The implementation of `bitfield` on ternary architectures will use under-utilised trits (capable of tree values, but only referencing two of them) and `tritfield` on binary architectures will need two bits for each trit, which doubles the memory pressure.

## the Amazing Idea

If `boolean` is a subset of `ternary`, it is also a *subtype* of `ternary`. Meaning: as in classic OO languages, `boolean` values can be assigned to `ternary` variables, fields and function parameters.

But here's my crazy disruptive idea: Maybe, by focusing on sets instead of type hierarchies — subsets instead of subtypes — Clawr is able to do what other languages cannot: automatically know that a function will always return only a certain subset of the declared return type/set for a certain input.

 Maybe an example is called for: basic `boolean` operators. If I negate a `ternary` value, I will need a `ternary` variable to hold the result, but if I negate a `boolean`, I can know that the result is also `boolean` because `!b` can never return `unset`.

Similarly for AND (`&&`) and OR (`||`): if both  inputs to the operation are `boolean`, the output can never be `unset` and is thus known to be in the `boolean` subset. Could I achieve this with a single `ternary` implementation for each operator? Or would I need a specific `boolean` version?

### Type Lattice

The `ternary` set can be broken up into non-overlapping subsets. The smallest subsets are: { `false` }, { `unset` },  { `true` }. It is possible to order all subsets of `ternary` from the empty set to the complete `ternary` set. This is called a lattice:

```
        {false, unset, true}   (ternary)
         /        |        \
{false, true} {false,unset} {true,unset}
         \        |        /   
        {false} {true} {unset}
          \       |       /
                 ∅
```

When we’re guaranteed to be in the `boolean` subset:

```
           {false, true}   (boolean)
             /       \
           {false} {true}
             \       /
                 ∅
```
