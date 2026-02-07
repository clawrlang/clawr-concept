# Generic Blobs of Data

Clawr should be agnostic to hardware architectures. It should be possible to compile Clawr for a future ternary computer as well as for our current binary ones.

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
> It is assumed that binary computers almost never need to process ternary data. The `tritfield` will be available regardless of architecture, but the recommendation is to not use `tritfield` unless explicitly compiling for ternary

The `ternary` type supports all the `boolean` operations plus some additional ones. All these operations apply equally (but bitwise – or “tritwise” maybe rather?) to `tritfield`. Not all these operations are syntactically in the form of operators (like `a & b`), but many are instead implemented as “free functions.”

- Rotate-up/-down
- Increment-/decrement-clamped
- is-true/-false/-unset
- Add/subtract clamped
- Add/subtract mod 3
- Consensus & Gullibility

See details [here](../logic/ternary/ternary-algebra.md)

## Example: Cross-Radix Encryption

Imagine a binary and a ternary computer that need to communicate using an encrypted channel. Respecting existing protocols, and the immense volume of currently operational binary hardware, the channel should probably be binary to limit the complexity to the ternary side only.

If the binary computer wants to send a message like “hello.” It starts by encoding the string as UTF-8 and then encrypts those bytes using a secret key. This is no different than how encrypted communication already works. In Clawr, this data is a (native) `bitfield`.

The ternary computer then receives this `bitfield`, but here it is not native. It now has to perform a binary decryption algorithm that generates a new (“plain-text”) `bitfield`. But it can still not make sense of it as it is in binary. It will therefore have to perform an additional conversion step from binary bytes to ternary trytes, so that it can understand the intent of the message — and correctly display the “hello” text to the user.

When the ternary computer sends its response, it will need to encode the message as UTF-8 in a `bitfield` and perform binary encryption, before sending the encrypted message back to the binary computer.

If the channel is ternary instead of binary, the burden is shifted to the binary computer performing ternary encryption algorithms instead of the ternary system performing binary. Otherwise the process is the same.

## Three Layers

In effect, there are three layers to a `bitfield` or a `tritfield`:

- **Meaning:** The actual intended information (expressible as native data structures).
- **Encoding:** The `bitfield` or `tritfield` encodes the intent as binary bits or ternary trits regardless of architecture, but made explicit in the choice of type.
- **Implementation:** The runtime and hardware opaquely store each trit as two bits or each bit as a stunted trit with hits on performance, or natively and quick.
