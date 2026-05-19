> [!question] AI Prompt
> I just learned that `rotateUp(false) && rotateDown(true) != ambiguous´`. (The same is true if I replace `&&` with `||`.) That is a problem. I would prefer if all `ternary` operators can be implemented using bitwise operators, because I plan to have `bitfield` and `tritfield` interpreted as blocks/lists/streams/vectors of `ternary` scalars.

That's a significant constraint — and a good one to discover early. Let me think through why the problem occurs.

With the dual representation, `rotate_up(false) == 0b01` and `rotate_down(true) == 0b10`. Then:

```
0b01 & 0b10 == 0b00  // false, not ambiguous!
0b01 | 0b10 == 0b11  // true, not ambiguous!
```

Both are wrong. The issue is that `&` and `|` treat the two bits independently, but the two bits of a ternary value are not independent — they encode a single three-valued quantity.

This fundamentally breaks the vectorization goal, because bitwise operations on a `tritfield` would corrupt values that mix `0b01` and `0b10` ambiguous representations.

The implication seems to be that **lazy normalization is incompatible with the `tritfield`-as-vector-of-ternary requirement**. If you want `&` and `|` to work correctly across a `tritfield`, every trit must be in canonical form — meaning eager normalization is not just a preference but a necessity.

With eager normalization enforced (so `ambiguous` is always `0b01`), does the `tritfield` arithmetic work out correctly? It would be worth verifying that `&&`, `||`, and `!` all produce canonical results when both inputs are canonical — i.e. that no operation on `{0b00, 0b01, 0b11}` can produce `0b10` as output.

> [!question] AI Prompt
> Well, I believe all three Boolean operators will work correctly, even when combined into complex expressions. It is when we introduce the ternary operators that things become thorny. And the lookup idea for rotate and adjust is great for scalars, but seem highly inefficient when operating on vectors of trits.

Yes, exactly. For scalars a lookup table or a couple of branches is fine. But for `tritfield` vectors you want something that can operate on many trits in parallel using native bitwise instructions — the same way binary `&` and `|` operate on all bits of a word simultaneously.

So the question becomes: can `rotate` and `adjust` be expressed as a composition of bitwise operations on the two-bit representation, assuming canonical form (`ambiguous == 0b01`)?

Let's name the two bits. For a ternary value `x`, let's call the high bit `x1` and the low bit `x0`. Then:

- `false == 0b00`: x1=0, x0=0
- `ambiguous == 0b01`: x1=0, x0=1
- `true == 0b11`: x1=1, x0=1

Notice that `x1 == 1` implies `x0 == 1` in canonical form — `x1` is never set without `x0`. So `x1 <= x0` always holds.

For `rotate_up` the mapping is `false→ambiguous, ambiguous→true, true→false`, i.e.:

- `00 → 01`
- `01 → 11`
- `11 → 00`

Can that be expressed purely in terms of bitwise ops on `x1` and `x0`? That seems like the right question to attack next. Do you want to work through the boolean algebra, or would a truth-table approach be more useful?

> [!question] AI Prompt
> Yes please. And: is there a better choice of bit values that makes the implementation easier?

Let's be systematic. There are only 3 values to assign to 2-bit patterns, chosen from `{00, 01, 10, 11}`. We need to pick 3 of those 4 patterns. There are `C(4,3) = 4` possible subsets, giving `4 × 3! = 24` possible encodings total. That's small enough to enumerate and evaluate.

The three operators we need to express as bitwise ops are `!`, `rotate_up`, and `rotate_down` (since `&&` = `&` and `||` = `|` already work for any encoding where false < ambiguous < true in terms of bit pattern, as long as we pick consistently).

Actually, let me think about what constraints the Boolean operators impose first, since those must work for `tritfield` vectors too.

For `&` to implement `&&` correctly, we need:

```
false  & false  == false
false  & true   == false
true   & true   == true
false  & ambiguous == false
true   & ambiguous == ambiguous
```

For `&` to work as bitwise-AND on the patterns, `false` must have a zero in every bit position where `ambiguous` or `true` might have a one. That means `false == 00` is essentially forced — any other pattern for false would risk `false & x` producing a non-false result.

Similarly for `|`, `true == 11` is essentially forced — `true | x` must always produce `true`, which requires `true` to have ones everywhere.

So `false == 00` and `true == 11` are fixed. That leaves `ambiguous` as either `01` or `10` — the only remaining choice. Let's evaluate both for `rotate_up`:

**Encoding A**: false=00, ambiguous=01, true=11

```
rotate_up: 00→01, 01→11, 11→00
```

**Encoding B**: false=00, ambiguous=10, true=11

```
rotate_up: 00→10, 10→11, 11→00
```

So there are really only two candidate encodings. Let me build truth tables for `rotate_up` for both, expressing the output bits in terms of input bits `x1, x0`:

**Encoding A** (ambiguous=01):

|x1|x0|y1|y0|
|---|---|---|---|
|0|0|0|1|
|0|1|1|1|
|1|1|0|0|

Reading off the boolean functions:

- `y0 = ~x1` (gives 1, 1, 0 ✓)
- `y1 = x0 & ~x1`... let's check: 0&1=0, 1&1=1, 1&0=0 ✓

So `rotate_up` in encoding A: `y1 = x0 & ~x1`, `y0 = ~x1`. Or more compactly: `y0 = ~x1`, `y1 = x0 & y0`.

**Encoding B** (ambiguous=10):

|x1|x0|y1|y0|
|---|---|---|---|
|0|0|1|0|
|1|0|1|1|
|1|1|0|0|

- `y1 = ~x0` (gives 1, 1, 0 ✓)
- `y0 = x1 & ~x0`... check: 0&1=0, 1&1=1, 1&0=0 ✓

So `rotate_up` in encoding B: `y1 = ~x0`, `y0 = x1 & ~x0`. Structurally identical to A, just with bits swapped.

Now `rotate_down` (the reverse mapping):

**Encoding A**: 00→11, 01→00, 11→01

|x1|x0|y1|y0|
|---|---|---|---|
|0|0|1|1|
|0|1|0|0|
|1|1|0|1|

- `y0 = ~x0 | x1`... check: 1, 0, 1 ✓
- `y1 = ~x1 & ~x0`... check: 1, 0, 0 ✓

**Encoding B**: 00→11, 10→00, 11→10

|x1|x0|y1|y0|
|---|---|---|---|
|0|0|1|1|
|1|0|0|0|
|1|1|1|0|

- `y1 = ~x1 | x0`... check: 1, 0, 1 ✓
- `y0 = ~x1 & ~x0`... check: 1, 0, 0 ✓

Again structurally symmetric. So neither encoding wins on `rotate`. What about `!`?

**Encoding A**: 00→11, 01→01, 11→00

- `y1 = x1 | ...` hmm: need 1→0, 0→0, 0→1... that's just `~x1 & ~x0` — wait, that's 1,0,0. No.
- Actually: `y1=x0 & ~x1`? No... Let me just read it: outputs are 11, 01, 00.
- `y0`: 1, 1, 0 → `y0 = ~x1` ✓
- `y1`: 1, 0, 0 → `y1 = ~x1 & ~x0` ✓

**Encoding B**: 00→11, 10→10, 11→00

- `y0`: 1, 0, 0 → `y0 = ~x1 & ~x0` ✓
- `y1`: 1, 1, 0 → `y1 = ~x0` ✓

Both work. Now the key question — do these bitwise expressions compose correctly when applied across a word of packed trits, i.e. interleaving `x1` and `x0` bits across a register? That depends on whether operations on one trit's bits "bleed" into adjacent trits' bits. Since all the operations above are purely bitwise (no addition, no carries), there is no bleed. They're safe to vectorize.

**Summary**: both encodings work equally well and are structurally mirrors of each other. The current choice of `ambiguous=01` (Encoding A) is fine. The more important result is that `rotate_up`, `rotate_down`, and `!` all decompose into 2-3 bitwise operations each — which means they can operate on packed `tritfield` vectors efficiently, with no branching and no carry propagation.

Would you like to work through `mask` and `adjust` next, or verify the `rotate` compositions with concrete examples first?

> [!question] AI Prompt
> So, lets see if I understad the algorithm… When applying rotate-up/-down to a vector, we will need to first apply a mask that clears every other bit to get the `x0`s without the `x1`s, then again to get the `x1`s without the `x0`s. Then shift those masked vectors by one in either direction to align with the `y0`s and `y1`s respectively before we can compute the resulting bit values. Then we finally combine the `y0`s and `y1`s into the `tritfield`.
>
> (Maybe it is more efficient then to maintain two separate `bitfield`s — one for the 0-bits and one for the 1-bits — instead of a single double-length vector? We would not need the masking and recombination steps, right?)

Yes, you've got the algorithm right. The interleaved layout has real overhead: mask, shift, compute, shift back, recombine — every operation.

The split representation (two parallel `bitfield`s, one for `x0` and one for `x1`) eliminates all of that. You just operate directly on the two planes. For encoding A (ambiguous=01):

**`rotate_up`**: `y0 = ~x1`, `y1 = x0 & ~x1`

```c
y0 = ~x1;
y1 = x0 & y0;  // reuse ~x1
```

Two operations, no masking, no shifting.

**`rotate_down`**: `y0 = ~x0 | x1`, `y1 = ~x1 & ~x0`

```c
y1 = ~x1 & ~x0;
y0 = y1 | x1;  // ~x0 & ~x1 | x1 == ~x0 | x1... wait
```

Hmm, let me recheck: `~x0 | x1` — that doesn't simplify as neatly. But it's still just two native bitwise ops on full-width words.

**`&&` and `||`**: already just `&` and `|` on either plane independently... actually wait. That's not right either — `&&` and `||` need to operate on the _value_, not the individual bit planes independently. We should verify those still work correctly in the split representation before committing to it.

Do you want to work through the Boolean operators in the split layout before going further?

> [!question] AI Prompt
> Isn't `a && b` simply `a0 & b0`, `a1 & b1`?

Yes, exactly — because `&&` is just `&` on the interleaved representation too, and splitting doesn't change that. Each bit plane is operated on independently, and since `&&` maps to `&` bitwise, it's just:

```
result0 = a0 & b0
result1 = a1 & b1
```

And similarly `||` is:

```
result0 = a0 | b0
result1 = a1 | b1
```

And `!` from the truth table (`y0 = ~x1 & ~x0`, `y1 = ~x1 & ~x0`... wait, those were the same, that can't be right. Let me recheck encoding A:

`!`: 00→11, 01→01, 11→00

- `y0`: 1, 1, 0 → `~x1`
- `y1`: 1, 0, 0 → `~x1 & ~x0`

So:

```
result0 = ~x1
result1 = ~x1 & ~x0  // or result1 = result0 & ~x0
```

So the split representation is clean across all operators — no masking, no shifting, no recombination. The cost is that a `tritfield` of `n` trits requires `2n` bits of storage split across two words rather than one `2n`-bit word, but the operational simplicity seems well worth it.

It also maps nicely onto the scalar case — a scalar `ternary` is just a `tritfield` of length 1, where `x0` and `x1` are single bits.

> [!question] AI Prompt
> How does this apply to rotate-by and adjust-towards?

For `rotate(x, by: y)` and `adjust(x, towards: y)`, the second argument is itself a ternary value, so we now have four input bit planes: `x0`, `x1`, `y0`, `y1`.

Let's build the truth tables. There are 9 input combinations (3×3):

**`rotate(x, by: y)`** — cycles x in the direction of y, identity when y=ambiguous:

|x|y|result|
|---|---|---|
|false|false|true|
|false|ambiguous|false|
|false|true|ambiguous|
|ambiguous|false|false|
|ambiguous|ambiguous|ambiguous|
|ambiguous|true|true|
|true|false|ambiguous|
|true|ambiguous|true|
|true|true|false|

In bit planes (encoding A, ambiguous=01):

|x1|x0|y1|y0|r1|r0|
|---|---|---|---|---|---|
|0|0|0|0|1|1|
|0|0|0|1|0|0|
|0|0|1|1|0|1|
|0|1|0|0|0|0|
|0|1|0|1|0|1|
|0|1|1|1|1|1|
|1|1|0|0|0|1|
|1|1|0|1|1|1|
|1|1|1|1|0|0|

Now we need boolean expressions for `r0` and `r1` in terms of `x0, x1, y0, y1`. This is a 4-variable Karnaugh map problem. Let me read off `r0` and `r1`:

`r0` is 1 for rows: (false,false), (ambiguous,true), (true,false), (true,ambiguous) — i.e. when result is true or ambiguous:

- `r0 = ~x1&~x0&~y0 | x0&~x1&y1 | x1&~y1&~y0 | x1&y0&~y1`

That's getting complex. Let me see if there's a pattern... The result is essentially `rotate_up(x)` when `y=true`, `rotate_down(x)` when `y=false`, and `x` when `y=ambiguous`. So:

```
result = y==true  ? rotate_up(x)
       : y==false ? rotate_down(x)
       : x
```

In bit planes that's a mux, selectable by `y`:

```
rotate_up_r0   = ~x1
rotate_up_r1   = x0 & ~x1

rotate_down_r0 = ~x0 | x1
rotate_down_r1 = ~x1 & ~x0

// select based on y:
// y==true:      y1 & y0
// y==false:     ~y1 & ~y0
// y==ambiguous: ~y1 & y0

r0 = (y1 & y0 & rotate_up_r0) | (~y1 & ~y0 & rotate_down_r0) | (~y1 & y0 & x0)
r1 = (y1 & y0 & rotate_up_r1) | (~y1 & ~y0 & rotate_down_r1) | (~y1 & y0 & x1)
```

That's correct but verbose. The important point is that it's still pure bitwise ops — just more of them. Whether this simplifies further I'm not certain without more careful Karnaugh reduction.

**`adjust(x, towards: y)`** follows the same mux structure, just with `adjust_up` and `adjust_down` instead:

```
adjust_up_r0  = x0 | ~x1   // min(x+1, true): false→ambiguous, ambiguous→true, true→true
adjust_up_r1  = x1 | (x0 & ~x1)  // hmm, let me verify...
```

Actually — should we verify the `adjust` truth table first before deriving the bit expressions? I want to make sure I have the semantics right: `adjust_up(true) == true` (clamped), `adjust_down(false) == false` (clamped)?

> [!question] AI Prompt
> ok

**`adjust_up`**: false→ambiguous, ambiguous→true, true→true (clamped)

|x1|x0|r1|r0|
|---|---|---|---|
|0|0|0|1|
|0|1|1|1|
|1|1|1|1|

- `r0 = 1` always... wait, that's just `r0 = x0 | ~x1`. Check: 0|1=1, 1|1=1, 1|0=1 ✓. Actually simpler: `r0 = 1` for all valid inputs. Since invalid inputs (`x1=1, x0=0`) can't occur in canonical form, `r0 = ~x1 | x0` which is always true for canonical inputs. So just `r0 = 1`... but that's not a bitwise operation we can use on a vector. We'd need `r0 = x0 | ~x1`.
- `r1 = x0` — check: 0, 1, 1 ✓

So `adjust_up`: `r0 = x0 | ~x1`, `r1 = x0`. Very clean.

**`adjust_down`**: false→false, ambiguous→false, true→ambiguous (clamped)

|x1|x0|r1|r0|
|---|---|---|---|
|0|0|0|0|
|0|1|0|0|
|1|1|0|1|

- `r0 = x1` — check: 0, 0, 1 ✓
- `r1 = 0` always — check: 0, 0, 0 ✓

So `adjust_down`: `r0 = x1`, `r1 = 0`. Extremely clean.

That's a satisfying asymmetry — `adjust_down` is simpler than `adjust_up`. Now the full `adjust(x, towards: y)` mux:

```
r0 = (y1&y0 & (x0|~x1)) | (~y1&~y0 & x1) | (~y1&y0 & x0)
r1 = (y1&y0 & x0)        | (~y1&~y0 & 0)  | (~y1&y0 & x1)
```

Simplifying `r1`:

```
r1 = (y1&y0 & x0) | (~y1&y0 & x1)
   = y0 & ((y1 & x0) | (~y1 & x1))
```

That's quite compact. `r0` is messier but still pure bitwise ops.

The overall picture is clean: every ternary operator on `tritfield` vectors decomposes into a handful of bitwise operations on the two split bit planes, with no branching, no carries, and no inter-trit dependencies. Exactly what you need for efficient vectorization.
