> [!question] AI Prompt
> Could `bitfield` and `tritfield` be something worth looking at next? I'm open for renaming them, and for a discussion about how to use them. They are my data stream types for I/O, network protocols, encryption etc.
>
> My hope is that they can be seen as fields/vectors of truth-values (`bitfield` is binary and only true/false, while `tritfield is ternary and includes ambiguous), instead of gigantic integers.
>
> Since they are not numeric values, arithmetic operators do not apply. Instead they support bitwise operators and I think all the `truthvalue` operators (including adjust/rotate) should have a vectorised alternative/overload.

Yes, absolutely. This looks like a very strong next step, especially given your goals around I/O, protocols, and crypto.

You are already pointing in that direction in TODO, and this can become one of the core differentiators of the language if treated as logical data streams rather than numbers.

**Why this is a good next target**

- It matches your domain goals directly: packet layouts, wire formats, bit-level parsing, masks, crypto primitives.
- It aligns with your existing truthvalue model instead of forcing integer semantics everywhere.
- It gives you a clean way to offer vectorized truthvalue operators with predictable behavior.

**Naming**

If you want to emphasize “stream semantics, not integer semantics,” I would consider:

- bitstream and tritstream: best for I/O framing and cursor-based operations.
- bitvector and tritvector: best for SIMD-like lane semantics.
- bitfield and tritfield: still good, just a bit more neutral/low-level.

My lean:

- Public types: bitstream and tritstream.
- Internal/runtime names: bitfield and tritfield.

This gives nice user-facing intent while keeping implementation names stable.

**Semantics I recommend**

- Treat them as fixed-length lane collections, not numeric values.
- No arithmetic operators.
- Support lane-wise logical operators.
- For tritfield, support lane-wise truthvalue operators:
	1. not
    2. and
    3. or
    4. rotate with by label
    5. adjust with towards label
    6. rotateUp/rotateDown aliases
    7. adjustUp/adjustDown aliases

- For bitfield:
    1. and/or/xor/not are native.
    2. Optional: promote to tritfield when calling ternary operators, or reject unless explicitly converted.

**Type rules**

- bitfield contains only false/true lanes.
- tritfield contains false/ambiguous/true lanes.
- Implicit widening allowed: bitfield to tritfield.
- Narrowing should be explicit and validated: tritfield to bitfield only if no ambiguous lanes (or with policy argument).

**Runtime representation**

- bitfield: one bit plane.
- tritfield: two bit planes (x0 and x1), with canonical ambiguous encoding.
- Maintain canonical invariant eagerly; this avoids ambiguous dual-form bugs and keeps lane-wise ops correct.

That two-plane design is exactly what makes vectorized rotate/adjust practical for whole words.

**How to use them (API shape)**

- Creation from bytes/hex/base64 and from protocol slices.
- Slice/concat/insert/extract operations by bit or trit offset.
- Endianness-aware pack/unpack helpers.
- Cursor-style read/write for protocol parsing.
- Constant-time equality/mask operations for crypto use.

**Compiler and overload strategy**

- Introduce dedicated types in checker first.
- Add operator overload resolution by type family:
    1. scalar truthvalue
    2. vector tritfield
    3. vector bitfield (subset behavior)

- Keep diagnostics explicit:
    1. no arithmetic on bitstream/tritstream
    2. suggest conversion or lane-wise operator alternatives

**Testing strategy for this feature**

- Property tests: vector operation equals scalar-per-lane map.
- Invariant tests: tritfield canonical form preserved after every operation.
- Roundtrip tests: encode/decode through byte-level I/O.
- Interop tests: bitfield promotion and tritfield narrowing behavior.

If you want, I can draft a concrete language-level mini spec next (operator table, promotion rules, literal syntax, and 10-15 example programs) so you can decide naming and ergonomics before implementing runtime code.

> [!question] AI Prompt
> That sounds great.
>
> One thing I want to add to the mix though: You suggest some ways to rename the types, but maybe we need a more fundamental change: `byte` (8 bits) is a logical unit for binary data, but there might not be an obvious ternary equivalent. Maybe 6 trits? Should that be labelled a `tryte`?
>
> How are large streams of (binary) data used in crypto and other algorithms today? How is XOR applied when the key is (often) much shorter than the data it is applied to?

Excellent question. This is exactly the right design pressure test.

**Byte vs ternary unit**
There is no universally adopted ternary equivalent of byte today.

Common options:

1. 5 trits, because it is very close to 8 bits in information:
   5 trits = log2(3^5) ≈ 7.92 bits
2. 6 trits, often called tryte in some ternary communities:
   6 trits = log2(3^6) ≈ 9.51 bits

So:

1. If your goal is binary interoperability, 5 trits is the cleanest conceptual neighbor to a byte.
2. If your goal is internal ternary convenience and alignment, 6-trit tryte can be nice, but it does not map cleanly to 8-bit boundaries.

My recommendation: do not make tryte a fundamental unit initially. Make trit the base unit and keep packing as an implementation detail.

**How large binary streams are used in crypto today**
Most practical crypto works on byte arrays, with internal block sizes like 128 bits, 256 bits, etc.

Typical pattern:

1. Data is a long byte stream.
2. A short secret key is expanded into a long keystream or round keys.
3. The expanded stream is combined with data (often XOR for stream-style encryption).

So the important abstraction is not key and plaintext same size from the start. It is deterministic expansion from key plus nonce/IV into as much pseudorandom material as needed.

**How XOR works when key is shorter**
Three cases:

1. Secure stream-style approach:
   Key plus nonce feeds a cipher/PRG, producing keystream matching data length.
   Ciphertext = plaintext XOR keystream.
   This is how modern stream ciphers and CTR-like constructions behave.

2. One-time pad:
   Key stream is truly random and same length as data, used once only.
   Perfect secrecy, impractical for most systems because of key distribution/storage.

3. Repeating-key XOR:
   Short key repeats over data directly.
   Usually insecure and mainly educational or legacy.

So for your type design, the secure model is:

1. Short key object
2. Nonce/IV
3. Keystream generator
4. Lane-wise combine operator on full-length streams

**What this implies for your language design**

You can keep your semantic model exactly as you want:

1. bitfield and tritfield are logical lane streams, not numbers.
2. Operators are lane-wise truth operators.
3. A separate keystream API handles key expansion and length matching.

If you want, next I can draft a compact spec for:

1. stream type names and unit policy
2. packing and binary interop rules
3. lane-wise operator table for bitfield and tritfield
4. crypto-oriented keystream and combine APIs that avoid repeating-key mistakes.

> [!question] AI Prompt
> > If your goal is binary interoperability, 5 trits is the cleanest conceptual neighbor to a byte.
>
> No, actually: I imagine `bitfield` (or `bitstream`) to be used when interacting with binary data sources (the most widely used form), and `tritfield`/`tritstream` for the less common case of interacting with ternary data interfaces such as file systems and special/future hardware such as memristive crossbars. The ideal size is divisible by 3 (or perhaps even a power of 3).
>
> > If you want, next I can draft a compact spec
>
> yes please

A compact spec for this direction makes sense, and it fits the goals you already sketched in TODO.

**Core Idea**
- `bitstream` and `tritstream` are ordered logical data streams.
- They are not numbers.
- Their semantics are lane-wise logical values:
  - `bitstream`: lanes are `false | true`
  - `tritstream`: lanes are `false | ambiguous | true`
- Arithmetic operators do not apply.
- Logical and structural stream operations do apply.

**Naming**
Recommended public names:
1. `bitstream`
2. `tritstream`

Recommended internal/runtime names:
1. `BitField`
2. `TritField`

Reason:
- `stream` matches your I/O, protocol, and crypto use case.
- `field` is still a good runtime term for packed storage.
- Avoid making `byte` or `tryte` fundamental language types at first.

**Units**
- Base unit for `bitstream`: `bit`
- Base unit for `tritstream`: `trit`
- Storage grouping is implementation-defined, not user-semantic.
- Optional library aliases later:
  - `byte = 8 bits`
  - `tryte = 6 trits` or `9 trits`, if you later want one
- But do not force a ternary analogue of byte into the core type system.

That is the important design boundary:
- users reason in bits and trits
- runtime may pack into words, blocks, pages, planes

**Type Model**
- `bitstream` is a strict subset of `tritstream`
- Implicit conversion allowed:
  - `bitstream -> tritstream`
- Explicit conversion required:
  - `tritstream -> bitstream`
- Narrowing fails unless all lanes are binary
- Optional explicit policies:
  - reject on `ambiguous`
  - map `ambiguous -> false`
  - map `ambiguous -> true`

**Operators**
For `bitstream`:

1. `!` → `~`
2. `&&` → `&`
3. `||` → `|`
4. `xor`
5. `==`
6. `!=`

For `tritstream`:

1. `!` → `~`
2. `&&` → `&`
3. `||` → `|`
4. `adjust(x, towards: y)`
5. `rotate(x, by: y)`
6. `adjustUp(x)`
7. `adjustDown(x)`
8. `rotateUp(x)`
9. `rotateDown(x)`
10. `==`
11. `!=`

Semantics:

- All are lane-wise.
- Lengths must match unless explicitly broadcast or expanded.
- No arithmetic like `+`, `-`, `*`, `/`.

**Length Rules**
Default rule:

- binary/logical operators require equal lengths

Optional later extension:

- broadcasting for length-1 operands only

Example:

- allowed: `bits && mask` if same length
- allowed later: `trits && true` if scalar broadcast is introduced
- disallowed initially: mismatched stream lengths

**Indexing and Slicing**
Required:

1. indexing by position
2. slicing by range
3. concatenation

Suggested shape:

- `x[i]`
- `x[a..<b]`
- `x ++ y`

Indexing result:

- `bitstream[i] -> boolean`
- `tritstream[i] -> truthvalue`

Slicing result:

- same stream type as source

**Construction and Literals**
I would keep literals conservative at first.

For `bitstream`:

1. binary string literal
2. hex literal via standard library constructor
3. byte-array interop constructor

For `tritstream`:

1. trit string literal using a fixed alphabet
2. explicit constructor from truthvalue sequence

Possible user-level forms:

```clawr
const bits = bitstream("10110010")
const trits = tritstream("FTATTF")
```

But the alphabet must be chosen carefully. Better options:

- `"01"` for bits
- `"0?1"` or `"FAT"` for trits

I would prefer:

- `0` = false
- `?` = ambiguous
- `1` = true

That keeps it compact and readable.

**Structural Operations**
Required standard-library operations:

1. `length`
2. `isEmpty`
3. `concat`
4. `slice`
5. `repeat`
6. `reverse`
7. `padLeft`
8. `padRight`
9. `take`
10. `drop`

For protocol and I/O work, also:
1. `readBits`
2. `writeBits`
3. `readTrits`
4. `writeTrits`
5. cursor/offset-based extraction

**Binary and Ternary Interop**
Binary-facing APIs:
- `bitstream.fromBytes(...)`
- `bitstream.toBytes(...)`

Ternary-facing APIs:
- `tritstream.fromTrits(...)`
- `tritstream.toTrits(...)`

If you later define packed ternary storage units, add them as library-level encodings, not core semantics:
- `packTrytes6`
- `unpackTrytes6`
- `packTrytes9`
- `unpackTrytes9`

That keeps language semantics independent from storage conventions.

**Runtime Representation**
Recommended:
- `bitstream`: one bit-plane
- `tritstream`: two bit-planes

For `tritstream`, use canonical encoding:
- `false = 00`
- `ambiguous = 01`
- `true = 11`

Do not allow dual ambiguous encodings in stored values.
Reason:
- lane-wise vector operators stay correct
- representation stays stable
- serialization is deterministic

**Vectorized Semantics**
`bitstream` operators map directly to bitwise operations on packed words.

`tritstream` operators map to word-parallel operations on the two planes:
- plane `x0`
- plane `x1`

This is the right model for your stated hardware and protocol goals:
- no integer semantics
- no carry propagation
- no accidental arithmetic interpretation

**Crypto Use**
The stream type itself should not imply encryption semantics.
Instead provide explicit APIs:

1. lane-wise combinators
2. keystream generators
3. encoding/packing functions

For binary crypto:
- `xor` is a first-class bitstream operation

For ternary crypto:
- `rotate` or another ternary mixing operator can play the equivalent lane-wise role, but that should be explicit in the crypto library, not implied by the language core.

Important distinction:
- stream types are data carriers
- crypto algorithms define how keys are expanded and combined

**Methods vs Free Functions**
Given your recent callable direction, I would keep core transformations as free functions first:
1. `rotate(stream, by: key)`
2. `adjust(stream, towards: mask)`
3. `xor(bits, with: key)` or an infix operator if you later add one

This keeps scalar and vector overloads aligned.

**Error Rules**
Diagnostics should be explicit:
1. arithmetic not supported on `bitstream`
2. arithmetic not supported on `tritstream`
3. stream lengths must match
4. cannot convert `tritstream` to `bitstream` because value may contain `ambiguous`

**Minimal v1 Feature Set**
If you want a disciplined first cut, I would define v1 as:

1. Types:
    - `bitstream`
    - `tritstream`

2. Operations:
    - indexing
    - slicing
    - concatenation
    - `!`, `&&`, `||`
    - `xor` for `bitstream`
    - `adjust`, `rotate`, `adjustUp`, `adjustDown`, `rotateUp`, `rotateDown` for `tritstream`

3. Conversions:
    - `bitstream -> tritstream`
    - explicit checked narrowing back

4. Interop:
    - bytes for `bitstream`
    - trit-sequence/text form for `tritstream`

5. Validation:
    - equal-length operands only

**Example Surface**
```clawr
const mask = bitstream("11110000")
const data = bitstream.fromBytes(packet)
const masked = data && mask

const key = bitstream.fromBytes(secret)
const mixed = xor(data, with: expandKey(key, to: data.length))

const flags = tritstream("10?01?")
const state = rotate(flags, by: tritstream("001?11"))
const filtered = adjust(state, towards: tritstream("111111"))
```

**Recommendation**
I would make these decisions now:

1. Public names: `bitstream`, `tritstream`
2. Base semantic units: bit and trit only
3. No core `tryte` yet
4. No arithmetic
5. Lane-wise truth semantics
6. `bitstream` as subset of `tritstream`
7. Two-plane canonical runtime for `tritstream`

Then later decide whether `tryte` means 6 or 9 trits, based on actual storage/interchange needs instead of trying to force a universal unit too early.

Natural next steps:

1. I can turn this into a concrete operator table with exact type signatures and coercion rules.
2. I can draft example syntax for literals, indexing, slicing, and byte/trit interop APIs.
3. I can draft a runtime design note for packed `bitstream`/`tritstream` in C, including the two-plane layout.