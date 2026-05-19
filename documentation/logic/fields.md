# Generic Blobs of Data

Clawr should be agnostic to hardware architectures. It should be possible to compile the same Clawr source code for a future ternary computer as well as for our current binary ones.

To foster portability, Clawr uses `bitfield` and `tritfield` to define blobs. They are explicit representations of binary and ternary data, but without explicit binary or ternary implementations. They allow future ternary computers to interact with binary data and vice versa.

> [!note]
> Sometimes referred to as [GF(2)](https://en.wikipedia.org/wiki/GF%282%29) algebra, binary fields can be said to operate with mod 2 arithmetics — XOR is mod 2 addition: $1 \oplus 1 = 0$. Logical operators and mod 2 arithmetics is practically inseparable.
>
> This is not true for ternary logic, however, and as a programmer — not a mathematician — I think the [Galois Field](https://en.wikipedia.org/wiki/Field_(mathematics)) perspective is less useful than the considering bits and trits as logical truth-values.

## `bitfield`

Existing protocols and file formats are all binary. Any data stored or transmitted in binary is understood by Clawr as a `bitfield`. A `bitfield` is a fixed-size string of binary (Boolean) values (true, false).  It is much like having a packed structure of `boolean` fields, except the individual values are all anonymised and can only be modified/extracted using the bitwise operators `&`, `|`, `^` and `~`.

On a binary processor, it works just as you would expect: bits are either 1 (`true`) or 0 (`false`). Bitwise operators are native to the processor architecture and will be executed very quickly (probably in a single tick if the entire `bitfield` fits in a single processor register).

On a ternary computer, each trit has three possible values — not just two. But a `bitfield` — as a model of binary data — supports only two values (true or false, one or zero).

The numeric values exist only at runtime and could be anything. {1, 0}, {1, -1}, {1, 2}, or whatever works for the runtime implementations and hardware. It is the compiler’s prerogative to select its own runtime representation. What is important, however, is that the choice is made consistently so that the intended information is always unambiguous. And that the encoded meaning of the binary data is interpreted correctly when converted to/from native ternary representations.

## `tritfield`

A `tritfield` is the ternary equivalent of a `bitfield`. The operators `&`, `|`, `~` translate intuitively to min/max/neg — where `false` < the third state < `true`, and `true == -false`.

Where a `bitfield` is a packed structure of `boolean` values, a `tritfield` is like a packed structure of anonymised `ternary` values.

On a ternary computer, a `tritfield` is a direct one-to-one mapping of trits. Just as `bitifield`is native to binary architectures, a `tritfield` is native to ternary. There is no de facto standard for ternary hardware at time of writing, so I cannot *guarantee* high performance for `tritfield` operations on ternary the way that I can `bitfield` operations on binary (though the expectation is that common operations *will* be native in mainstream processors).

On a binary computer, each trit must be represented by two bits. And operations will be more complex — and costly — than on ternary architectures. They also need an additional conversion step to/from native data. But semantically, they will have the same meaning on binary as on ternary hardware.

> [!warning]
> It is assumed that binary computers almost never need to process ternary data. The `tritfield` will be available regardless of architecture, but the recommendation is to not use `tritfield` unless explicitly compiling for ternary. The simple `ternary` type is however a different story.

The `ternary` type supports all the `boolean` operations plus some additional ones. All these operations apply equally (but bitwise – or “tritwise” maybe rather?) to `tritfield`. Not all these operations are syntactically in the form of operators (like `a & b`), but many are instead implemented as “free functions.” (Though they could perhaps be written as methods.)

Because some operations (like `MUL`) behave differently in balanced ternary from positive ternary (0, 1, 2), I have elected to emphasise truth-states and logics over GF(3) algebra. The following list maps **balanced** GF(3) operations to Clawr operators and functions:

- Add/subtract mod 3: `rotate(value, by: direction)`
- Rotate-up/-down: `rotate(by: true)` / `rotate(by: false)`
- Add/subtract clamped: `adjust(value, towards: extreme)`
- Increment-/decrement-clamped: `adjust(towards: true)`/`adjust(towards: false)`
- is-true/-false/-ambiguous: `==`
- Multiplication: `mask(value, using: trits)`
- Consensus & Gullibility (not truly GF(3) operations?) TBD

See details [here](../logic/ternary/ternary-algebra.md)

### Challenge: Ternary Filters

In binary systems, we have simple tricks to filter the bits of `bitfield` values.

- `a & mask`: filters the bits in `a`, returning zero for every bit position that is zero in the mask.
- `~mask`: inverts a mask. Quick way to get a filter for “everything *except* certain bits”
- `a &= ~mask`: unsets specific bits in `a` (where `mask` is 1)
- `a |= mask`: sets specific bits in `a` (where `mask` is 1)

These tricks do not work meaningfully on `tritfield`. We need new analogous operations to replace them.

- `a & mask` → `mask(value, using: trits)`
- `~mask` →  `rotate(~rotate(mask, by true), by: false)`
- `a | mask` → `adjust(value, selecting: trits)`

The analog to `~mask` is a bit verbose but it can probably be learned by programmers. Ternary algebra is inherently more complex than Boolean, and a programmer that takes on ternary should be prepared for that. But, on the other hand, maybe it could be worth it to hide this formula behind an API as well?

Not that the ternary analog to `~mask` becomes nonsensical if there are any `false` trits. There is no sensible way to define the inverse of a mask that mixes `ambiguous` and `false`, so it can be considered undefined and pointless. The only meaningful inversion must labour under the assumption that `false` trits do not exist.

The `mask(using:)` and `adjust(selecting)` functions should probably be implemented on the “backend,” the part of the compiler that translates the AST into executable machine code. The implementation of these operations will be different depending on if the hardware architecture is binary, balanced ternary of positive ternary. And the Clawr syntax must remain agnostic to this detail.

>[!note] the `mask(using:)` function
> The `mask` function can be seen as multiplication (in balanced GF(3)). If we map `false = -1`, `ambiguous = 0` and `true = 1`, `true * x == x`, `false * x == -x` and `ambiguous * x == ambiguous`. And this is indeed the output from the `mask`function.
>
> Wherever mask trits are `true`, their counterparts are passed through unchanged. Where they are `false` their counterparts are toggled. And `ambiguous` mask trits turn off their counterparts.
>
> This means that ternary masking is more powerful than binary masking — there is no equivalent to `mask(by: false)` in binary — but this is to be expected.

> [!note] the `adjust(selecting:)`function
> The `adjust` function is very much an antonym to the `mask` function. It passes trits through unchanged when the corresponding mask trit is `ambiguous` and forces the mask trit’s value wherever it is `true` or `false`.

## Example: Cross-Radix Encryption

Imagine a binary and a ternary computer that need to communicate using an encrypted channel. Respecting existing protocols, and the immense volume of currently operational binary hardware, the channel should probably be binary to limit the complexity to the ternary side only.

If the binary computer wants to send a message like “hello.” It starts by encoding the string as UTF-8 and then encrypts those bytes using a secret key. This is no different than how encrypted communication already works. On a binary computer UTF-8 and the encrypted message are both native. In Clawr, the form of this data is called a a `bitfield`.

The ternary computer then receives this `bitfield`, but here it is not native. It now has to perform a binary decryption algorithm on ternary hardware to generate the (“plain-text”) `bitfield`. And it can still not make proper sense of it as it is in binary. It will therefore have to perform an additional conversion step from binary bytes to ternary trytes — and ternary-encoded characters, so that it can understand the true meaning of the message — and correctly display the “hello” text to the user.

When it is time for the ternary computer to send its response, it will need to encode its ternary string as UTF-8 in a `bitfield` — and perform binary encryption on that data — before sending the encrypted message back to the binary computer.

If the channel is ternary instead of binary, the burden is shifted to the binary computer performing ternary encryption algorithms instead of the ternary system performing binary algorithms. Otherwise the process is identical.

> [!warning] Unresolved Issue
> Encryption typically applies a short key to a long message. There must be some way to split a `bitfield`/`tritfield` into small chunks that are operated upon piecemeal.

## Three Layers

In effect, there are three layers to a `bitfield` or a `tritfield`:

- **Meaning:** The actual intended information (expressible as native data structures).
- **Encoding:** The `bitfield` or `tritfield` encodes the intent as binary bits or ternary trits regardless of architecture, but made explicit in the choice of type.
- **Implementation:** The runtime and hardware opaquely store each trit as two bits or each bit as a stunted trit with hits on performance, or natively and quick.

## Ternary Bias

Ternary does not just have one implementation. There are two interpretations of what ternary should be: *balanced* ternary and *positive* ternary. How does positive ternary (0, 1, 2) affect logics? It seems that balanced ternary (-1, 0, 1) is much more “logical.” 

The discomfort comes from the fact that numerically — in positive ternary — `ambiguous == -true` and `false == -false`. And also because `false + false == false`, while `true + true == ambiguous`.

There are two fundamental ways to consider the bits in a computer: as logical truth-values or as Galois fields. For binary data, it does not matter which perspective is chosen. Binary operates on GF(2), 0 is false and 1 is true. XOR for example can be seen as a logical gate or a mod 2 addition.

But the distinction does matter in ternary. And Clawr has elected to use logics instead of GF(3) mathematics to relate to `tritfield` operations. It works very well for balanced ternary, but if there are chips that employ positive ternary, those operations could feel awkward.

The fundamental (Boolean) operations are trivial: AND translates to the minimum and OR translates to the maximum. For that to work, we order the labels `false`, `ambiguous`, `true` in ascending order. For balanced ternary, `false` is -1 and `true` is 1. For positive ternary, `false` is probably 0 and `true` is 2. This is already odd, because `false` and `true` have different values based on architecture, but let’s continue anyway.

Logical NOT (or negation) toggles `true` and `false`, but leaves the neutral state as-is. On balanced ternary this is simply a sign switch. On positive ternary, it is the operation `2 - x`.

### ADD/SUB

Balanced ternary can define rotation — `rotate(a by: b)` — as ADD/SUB in GF(3). And clamped addition/subtraction can be labelled `adjust(a, towards: b)`.

But on positive ternary, that translation fails. These operations no longer represent (native) addition/subtraction, because `false + false == 0 + 0 == false`, while `true + true == 2 + 2 == 1 (mod 3) == ambiguous`. To rotate up, we have to add `ambiguous` (1) to the input, and to rotate down, we add `true` (2).

The resolution is to implement `rotate(a, by: b)` as `a + b - 1` (mod 3) on positive ternary architectures, and as `a + b` on balanced ternary. It is unclear how this affects performance, but it does at least *seem* to be twice the work…

Maybe an optimisation trick could be applied to make actual algorithms more efficient? E.g. on positive ternary, `rotate(a, by: rotate_up(b))` -> `a + b`.

It would be awkward if we were trying to yield `a + b` specifically, but that is not the point. [^the-point] The algorithm is whatever it is: `rotate(a, by: rotate_up(b))` might be exactly what is needed to make the algorithm work for data encoded in positive ternary.

[^the-point]: Or is it *exactly* the point? Maybe encryption algorithms are explicitly formulated as GF(3) transformations? In that case it *would* be awkward. We would need a translation key from GF(3) algebra to logics to work on Clawr `tritfield`. But then again: are GF(3) algorithms portable between different ternary bias? Maybe, expressing them in terms of logic operations is the key to portability?

Frontend optimisations simplify the AST from Clawr’s perspective, but the backend might undo some of those optimisations if the hardware architecture contradicts Clawr’s idea of what is “fundamental.”

### Encryption Algorithms

Encryption algorithms do not operate on GF(3). Not do they operate on truth-values. They operate on discrete anonymised states. On a ternary processor, each trit has three states. What each state represents is not relevant to the encryption algorithm. Except in one case: when mixing two inputs (e.g. encrypting with a key).

The three states are ordered cyclically. Each of the three states has one of the others as its successor and the other as its predecessor. There is no endpoint; instead, the successor of the successor of the successor of x is x itself.

One of the three states means output the successor state in a defined cyclic order of states, another means output the predecessor, and the third state means leave the input state unchanged. This operation needs to be revertible, which is trivial. Just swap successor and predecessor in the scheme.

For balanced ternary, this rotation is implemented simply through mod 3 addition and subtraction. For positive-biased ternary it’s slightly more complicated — as already discussed. Avoiding GF(3) terminology entirely can make algorithms more portable.

Clawr uses truth-values where `true` indicates the positive direction (“rotate up”) and `false` indicates the negative direction (“rotate down”). The normal ordering of the states — specifically for interpreting AND as MIN and OR as MAX — is that `false < ambiguous < true`. To enable rotation (past the endpoints) `false` is considered the successor of `true`, and `true` the predecessor of `false` as if `true < false`, but that only applies to the rotation family of functions (`rotateUp`, `rotateDown` and `rotate(_, by:)`).

So in an encryption algorithm written in Clawr, mixing message data with a key is done as `rotate(message, by: key)` and unmixing is done by `rotate(message, by: ~key)`.
