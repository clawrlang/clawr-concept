# Ternary Support in Azlan

My first instinct was that supporting ternary logic must require a whole new language.

Then I thought that it is just the base datatypes and some operations that need change. We can call it a *dialect* rather than a new language.

Now I wonder if there is *any* need for language-level differences or if the only differences is in the compiler. There will probably be some, but I suspect that ternary language support is a superset to binary, not an altogether different set of datatypes and/or operations. That might be solved by adding a full ternary mode and a binary-compatible mode.

A ternary program will probably still need bitfields. The only difference is that when you *know* that each bit has three states, you can choose to operate three-state Booleans (a new datatype) instead of just the basic true/false kind. You will then have access to `MIN`/`MAX` for that datatype (the ternary version of `AND`/`OR`). This means that you can write code for binary systems and run them on ternary architectures.

In other words, the programmer can *choose* whether to write explicit ternary code *or* agnostic code. By choosing explicit ternary, some additional functionality is enabled. When choosing compatible code, only binary Booleans are available.

Integers are 32 or 64 bits when compiling for binary architectures, but 27 or 54 trits when compiling for ternary.

$$2^{32} = 4,294,967,296$$
$$3^{27} = 7,625,597,484,987 \gg 2^{32}$$
$$3^{20} = 3,486,784,401 ≈ 2^{32}$$
$$2 \ \text{trits} \lesssim 3 \ \text{bits}$$

A ternary *register* in a processor will probably be 27 ($3^3$) or 81 ($3^4$) trits, and those should be the default sizes when explicitly targeting ternary.

But in agnostic code, 54 ($2 \times 27$) trits is more than enough to match 64 bit integers ($5.8 \times 10^{25} ≈ 4,000 \times 1.8 \times 10^{19}$). That’s a factor of 4,000!

## Ternary datatype

Azlan has a `boolean` datatype. It is declared as
```azlan
enum boolean { false, true }
let false = boolean.false
let true = boolean.true
```

A `boolean` is a value that can be either `true` or `false`. This can be represented as `1` and `0` respectively, or as `+` and `-`. In binary, there is only one choice, but in ternary both options are possible.

```azlan
boolean.true = 1   // defined implicitly by the compiler
boolean.false = 0  // when using binary compiler
boolean.false = -1 // when using ternary compiler
```

Choosing `0` and `1` might aid compatibility (or it might turn out to be irrelevant because conversion is going to be complex anyway). Choosing `-` and `+` fits well with the `ternary` datatype (where `0` would be reasonable to represent “unknown” or “undefined”—neither absolutely `true` nor absolutely `false`).

```azlan
enum ternary { down, zero , up }
ternary.down = -1 // defined implicitly by the compiler
ternary.zero = 0  // defined implicitly
ternary.up = 1    // defined implicitly
```

It is unlikely that the `ternary` datatype will be used all that much. The `boolean` type will probably remain important even in ternary logic. That means using only two of the three existing values, which could be seen as a slight efficiency loss.

## Bitfield and bitstruct

A `bitfield` is a string of bits that fit in a register (or in a `bitstruct` field). Literal values use Hex or binary notations, not decimal numbers. A `tritfield` datatype may be warranted. It should use a ternary notation (I propose `D0U` rather than `T01` or `-0+`). In that case, the `bitfield` would be constrained to pure `boolean` values only (even in ternary mode), while each`tritfield` trit would have a `ternary` value (and would not be available in binary-compatible mode).

The `bitstruct` datatype might be misnamed when using ternary logic. In reality it is more of a `SingleRegisterStruct`, but that is a very long name for something that we might want to encourage using often. Maybe another similar type should be added: `tritstruct`? But that feels very wrong as it would not change anything of consequence compared to `bitstruct`. The best approach is probably to stick with one `bitstruct` datatype, but allow `tritfield`and `ternary` (single trit) fields in ternary mode.

## Emulated trits in binary mode

It might be possible to support `tritfield` in binary mode. It would be inefficient as each trit would have to be modelled by to bits. The alignment of bits in a `tritstruct` might suffer, which would cause additional performance impact.
