# the `ternary` Type

Like all programming languages designed for binary computers, Clawr has a `boolean` type. But Clawr is not designed for binary computers. It aims to be agnostic to processor architectures and supportive of the non-binary. Therefore, Clawr also defines a native `ternary` type.

## Definition

The `ternary` type is an `enum` with three values: `{ false, unset, true }`. It purposely uses the same terminology as `boolean`, but just adds a third state that is neither true nor false.

## Ordering

The `ternary` values are ordered: `false < unset < true`. This allows meaningful definitions of `boolean` operators on `ternary` values. AND (`&&`) becomes a min operation and OR (`||`) becomes max. This makes the operators work seamlessly on both `ternary` and `boolean` data.

The NOT (`!`) operation also toggles between false/true. It leaves unset alone however; negating an unknown truth results in an unknown truth.

## `ternary` $\supset$ `boolean`

I may have missed consequences that make it impractical, but it is possible to consider `boolean` as a subset of `ternary`:

```clawr
enum ternary { false, unset, true }

type boolean = ternary @values(false, true)

// or alternatively:
type boolean = ternary @except(unset)
```

Anywhere a `ternary` value is requested, a `boolean` can be used in its place. And anywhere a `boolean` value is returned, it can be assigned to a `ternary` variable.

I am not making a design choice or even a recommendation here, but it is not inconceivable that the Clawr runtime could even change the underlying representation when a `boolean` typed value is assigned to a `ternary` variable (or vice versa). I’m particularly referring to the `false` value which could be represented as 0 when considered a `boolean`, but -1 when `ternary` (if that is deemed practical). What is important is that the *semantic intent* is upheld, not how the values are represented.

## Operations

All the `boolean` operations apply to `ternary`, but with nuance in their interpretations:

- AND becomes MIN
- OR becomes MAX
- NOT toggles `true`/`false`, but does not change `unset`
- `==`
- `!=`

XOR is a controversial operator that is not strictly necessary (for scalar values) and is therefore not explicitly included. Use `!=` for the same effect.

> [!question]
> I’m not sure how equality should work. In SQL, comparisons with `NULL` are always false (both `==` and `!=`). You have to use `IS NULL` and `IS NOT NULL` to explicitly check if a value is `NULL`. Maybe `==` and `!=` should work the same way for Clawr `ternary`? And then a special function (or syntax?) should be added for comparing to `unset`?

Specifically `ternary` operators (with reservation for name changes):

- `consensus` (or `CONS`) returns the consensus value if both inputs agree. If they disagree (or one is unsure) the output is `unset`.
- `gullibility` (or `ANY`) is like an `OR` version of `consensus`; it only requires one adamant opinion to be convinced. If one input is `unset` the output will be whatever the other says.
- `MUL` multiplies values (where false = -1, true = +1)
- `add_mod_3()` and `sub_mod_3()`
- `add_clamped()` and `sub_clamped()`
- `rotate_up(t)` and `rotate_down(t)`
- `clamp_inc(t)` and `clamp_dec(t)`

And again: any input to these ternary operators can be `boolean` as `boolean` values are compatible with `ternary` variables/inputs, but the output from all operations is `ternary` and might be `unset` and thus incompatible with `boolean` variables.

## Control Flow

`ternary` has a natural place in control flow expressions. `if(t)`, `while(t)` and similar predicate-based branchings act when the value is `true` and a `ternary` value can be `true`.

Examples:

```clawr
mut t: ternary = true

if (t)
  print("this is happening")
else
  print("this is not happening)

t = false

if (!t)
  print("this is happening")
else
  print("this is not happening)

// Note that `ternary.zero` is neither true nor false.

t = unset

if (t)
  print("this is not happening)
else if (!t)
  print("this is not happening)
else
  print("this is happening")
```
