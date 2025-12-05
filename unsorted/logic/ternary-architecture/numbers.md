# Ternary Number System

There are two ternary systems (for integers): balanced and unbalanced. The unbalanced kind looks much like standard bases: octal, hexadecimal, and is easy to transform to / from decimal. It uses the numbers 0, 1 and 2. It is inefficient for negative values as dedicating a trit to the sign of the number would remove one third of all possible values. (I would go so far as to say that unsigned integers become entirely redundant in programming languages that support ternary logic.)

This document is however not about implementation, but about the mathematics.

Balanced ternary representation (BT) uses the digits -1, 0 and 1. They are typically represented by `-`, 0 and `+`,  by `T`, `0` and `1`, or by `D` `0`and `U`. In a programming language, the first  variant is probably inappropriate, because the symbols $+$ and $-$ usually represent operators. But in a text document, or styled presentation, it might actually be clearer to use those symbols.

The unbalanced form is trivial for humans to understand (if they understand bases in general) so I judge it unnecessary to describe it here (and it might never be used in practice anyway). Instead, I will explain how to convert to and from the balanced form.

Each ternary digit is called a *trit*. In the balanced form, a trit can be `-` (-1), `0` or `+` (+1). It is a positional system that works just like decimal and binary, just with the base 3 and the aforementioned trit digits. The fact that one of the digits is negative makes understanding ternary numbers a bit complex, but in principle it is the exact same system.

The right-most digit (the first digit) is the least significant digit (LSD). It always counts single units ($3^0$). The second digit represents units of 3 ($3^1$) etcetera. The number of units can only be -1, 0 or 1 (the digit values).

So, the ternary number `+-0` represents $1 \times 3^2 + (-1) \times 3^1 + 0 \times 3^0$. That evaluates to $6_{10}$.

To generate a ternary number is harder. There are two methods. Either start with the LSD and move left or start with the most significant digit (MSD) and move right. Lets examine each approach in turn using the same example value: $833_{10}$.

## Right-to-left, LSD first

Simply divide the input by 3. You’ll get a quotient, $q$, and a remainder, $r$ on the form $q {r \over 3}$. If the remainder is 2, rewrite the result by adding one to the quotient and subtracting $3 \over 3$ from the fraction, getting $r = -1$. Then repeat the process, using the quotient as input and prepend (add to the left side) that result to the previous output. Continue until the adjusted quotient is zero.

In our example case $833 / 3 = 277 {2\over 3} = 278 {-1\over 3}$, $q = 278$ and $r = -1$. This $r$ value is our least significant digit, LSD, and written as `-`. Since our quotient, $278 > 0$, we repeat the operation.

$278 / 3 = 92 {2 \over 3} = 93 {-1 \over 3}$. We add another `-` digit to the left of the output, which results in `--` and then we continue with the new quotient $93$. 

$93 / 3 = 31 = 31 {0 \over 3}$. We prepend the remainder (0) to our representation, getting `0--` and repeat the with $31$ as input. 

$31 / 3 = 10 {1 \over 3}$. We add the remainder to our result: `+0--` and continue with the division of 10. 

$10 / 3 = 3 {1 \over 3}$, so we add another `+` and have `++0--`. The representation of the final 3 is trivial: `+0`. We can just prepend that to our output creating the final result `+0++0--`

### Alternative explanation

$$833 = 278 \times 3 - 1 = 278 \times 3^1 + (-1) \times 3^0$$
$$= 93 \times 3^2 + (-1) \times 3^1 + (-1) \times 3^0$$
$$= 31 \times 3^3 + 0 \times 3^2 + (-1) 3^1 + (-1) \times 3^0$$
$$= 10 \times 3^4 + 1 \times 3^3 + 0 \times 3^2 + (-1) 3^1 + (-1) \times 3^0$$
$$= 3 \times 3^5 + 1 \times 3^4 + 1 \times 3^3 + 0 \times 3^2 + (-1) 3^1 + (-1) \times 3^0$$$$= 1 \times 3^6 + 0 \times 3^5 + 1 \times 3^4 + 1 \times 3^3 + 0 \times 3^2 + (-1) 3^1 + (-1) \times 3^0$$
All potentials of 3 are accounted for and in order. Just replace the coefficients according to 1 → `+`, 0 → `0`and -1 → `-`, which yields the final representation `+0++0--`.
## Left-to-right, MSD first

This method is difficult and requires prior knowledge of the even potentials of 3. It also requires an understanding of the highest value that can be created by adding all the lower potentials. I don't know if it can be adapted to work without prerequisite information.

If the number is an even potential of 3, the result is just to reply with a `+` in the right position. Otherwise, start by identifying the closest higher and lower potentials of 3. One will be close enough that either adding or subtracting one for each lower potential will go beyond that value. This is the potential you should choose. Then subtract that value from the input and repeat.

$729 < 833 < 2187$, so we add a `+` to represent 729 and repeat for $833-729 = 104$. The next lower potential of 3 is 243. 104 is much less than 243, so we add a 0: `+0`. Then we check the next potential: 81, which is less than 104, so we add a `+`: `+0+`. $104 - 81 = 23$. Next, we check 27. The input value is less than 27, so we should add a 0? Well, no. The value is very close to 27 (specifically it is more than $27 + 1 \over 2$ (the max value of all remaining trits) so we add a `+` again. Now we have `+0++` and an input of $23 - 27 = -4$. For the next potential (9) we add a `0` ($\lvert -4 \rvert < {9 + 1 \over 2}$) and for 3, we add `-` which gets us to `+0++0-` and a remainder of $(-4) - (-3) = -1$. That is a trivial digit resulting in the complete representation: `+0++0--`. (Or using the alternate notation: `10110TT`)

### Cheat-sheet

The threshold numbers I mentioned in the algorithm above are taken from this table. The maximum value that can be created by setting all lower trits to `+`—as well as the distance to each of the closest potentials of 3—determines whether the current trit should be a `+` or a `-`.

| BT            | Decimal |
| ------------- | ------: |
| `000_000_00+` |       1 |
| `000_000_0++` |       4 |
| `000_000_+++` |      13 |
| `000_00+_+++` |      40 |
| `000_0++_+++` |     121 |
| `000_+++_+++` |     364 |
| `00+_+++_+++` |   1 093 |
| `0++_+++_+++` |   3 280 |
| `+++_+++_+++` |   9 841 |

The numbers in this table can be computed as $3^n-1 \over 2$. For example, the largest number that can be written in four digits is: ${3^4-1 \over 2} = {81 - 1 \over 2} = 40$.
## Negative Numbers

The amazing consequence of using balanced ternary is that negative numbers can be generated by simply switching the sign of all the digits. So `-` becomes `+`, `+` becomes `-` and zeroes remain unchanged. Our example number, $833_{10}$, is `+0++0--` (or `10110TT`) in balanced ternary. The number $-833_{10}$ is `-0--0++` (or `T0TT011`).

In binary, checking if a signed integer is negative is trivial: just check the left-most bit in the register; if it is `1`, the number is < `0`, if it is `0`, the number is zero or higher. In ternary the left-most trit will almost certainly be `0`. The first non-zero digit defines whether the entire number is less or greater than zero. If all digits are zero, of course, the value is *equal to* zero. Of course, it is possible to combine all the trits in a massive gate that returns the sign.

## Converting UT → BT

Go from left to right and convert each 2 to 3 + (-1) The 3 is added by incrementing the previous position by 1, and the -1 in the current position can be represented by the letter T. If the incremented position becomes 2, that 2 will need to be corrected as well, but it can be done at any time.

Example:

`01221001` → `02T21001` → `020T1001` → `1T0T1001` = `+-0-+00+`

In decimal `01221001` is $729 + 2 \times 243 + 2 \times 81 + 27 + 1 = 1,405_{10}$
In decimal `+-0-+00+` is $2,187 - 729 - 81 + 27 + 1 = 1,405_{10} \ \square$

Another example to shows that incrementation can propagate arbitrarily:

`01112` → `0112T` → `012TT` → `02TTT` → `1TTTT` = `+----`

In decimal `01112` is $81 + 27 + 9 + 3 + 2 = 122_{10}$
In decimal `+----` is $243 - 81 - 27 - 9 - 3 - 1 = 122_{10} \ \square$

> [!todo]
>  **Suspicion**: The first digit 2 may propagate all the way to the beginning (if all the digits up to that position are 1s), but if that is done immediately, there can never be another propagating 2. Try to prove this mathematically.
>  
>  **Immediate Realisation**: *Nope. This is wrong.* There can still be a 1 followed by a 2 at a later point in the string of digits. But that 2 can never propagate beyond the Ts that were inserted for the last 2 before it. Because T + 1 = 0 and will not propagate. The next 2 cannot increment this digit because it cannot propagate beyond the 2 turned T that changed this T to a 0.

So, the recommended strategy is to immediately handle propagating 2s. Go left when changing a 2 to a T and if that's a 2, continue to the left. Turn back to the right when the incremented digit is not a 2. (You can skip all the digits of the left propagation as they will all be Ts.)

The bounce strategy should also work equally well. It might be simpler actually: Just sweep from left to right, replacing each 2 with a T and incrementing the digit on its left. Then “bounce” on the LSD and do the same from right to left. End after the MSD; don't bounce back again.

## Floating-point numbers

The ubiquitous circle constant, $π ≈ 3.14159$ has the following ternary expansion (first 77 digits after the dot):
`+0.0++-+++-000-0++-++0+-++++++00-0000-+----+-0-0-0--0+--++00+00++-00-+000--+--+-`
Source: <https://oeis.org/A331313>

Euler’s constant, defined as $e = \lim_{n \to \infty} \left (1 + {1 \over n} \right)^n ≈ 2.71828$ has the following expansion:
`+0.-0+++--0-0-+++-0+++-000-++-0+++0-000-+--+0000-++0-00--+-+--0--00-+++00+--+000`
Source: <https://oeis.org/A331990>

> [!note]
> I do not know if the above expansions are truncated or rounded, but I do not expect that we will ever need all the digits anyway. We can truncate or round them to 70 trits or less, which would certainly negate any rounding error in the source.

In an 81 trit floating point number, we might use 12 trits as exponent (which would beat IEEE 754 *octuple precision*—256 bits—for max/min numbers, but it would “only” be about equivalent to quadruple—128 bits—for precision, we can adjust) and the remaining 69 trits as mantissa, in the form $\text{value} = \text{mantissa} \times 3^\text{exponent}$. Then the value of $π$ would come out as:

exponent: `000 000 000 00+` (= 1)
mantissa: `+00 ++- +++ -00 0-0 ++- ++0 +-+ +++ ++0 0-0 000 -+- --- +-0 -0- 0-- 0+- -++ 00+ 00+ +-0 0-+`

`00000000000++00++-+++-000-0++-++0+-++++++00-0000-+----+-0-0-0--0+--++00+00++-00-+`

For $e$:
`00000000000++0-0+++--0-0-+++-0+++-000-++-0+++0-000-+--+0000-++0-00--+-+--0--00-++`

## IEEE 754 versus ternary

| Precision | Bits (Exponent + Mantissa) | Exp. range (0 is positive) | Maximum            | Tiniest (normal)    | Subnormal           |
| --------- | -------------------------- | -------------------------- | ------------------ | ------------------- | ------------------- |
| Single    | 8 + 24                     | -128–127                   | $3.40×10^{38}$     | $1.18×10^{-38}$     | $1.40×10^{−45}$     |
| Double    | 11 + 53                    | -1,024–1,023               | $1.80×10^{308}$    | $2.23×10^{−308}$    | $4.94×10^{−324}$    |
| Quadruple | 15 + 113                   | -16,384–16,383             | $1.19×10^{4,932}$  | $3.36×10^{-4,932}$  | $6.48×10^{−4,966}$  |
| Octuple   | 19 + 237                   | -262,144–262,143           | $1.61×10^{78,913}$ | $2.48×10^{−78,913}$ | $2.25×10^{−78,984}$ |

Proposed ternary equivalents:

| Precision | Trits    | Exp. range | Hugest                 | Tiniest                |
| --------- | -------- | ---------- | ---------------------- | ---------------------- |
| Single    | 6 + 21   | ±364       | $±7.05 × 10^{173}$     | $±2.1×10^{-174}$       |
| Double    | 7 + 47   | ±1,093     | $±4.67 × 10^{521}$     | $±3.2 × 10^{-522}$     |
| Quadruple | 9 + 72   | ±19,683    | $±2.26 × 10^{9,391}$   | $±6.6 × 10^{-9,392}$   |
| Octuple   | 12 + 150 | ±265,720   | $±6.85 × 10^{126,780}$ | $±2.2 × 10^{-126,781}$ |

> [!note]
> The numbers in the table are calculated using this logic:
> 
> The largest mantissa possible is slightly shy of ±1.5 (`+.++++…` / `-.----…`) regardless of the number of bits. The tiniest mantissa is ± 1 (`+.00000…`/`-.00000…`).
> 
> An exponent of `x` bits has a range of $±{3^n - 1 \over 2}$
> 
> So the hugest value is: $1.5 \times 3^{3^e-1 \over 2}$
> And the tiniest: $1 \times 3^{-{3^e-1 \over 2}}$

By this definition of “quadruple” precision (81 trits):

$π$ =
`00000000++00++-+++-000-0++-++0+-++++++00-0000-+----+-0-0-0--0+--++00+00++-00-+00-`

$e$ =
`00000000++0-0+++--0-0-+++-0+++-000-++-0+++0-000-+--+0000-++0-00--+-+--0--00-+++0+`

For lesser precisions, we just remove digits from both ends. To get a smaller exponent, we remove trits from the left hand side, and to get a smaller mantissa, we remove from the right.

> [!note] Note about rounding
> There is no rounding in balanced ternary. Simply truncating the expansion is enough. That is because the expansion after the $3^{-k}$ digit is always smaller than $±0.5 \cdot 3^{-k}$ (unless you have an infinite number of digits—either all `+` or all `-`).

To get to octuple precision, we need to find/calculate 150 digits. This is doable as $π$ is known to a ridiculous decimal expansion, and $e$ is probably also known to many more (decimal) digits than we need. We will have to transform those decimal digits to ternary, though.

Rounding balanced ternary values is trivial: just truncate the expansion. A removed `+` or `-` digit is worth only a third of the position on it's left so it cannot affect the result of rounding. There are no rounding errors; there is just precision.

## Ambiguous numbers

There are downsides to having negative digits (a balanced base). One is that some numbers have ambiguous representation and can be rounded to two different values arbitrarily.

This ambiguity exists in “normal” bases to. For example in base 10, the value 1 can also be described as 0..999…

$$0.9\bar 9 = 1$$

The problem in ternary is that the ambiguity happens exactly half-way between even numbers. That means that rounding results in wildly different-looking represenattions. For example `0.++++…` = `1.----…` = $0.5_{10}$. Because, in general:

$$3^{-k} + \sum_{i = k + 1}^\infty (-1) \cdot 3^{-i} = \sum_{i = k}^\infty 3^{-i}$$

and, conversely:


$$-3^{-k} + \sum_{i = k + 1}^\infty 3^{-i} = \sum_{i = k}^\infty (-1) \cdot 3^{-i}$$

A literal `x = 0.5` can be decided to always use the `0.+++++…` expansion, but calculations might result in the other one, and then rounding errors might propagate to deviate way beyond recognisability. This might not be a problem in practice (as computers just compute), but it could be problematic if the ternary expansions needed to be read by humans.

We should probably not employ balanced ternary (or any other balanced base) to replace decimal in regular mathematics.
