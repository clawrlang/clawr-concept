# Notation

There are some options for ternary notation.

```clawr
// All the below literals numerically translate to -8 in decimal.

0t-0+ // Used in academic papers to emphasise the numeric values (-1, 0, +1)
0tT01 // Used by academics as an extension of binary notation
      // - the T associates with “third state” (which should be 0) not false
0tN0P // N for “negative”/false, P for “positive”/true
0tD0U // D for “down,” U for “up”
```

Of the listed options, I prefer `0tN0P`.

- The `-0+` alternative is unfeasible in programming languages as the digits clash with operator syntax.
- The other academic notation is also problematic as the `T` symbol triggers association with the term “third state,” which ought to be the zero state, not the false state.

## Ternary Hex Notation

Binary has a compact notation called hexadecimal, abbreviated to “hex,” (`0x` prefix). Every hex-digit represents 4 binary bits, making translation between representations relatively straight-forward.

Ternary should have a similar compression, probably using three trits per digit. Unfortunately, there is no established notation for base-27. It should be a notation programmers can understand/memorise.

As we use balanced ternary digits (-1, 0, +1), we should probably use balanced base-27 digits (-13–+13) too. One idea could be to use letters much like hex does, but what about negative values? We could use letter casing to choose sign:

- `a`–`m`:  +1–+13
- `A`–`M`:  -1–-13
- `0`

But maybe there are better mnemonics? Speculative: The previously proposed notation emphasises the first trit as more important as it alone defines the overall sign of the triplet’s numerical value. The letters `a` and `A` represent exact opposites (each trit negated) rather than similar values.

If, however, this notation were used for numeric values, this balanced form can be preferred.