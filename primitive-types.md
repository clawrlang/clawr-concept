# Primitive Types

![RAWR|150](../images/rawr.png)
Every language needs primitive types. Here is a proposed set for Clawr:

- `integer`: an arbitrarily sized integer value.
- `real`: a floating-point value of unspecified precision.
- `decimal` a base-10 floating-point value of unspecified precision.
- `boolean`: a value of `true` or `false`
- `ternary`: an truth-value with three states (negative, unknown and positive)
- `bitfield`: a field of multiple Boolean bits/flags.
- `tritfield`: a field of ternary trits/flags.
- `character`: this could be simple as in C or more complex as in Swift
- `string`: a fixed list or sequence of characters
- `regex`: a regular expression/pattern for string matching

## Ternary Mode

Clawr should support ternary architectures whenever they become mainstream. It is reasonable to expect that balanced ternary could take over the baton from binary in the future. In practical terms this is probably a very distant future as there is so much existing infrastructure that will need to be replaced, but being prepared is never a mistake. And actually being able to utilise ternary—albeit on a small scale—in the near future could spell competitive advantage.

A 64 bit `integer`could be translated to a 54 trit ternary without loss (as $3^{54} \gg 2^{64}$). For numeric values, the width of a register is not all that important; it is the range of representable values that matters. A similar case can be made for floating-point numbers.

There is a proposed standard called [ternary27](./unsorted/logic/ternary-architecture/Ternary27%20Standard.pdf). It is based on IEEE 754, but adapted to ternary, and might be a good fit for `real` types on ternary hardware. It does however only use 27 trits and does not have the range nor precision of 64 bit binary. To match IEEE 754 “double precision” we will need 54 trits. That is not covered by the documentation I found, but its model can probably be extended.

A `bitfield` (or “`tritfield`” in ternary mode) is used differently. The number of positions is of higher relevance than the total number of combinations, so the focus should be on the number of bits/trits available.

The `ternary` type needs only one trit in ternary mode, but would need two bits in binary. It is probably best to not support ternary `tritfields` on binary hardware.

The `character` type (and by extension `string`) is probably less forward compatible. I suppose ASCII and ISO 8859-1 could be represented by converting the numeric value from base 2 to base 3. But UTF-8 will be a bit more awkward.

> [!note]
> It is not necessary to make a final decision regarding a ternary runtime before starting implementation work on Clawr. It is, however, good to have a rough plan regarding how ternary fits with the syntax and semantics.

### Compatibility

All ternary types should behave as their binary equivalents when not explicitly taking advantage of the ternary range.

Numbers are just numbers. Their representation uses balanced ternary instead of binary, and they will have larger capacity in ternary mode, but syntactically there will be no difference.

A `ternary` can replace a `boolean` in `if` statements and `while` loops. The `up` value counts as `true` and the `down` value as `false`. The `else` branch will be executed for two states.

```clawr
if ternaryValue { print("Value is positive/true") }
else { print("Value is either false/negative or unknown/zero")}

if !ternaryValue { print("Value is negative/false") }
else { print("Value is either true/positive or unknown/zero")}
```

## Arbitrary Precision

### Integers

Clawr uses arbitrarily-sized integers by default, eliminating overflow errors and removing the need for separate int8, int16, int32, int64 types. The compiler optimises storage based on proven value ranges or explicit annotations:

```clawr
count: integer  // Grows as needed
age: integer @range(0..150)  // Compiler uses appropriate fixed size
```

### Floating-Point

The `real` type supports specific precisions (single, double, quadruple, octuple) following IEEE 754, with double precision as the default. For applications requiring arbitrary decimal precision, use the `decimal` type instead.

In ternary mode, `real` precisions are mapped to balanced ternary floating-point representations that meet or exceed the corresponding IEEE 754 binary precision. For example, a `real` with double precision uses 54 trits in ternary mode, providing greater range and precision than 64-bit IEEE 754.

## Integers are not Bitfields

I do believe it would be good to conceptually separate `bitfield` from `integer`. Variables that are used for bitwise operations should probably not be used in arithmetic operations or compared to numbers that are the result of such. A `bitfield` cannot be assigned an integer (decimal) value, but a binary or hex literal (or the [ternary equivalent](./logic/ternary/t-hex.md) when applicable) does make sense.[^hex-vice-versa] Conversions between types should be allowed though; in this case that would mean a direct copy of the register.

  [^hex-vice-versa]: Vice versa might also apply, but it's not an obvious truth; on the one hand binary and hex are almost exclusively used for specifying bits, never for specifying numbers; on the other hand they are just numeric bases and just as valid as decimal. Maybe we should restrict use at first and later lift that restriction if there are complaints?
