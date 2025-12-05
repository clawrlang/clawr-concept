# Bitstruct

A type can be defined as a `bitstruct`. This allows a single 64-bit register to contain multiple values. Such a structure might be preferred in small-footprint devices where the total size of memory is constrained. (It is also possible that modern miniaturization negates this need.)

```azlan.header
bitstruct ComplexBistruct {
    case a (boolean)     // b << 0; a == a(true) = 0b0001
    case b (integer%3u)  // n << 1; b(1) == 0b0010, b(7) == 0b1110 (u = unsigned integer)
    case c (bitfield%4) // n << 4; c(0xF) == 0b1111_0000 == 0xF0
    case d (integer%3s)  // n << 8; d(3) == 0x0300, d(-4) == 0x0400, d(-1) == 0x0700 (s = signed integer)
    case e // (boolean) is implied
    ... // can max use a total of 64 bits
}
```

Used as follows:

```azlan
mut x: ComplexBitstruct = 0x0DB // 0b0000_1101_1110
x = .a(false) | .b(7) | .c(0xD) | .d(0) | .e(false) // equivalent
x = .b(7) | .c(0xD) // also equivalent - skipping the cases that are zero/false

x.a = true // bits |= 0b_0000_0000_0001
x.b = 4    // bits = bits & ~0b1110 | 0b1000 :: b(4) == 4 << 1 == 0b1000 (== 0x8)
x.c = 0xA  // bits = bits & ~0b1111_0000 | 0b1010_0000 :: c(0xA) == 0xA << 4 == 0b1010 << 4 == 0b1010_0000
```

Question to consider: Should `x.c` return `0x0A` or `0xA0`? The former would allow comparison to ordinary `bitfields` without explicit bitshifting, but the latter would be more performant when comparing to literals that can be bitshifted at compile-time. Perhaps the compiler can select strategy depending on the operation?

## Ternary Mode

In Ternary mode, the types `ternary` and `tritfield` become available.

```azlan.header
bitstruct TernaryBitstruct { // Requires Ternary mode
    case a (boolean)     // b << 0; a == a(true) == 0b1 == 0tU, a(false) == 0b0 == 0tD
    case b (ternary)     // t << 1; b(ternary.up) == 0tU0
    case _ (ternary)     // t << 2; padding
    case c (integer%3)   // n << 3; c(1) == 0t00U_000, c(13) == 0tUUU_000, c(-13) == 0tDDD_000
    case d (tritfield%3) // n << 6; c(0tD0U) == 0tD0DU_000_000
    ... // can max use a total of 81 trits (or just 54 or 27)
}
```

Used as follows:

```azlan
mut x: TernaryBitstruct = 0tD0U_U0D_0UD
x = .a(false) + .b(ternary.up) + .c(8) + .d(0tD0U) // equivalent

x.a = true // trits = MAX(trits, 0t000_000_00U)
x.b = ternary.down
x.c = -11
x.d = 0tUUD
```

## Arithmetics

Consider the following bitstruct:

```azlan.header
bitstruct MyVector {
    case a (integer%32u) // 32 bits, unsigned; values can be 0 - 4,294,967,295
    case b (integer%32s) // 32 bits, signed; values can be -2,147,483,648 - 2,147,483,647
}
```

This structure is laid out with `a` occupying the lowest 32 bits of the register and `b` occupying the highest 32 bits. Generally, the first case in the list is placed at the lowest bit, occupying as many bits as needed. The next case takes the lowest bits after that etc. A `boolean` case occupies a single bit, and `integer` and `bitfield` cases take as many as specified by their respective `case` declaration. In total no more than 64 bits may be assigned.

> **Side-note:** Maybe `real` cases should also be allowed, but only for distinct sizes (32 and maybe 16). An arbitrarily sized floating-point value is not covered by [IEEE-745](https://en.wikipedia.org/wiki/IEEE_754), but the powers of two from 16 up to 256 are.

Arithmetics can be implemented in part very easily and in part less so. It is easy for the `a` case in the example above: just zero out the top 32 bits and perform arithmetics as normal. If the total is more than 4,294,967,295 (`0x0000_0000_FFFF_FFFF`) the operation overflowed. If not, the bits can be safely combined with the 32 bits of `b` to create the resulting register value.

When operating on two `b` values, addition and subtraction is almost as simple as for `a`: just perform the operation on the bits as they are. Overflow would be detected in the same way it is for any 64 bit `integer`. But multiplication and division are more difficult as the `b` operands are essentially 2^32 times what they should be.

Therefore an initial bitshift must be done. At the same time, the register should be zeroed out in the positions not occupied by the relevant case. After that arithmetics can be performed in the “normal” way before recombining the result with the other cases of the vector.

> **Side-note:** An `integer` field that occupies more than half the register (more than 32 bits) might after multiplication result in a value that occupies more than 64 bits. In other words: overflow has to be detected by two means: by a too high resulting value *and* by register overflow (as in normal `integer` operations).

**Overflow Detection in Large Cases**: In cases where the `bitstruct` field occupies more than 32 bits, overflow detection should consider both the type limit (e.g., for signed integers) and the register overflow (64-bit register). It's important to check both when performing arithmetics on large values.

## The layout of a `bitstruct`

The bits of a `bitstruct` are populated and packed starting with bit 0 an increasing all the way to bit 63 in the order they appear in the declaration. For performance reasons, it is generally a good idea to align larger fields (such as integer or bitfield types) to bit boundaries that are multiples of 4 or 8. This can help avoid inefficient memory access on certain hardware architectures, where aligned data access is faster.

Perhaps it might be worth padding the bitfield with unused cases to achieve such alignment. It would also have the added benefit of reduced concfusion. If you convert misaligned `bitstruct` to a `bitfield` the hexadecimal representation will fail to match. Here's an example of what I mean:

```azlan.header
// Aligned layout with consistent hexadecimal representation
bitstruct AlignedBitstruct {
    case a (boolean)    // b << 0; a(true) = 0b0001
    case b (integer%3u) // n << 1; b(1) == 0b0010, b(7) == 0b1110
    case c (bitfield%4) // n << 4; c(0xF) == 0b1111_0000 == 0xF0
}
```

```azlan.header
bitstruct MisalignedBitstruct {
    case d (integer%3u) // n << 0
    case e (bitfield%4) // n << 3; c(0xF) == 0b0111_1000 == 0x78
}
```

When converting a `bitfield` to a `MisalignedBitstruct` (or use a hexadecimal literal in the code), if you want the `e` value to be `0xF`, you would have to use the input of `0x78`. It would be even more complex if you try to set the `d` case at the same time. It would probably be a good idea to flip the order of `d` and `e` to avoid this confusion. (The same could be said of cases `a` and `b` in the aligned exemple too by the way.)

Another benefit to aligning your bitstruct is performance. For performance reasons, it is generally a good idea to align larger fields (such as integer or bitfield types) to bit boundaries that are multiples of 4 or 8. This can help avoid inefficient memory access on certain hardware architectures, where aligned data access is faster.

## The Layout of a `bitstruct`

The bits of a `bitstruct` are populated and packed starting with bit 0 and increasing all the way to bit 63 in the order they appear in the declaration. For performance reasons, it is generally a good idea to align larger fields (such as `integer` or `bitfield` types) to bit boundaries that are multiples of 4 or 8. Proper alignment can help avoid inefficient memory access on certain hardware architectures, where aligned data access is faster.

If alignment is not considered, and a `bitstruct` is misaligned, converting it to a `bitfield` may result in confusion due to mismatched hexadecimal representations. This can make debugging or working with the values difficult. Consider the following example:

```azlan.header
// Misaligned layout example (bad practice)
bitstruct DeviceStatus {
    case deviceActive (boolean)   // 1 bit, bit number 0
    case errorFlags (bitfield%4)  // 4 bits, starts at bit 1
    case errorCode (integer%5u)   // 5 bits, starts at bit 5
}
```

In this case, the bit layout might look something like this:

```azlan
let deviceStatus: DeviceStatus = .deviceActive(false) | .errorFlags(0xA) | .errorCode(5)
```

|  errorCode  |  errorFlags  |  deviceActive  |
|-------------|--------------|----------------|
|    00101    |     1010     |       0        |

If you convert this value to a hexadecimal value, the result is `0xB4` which might not be what you expect. Where did the `0xA` go?

```plain
deviceStatus as bitfield // 0b0000_1011_0100 ; 0x0B4
```

### Corrected Version using Padding to Achieve Proper Alignment

To avoid confusion, it's a good idea to align the fields to 4-bit boundaries. Here's how you can improve the layout:

```azlan.header
// Aligned layout example (preferred)
bitstruct DeviceStatus {
    case deviceActive (boolean)     // 1 bit, bit number 0
    case reserved (bitfield%3)      // 3 bits padding for alignment (optional)
    case errorFlags (bitfield%4)    // 4 bits, starts at bit 4 (aligned)
    case errorCode (integer%5u)     // 5 bits, starts at bit 8 (also aligned)
}
```

In this aligned version:

```azlan
let deviceStatus: DeviceStatus = .deviceActive(false) | .errorFlags(0xA) | .errorCode(5)
```

|  errorCode  |  errorFlags  | reserved | deviceActive |
|-------------|--------------|----------|--------------|
|    00101    |     1010     |    000   |      0       |

If you convert this value to a hexadecimal value, the result is `0x05A0` which fits the literals used in the assignment/construction of the `bitsstruct`.

```plain
deviceStatus as bitfield // 0b0000_0101_1010_0000 ; 0x05A0
```

Now, the bit layout will be more predictable, and when you convert this to a `bitfield`, the hexadecimal representation will match the expected values.

### Alternative Version with Simpler Solution for Alignment

It is not always necessary to use padding. Sometimes it's just as simple as reordering the cases:

```azlan.header
// Aligned layout by reordering (preferred)
bitstruct DeviceStatus {
    case errorFlags (bitfield%4)    // 4 bits, starts at bit 4 (aligned)
    case errorCode (integer%5u)     // 5 bits, starts at bit 8
    case deviceActive (boolean)     // 1 bit, bit number 0
}
```

In this aligned version:

```azlan
let deviceStatus: DeviceStatus = .deviceActive(false) | .errorFlags(0xA) | .errorCode(5)
```

|  deviceActive  |  errorCode  |  errorFlags  |
|----------------|-------------|--------------|
|       0        |    00101    |     1010     |

If you convert this value to a hexadecimal value, the result will be `0x5A` which should fit nicely with expectations.

```plain
deviceStatus as bitfield // 0b0101_1010 ; 0x5A
```

### Sometimes Reordering is not Helpful

Consider the following example:

```azlan.header
// Complex misalignment that cannot be fixed by reordering alone
bitstruct ComplexDeviceStatus {
    case a (integer%5u)  // 5 bits
    case b (bitfield%6)  // 6 bits
    case c (integer%5s)  // 5 bits
}
```

None of these cases is an even multiple of 4 (nor can they be placed adjacent to each other to create a total size that is). That means that there is no reordering that can achieve alignment on its own. Padding is the only recourse in this case if alignment is desired.

```azlan.header
// Complex misalignment that cannot be fixed by reordering alone
bitstruct ComplexDeviceStatus {
    case a (integer%5u)  // 5 bits
    case padding1 (bitfield%3) // to fill out the first 8 bits
    case b (bitfield%6)  // 6 bits
    case padding2 (bitfield%2) // to fill out the first 16 bits
    case c (integer%5s)  // 5 bits
}
```

This will move case `b` by 3 positions to align with bit 8, and case `c` by 5 bits to align with bit 16.

If you do not like adding fields to an otherwise beautiful model, you can achieve padding by making your fields themselves larger:

```azlan.header
// Complex misalignment that cannot be fixed by reordering alone
bitstruct ComplexDeviceStatus {
    case a (integer%8u)  // 8 bits (though only 5 are needed)
    case b (bitfield%8)  // 8 bits (of which only 6 are used)
    case c (integer%5s)  // 5 bits
}
```

This achieves the same alignments and the same hexadecimal representations as the previous example, but without adding the noise of the `padding1` and `padding2` fields. The benefit of this approach is that users of your type will not be confused by having access to fields that have no usage. A potential downside, however, is that your fields will use more bits than they actually need. If you need to add more fields to your bitstruct later, the extra space might be beneficial, but on the other hand using that space might require accepting misalignment. If the 64 bit register feels cramped it might be better to consider using a regular `struct` instead.

If your `bitstruct` is *not* cramped, and you have the room to add more fields without running out of bits, this approach also offers the advantage of reducing the likelihood of further misalignment, since the fields are already sized in multiples of 8 bits. In the example only 21 bits (including) padding are used. There is still room for another 43 bits in the register. It might be worth extending case `c` to 8 bits (even if there is no immediate benefit) to make the next field automatically align to bit 24.

### Why Alignment Matters

1. **Hexadecimal Representation**: The hexadecimal representation is more predictable and easier to debug when the bitfields are aligned. Misaligned structures may lead to bit shifts that are not immediately obvious.

2. **Performance**: For certain hardware architectures, aligned data access is faster, as it minimizes the need for additional memory accesses or bit manipulations to fetch values that are not aligned to standard word boundaries.

3. **Maintainability**: Properly aligned `bitstructs` will make the code easier to maintain and reason about, especially in systems that involve complex bit-level manipulations.

### When to Use Alignment

- **Performance-Sensitive Applications**: When working with systems that require efficient access to memory (e.g., embedded systems, low-level device drivers), aligning bitfields to 4- or 8-bit boundaries can improve memory access times.

- **Clearer Representation**: If you need to debug or visually inspect the data in hexadecimal format, using aligned bitfields makes the structure easier to interpret.

## When to Use it

Bitstructs are particularly useful in the following real-world scenarios:

- **System Programming / Embedded Systems**: When you need to efficiently store and manipulate multiple flags or states in a small memory footprint (e.g., controlling hardware registers, flags in low-level protocols).
- **Performance-Sensitive Applications**: When performance is critical and you need to combine multiple flags or values quickly without requiring multiple individual variables.
- **When Flags Are Strongly Related**: If the flags you’re working with are inherently related (e.g., representing different properties or states of a single object), grouping them in a bitfield can make the data more cohesive and self-contained.

## When not to Use it

Sometimes it is better to avoid the `bitstruct` and use the more standard `struct` layout of your type.

- **Complex Type Requirements**: If the components of your flags or states have very different types or require complex logic that doesn’t fit naturally into bitwise manipulation, separating them into individual variables may offer clearer semantics and ease of understanding.
- **Higher-Level Applications**: In applications where flags are not as performance-critical or where ease of debugging and code clarity are more important than memory efficiency, using separate variables might be more maintainable and easier to reason about.
- **Use Cases with Lots of Interactions Between Flags**: If you need to frequently perform complex calculations or transformations involving the flags, keeping them separate might allow for clearer and more maintainable code.
