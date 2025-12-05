# Primitive Types

We will of course need primitive types. Here is the proposed set:

- *integer*: a 64 bit signed integer.
- *bitfield*: a 64 bit register of bits/flags.
- *real*: a 64 bit IEEE 754 double-precision floating-point value
- *boolean*: a value of `true` or `false`
- *character*: this could be simple as in C or more complex as in Swift
- *string*: a fixed list or sequence of characters
- *regex*: a regular expression/pattern for string matching

## Sized Types?

I do not believe we will need different-sized integer or floating-point numbers. This may be relevant when bridging to/from other language domains, but modern processors are 64 bits and there is no point in modelling for smaller registers. (Unless we want to copy Ada and put multiple small integers or booleans in [a single 64-bit structure](./bitstruct.md).)

On the other hand [IEEE-745](https://en.wikipedia.org/wiki/IEEE_754) defines floating-point numbers up to “octuple precision” (256 bits, which translates to 32 bytes or 4 64-bit registers), so maybe multiple-register values can still be called for. (That would imply a need for `integer` types up to the same size as well. And maybe even an arbitrarily large `integer` type too?)

## Integers are not Bit-Vectors

I do believe it would be good to conceptually separate bit-fields from integers. Variables that are used for bitwise operations should probably not be used in arithmetic operations or compared to numbers that are the result of such. A `bitfield` cannot be assigned an integer (decimal) value, but a binary or hex literal does make sense.[^hex-vice-versa] Conversions between types should be allowed though; in this case that would mean a direct copy of the register.

  [^hex-vice-versa]: Vice versa might also apply, but it's not an obvious truth; on the one hand binary and hex are almost exclusively used for specifying bits, never for specifying numbers; on the other hand they are just numeric bases and just as valid as decimal. Maybe we should restrict use at first and later lift that restriction if there are complaints?
