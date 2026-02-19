# Ternary Hex Notation

Binary has a compact notation called hexadecimal, often abbreviated to “hex,” (`0x` prefix). Every hex-digit represents 4 binary bits, making translation between representations relatively straightforward.

Ternary should have a similar compression, probably using three trits per digit. Unfortunately, there is no established notation for base-27. It should be a notation programmers can understand/memorise.

As we use balanced ternary digits (-1, 0, +1), we should probably use balanced base-27 digits (-13–+13) too. One idea could be to use letters much like hex does, but what about negative values? We could use letter casing to choose sign:

- `a`–`m`:  +1–+13
- `A`–`M`:  -1–-13
- `0`

But maybe there are better mnemonics?

Speculative: The notation proposed above emphasises the first trit as more important as it alone defines the overall sign of the triplet’s numerical value. The letters `a` and `A` represent exact opposites (each trit negated) rather than common trit values.

If the notation is only about selecting trit values, maybe `0tDPP` ($-5_{10}$) should be similar to `0t0PP` ($4_{10}$)? With the proposed notation they would be `E` and `d` respectively, which do not signal any kind of equality. If, on the other hand, the notation is understood as numeric digits, this form might be preferred. 

And also: which trit combinations should be considered close and which farther apart? Should `0tP00` be considered close to `0tN00`? Should `0t0P0` be considered  closer or farther apart? It is probably impossible to design a numeric system (using existing ASCII—or even Unicode) that is intuitive regarding which trit is what. Programmers will either have to memorise them or use a tool that translates it.

Another consideration is the fact that a lowercase `l ` can easily be confused with a 1, and uppercase `O` and `Q` can be mistaken for zeroes. An uppercase `Z` looks a lot like a 2. As it happens, though: the notation does not include the digit 1, nor the letters Z, O or Q. That is a happy, serendipitous accident. So this might be a useful notation that could spread to other fields and languages.

