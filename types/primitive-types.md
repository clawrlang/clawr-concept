# Primitive Types

![RAWR|150](../images/rawry.png)
Every language needs primitive types. Here is a proposed set for Clawr:

- `integer`: an arbitrarily sized integer value.
- `real`: a floating-point value of unspecified precision.
- `decimal`: a base-10 floating-point value of unspecified precision.
- `boolean`: a value of `true` or `false`
- `ternary`: an truth-value with three states (`false`, `ambiguous` and `true`)
- `bitfield`: a binary blob of anonymised data (each bit is conceptually a `boolean`)
- `tritfield`: the ternary analogue to bitfield (where each trit is a `ternary` value)
- `character`: a value that represents any valid (printable) character glyph. It could be simple as in C or more complex as in Swift
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
if ternaryValue { print("Value is true") }
else { print("Value is either false or ambiguous")}

if !ternaryValue { print("Value is false") }
else { print("Value is either true or ambiguous")}
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
