# V1 Spec

**1. Conceptual Layers**
1. Stream: transport over time at I/O boundaries.
2. Field: fixed-size lane container for whole-value operations.
3. Lane: the atomic logical value (`bit` or `trit`).

No first-class chunk type in v1.

**2. Core Types**
1. `bitfield[N]`: N binary lanes (`false | true`).
2. `tritfield[N]`: N ternary lanes (`false | ambiguous | true`).

`N` is a compile-time constant positive integer.

**3. Type Relations**
1. `bitfield[N]` can widen to `tritfield[N]`.
2. `tritfield[N]` to `bitfield[N]` is explicit and checked.
3. Conversions require same length unless an explicit reshape API is used.

**4. Operators**
Primary lane operators for both field types:
1. `~` lane-wise negation.
2. `&` lane-wise conjunction.
3. `|` lane-wise disjunction.
4. `==` lane-wise equality producing one field-wide predicate or mask (decide one policy early).
5. `!=` companion to equality.

Additional operators:
1. `bitfield`: `^`
2. `tritfield`: `rotate(x, by: y)` and `adjust(x, towards: y)`.
3. `tritfield`: aliases `rotateUp`, `rotateDown`, `adjustUp`, `adjustDown`.

No arithmetic operators on either field type.

**5. Length Rules**
1. Binary/ternary lane operators require equal lengths.
2. No broadcasting in v1.
3. Mismatched lengths are compile-time errors when known, runtime errors otherwise.

**6. Indexing and Slicing**
1. `field[i]` returns one lane (`boolean` for bitfield, `truthvalue` for tritfield).
2. `field[a..<b]` returns same field family with length `b-a`.
3. Concatenation is supported: `concat(a, b)`.

**7. Construction**
1. Literal or constructor from lane text.
2. Constructor from lane arrays.
3. Conversion constructors between field families.

Suggested textual alphabets:
1. bitfield: `0/1`.
2. tritfield: `0/?/1` (clear and compact).

**8. I/O Model**
Streams exist only as interfaces, not primary compute values:
1. `readBits(n) -> bitfield[n]`
2. `readTrits(n) -> tritfield[n]`
3. `writeBits(bitfield[n])`
4. `writeTrits(tritfield[n])`

File, socket, and device APIs are stream-oriented.
Transforms and crypto primitives are field-oriented.

**9. Runtime Requirements**
1. `bitfield`: packed binary representation.
2. `tritfield`: canonical two-plane representation.
3. Canonical ternary invariant must be preserved after every operation.
4. Runtime may choose internal chunk width automatically.

**10. Diagnostics**
Required error classes:
1. Unsupported arithmetic on field types.
2. Length mismatch for lane operators.
3. Invalid narrowing from tritfield to bitfield due to ambiguous lanes.
4. Unsupported operator for field family.

**11. Security/Crypto Guidance**
1. Keep lane operators deterministic and side-effect free.
2. Keep key expansion separate from lane combination.
3. Never imply repeating-key behavior as a default.
4. Provide explicit keystream APIs at library level.

**12. Minimum Standard Library Surface**
1. `length`
2. `slice`
3. `concat`
4. `repeat`
5. `reverse`
6. `countTrue` and `countAmbiguous` (for tritfield)
7. `all` and `any`
8. conversions to and from byte/trit encodings

## V2 Extension Path (Optional)

1. Add chunk hints as optional performance annotations, not type identity.
2. Add stream buffering policies for protocol parsing.
3. Add broadcasting rules if needed.
4. Add hardware-accelerated profiles for target backends.
