# Bytes and Registers

There are two candidates for a ternary byte: the 6 trit “tryte,” (“close” to the value range of the 8 bit byte—$2^8 = 256$ versus $3^6 = 729$) and the 9 trit “trite” ($9 = 3^2 ≈ 8 = 2^3$). Five trits (243) would be even closer to the range (256) of a byte, but 5 is a very uneven number. Six is at least $2 \times 3$, but even that is a bit uneven. The 9 trit is the cleanest size.

| Ternary | Decimal |
| ------: | ------: |
|   $3^0$ |       1 |
|   $3^1$ |       3 |
|   $3^2$ |       9 |
|   $3^3$ |      27 |
|   $3^4$ |      81 |
|   $3^5$ |     243 |
|   $3^6$ |     729 |
|   $3^7$ |   2 187 |
|   $3^8$ |   6 561 |
There is also a term *tribble* that refers to a set of three trits. This is not a useful definition of a byte, but it might be meaningful when grouping digits. In decimal we often add large numbers in groups of three digits to clearly see thousands, millions etc. In binary, we often express numbers in hex values (one group of four bits is represented by one hex digit). In ternary notation, grouping trits by three is reasonable.

- 1,000,000 -- is how the write one million in decimal (English notation; in Swedish we use spaces instead of commas)
- `0xA0 == 0b1010_0000` are common ways to denote numbers in binary (binary bit array identified by `0b` prefix)
- `0tUDD_U0U_DD0` proposed ternary notation (`0t` prefix, `U` for “up”/+1, `D` for “down”/-1)
- `0t1TT_101_TT0` alternate ternary notation (`T` = -1)
- +--,+0+,--0 non-programming alternative (maybe only used in academic settings—including this documentation)

## Registers

A ternary register is probably 27 ($3^3$) or 81 ($3^4$) trits, but 54 trits ($2 \times 27$) is already enormous compared to 64 bits.

27 trits can store 7,625,597,484,987 different values.  That is ~ 2,000 times the capacity of a 32 bit register (4,294,967,296 different values). If we double the size of the registers to 64 bits ($1.8 \times 10^{19}$ values) and 54 trits ($5.8 \times 10^{25}$ values), the difference is a factor of 4 million in favour of the—physically smaller!—ternary register.

In a well-designed architecture it might make more sense to use 81 trit registers. That allows a ridiculous amount of values—$4.4342648824 \times 10^{38}$ or 443 undecillion!—and is probably not strictly necessary. Ever. But maintaining even potentials of three makes the architecture elegant and might make the addressing of memory more efficient.

Or trit alignment might turn ut to be relatively unimportant in this case…?
