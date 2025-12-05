# Addition and Subtraction

Addition is simple. Subtraction is also simple in principle, but may be complex in practice. The most straightforward way to handle it is by adding the negative. Negating a ternary value is as simple as flipping all trits: `+` to `-` and `-` to `+`. That means that we can use the same structures to perform both subtraction *and* addition. This is valuable for chip design.

Here is an example to illustrate addition:


> [!example]
> $8 + 6 = 14$
>
> ```plain
>   +0-  8
> + +-0  5
> -----
>  +---  14
> ```

In the rightmost column, we add the digit `-`(-1) and the digit `0`. The sum is `-`, which is entered in the same position in the result. In the second column, we add `0` and `-` in the opposite order, but with the same total. In the final column, we add two `+` digits, which results in the value $2$, or `+-`, so we have to add two digits on the left end of the result.

Another example (with carry):

> [!example]
> $8 + 5 = 13$
>
> ```plain
>   --   carry digits
>   +0-  8
> + +--  5
> -----
>   +++  13
> ```

This time we add two `-` digits ($(-1) + (-1)$) in the rightmost column. The sum is $-2$, which is expressed as `-+`. The `+` digit  is entered in the result, and the `-` digit is moved to the next column as a *carry*. In the second column, we add `-` and `0`, which is $-1$ (`-`). But we also have the carry digit from column one, resulting in $-2$ in this column too. In the final column, we add two `+` digits, which results in $+2$, or `+-`, but with the negative carry added we revert back to a total of one (a single `+`). In the end, all three columns will have a `+` in the result. This is the lucky number $13$

As we can see, the numbers $13$ and $14$—despite a difference of just $1$–are represented as very different numbers. Going up one from all `+` results in one more digit, as expected. But the filler is not a bunch of zeros; it is a bunch of `-` digits.

### ALU Integer Addition

An ALU adds two registers by applying a “full adder” to each trit except the first and last. The first step does not require a carry from a prior addition (this is called a “half adder”), and the last one does not need to compute a carry (unless that carry is used to detect overflow).

A full adder should calculate a sum trit $s$ and carry $c_{out}$ from input trits $i_0$ and $i_1$, and carry-in trit $c_{in}$, according to the following formulas and table:

$$c_{out} = \lfloor {c_{in} + i_0 + i_1 \over 3} \rfloor = c_{in} \boxtimes (i_0 \oplus i_1) \boxplus (i_0 \boxtimes i_1)$$
$$s = {c_{in} + i_0 + i_1} - 3 \cdot c_{out} = {c_{in} \oplus i_0 \oplus i_1}$$

> [!note]
> The operator symbols are taken from the [Ternary Logic](https://louis-dr.github.io/ternlogic.html) defined by [Louis Duret-Robert](https://louis-dr.github.io/index-ternary.html).
>
> `CONS`($\boxtimes$) returns the shared value of both inputs if they are the same (i.e. they “are in consensus”), `0` otherwise.
> `ANY` ($\boxplus$) is clamped addition. If the sum exceeds \[-1, +1], the output is whichever limit is closest.
> `SUM` ($\oplus$) is a modular sum. It returns the digit (-1, 0 or +1), whose value is congruent to the sum of the two inputs (mod 3).
>
> See [gates](gates.md) for more details.

The full adder truth table [^alt-truth]:

| $c_{in}$ | $i_0$ | $i_1$ | $c_{out}$ | $s$ | Explanation                    |
| -------- | ----- | ----- | --------- | --- | ------------------------------ |
| `-`      | `-`   | `-`   | `-`       | `0` | (-1) + (-1) + (-1) = -3 = `-0` |
| `-`      | `-`   | `0`   | `-`       | `+` | (-1) + (-1) + 0 = -2 = `-+`    |
| `-`      | `-`   | `+`   | `0`       | `-` | (-1) + (-1) + 1 = -1 = `0-`    |
| `-`      | `0`   | `-`   | `-`       | `+` | (-1) + 0 + (-1) = -2 = `-+`    |
| `-`      | `0`   | `0`   | `0`       | `-` | (-1) + 0 + 0 = -1 = `0-`       |
| `-`      | `0`   | `+`   | `0`       | `0` | (-1) + 0 + 1 = 0 = `00`        |
| `-`      | `+`   | `-`   | `0`       | `-` | (-1) + 1 + (-1) = -1 = `0-`    |
| `-`      | `+`   | `0`   | `0`       | `0` | (-1) + 1 + 0 = 0 = `00`        |
| `-`      | `+`   | `+`   | `0`       | `+` | (-1) + 1 + 1 = 1 = `0+`        |
| `0`      | `-`   | `-`   | `-`       | `+` | 0 + (-1) + (-1) = -2 = `-+`    |
| `0`      | `-`   | `0`   | `0`       | `-` | 0 + (-1) + 0 = -1 = `0-`       |
| `0`      | `-`   | `+`   | `0`       | `0` | 0 + (-1) + 1 = 0 = `00`        |
| `0`      | `0`   | `-`   | `0`       | `-` | 0 + 0 + (-1) = -1 = `0-`       |
| `0`      | `0`   | `0`   | `0`       | `0` | 0 + 0 + 0 = 0 = `00`           |
| `0`      | `0`   | `+`   | `0`       | `+` | 0 + 0 + 1 = 1 = `0+`           |
| `0`      | `+`   | `-`   | `0`       | `0` | 0 + 1 + (-1) = 0 = `00`        |
| `0`      | `+`   | `0`   | `0`       | `+` | 0 + 1 + 0 = 1 = `0+`           |
| `0`      | `+`   | `+`   | `+`       | `-` | 0 + 1 + 1 = 2 = `+-`           |
| `+`      | `-`   | `-`   | `0`       | `-` | 1 + (-1) + (-1) = -1 = `0-`    |
| `+`      | `-`   | `0`   | `0`       | `0` | 1 + (-1) + 0 = 0 = `00`        |
| `+`      | `-`   | `+`   | `0`       | `+` | 1 + (-1) + 1 = 1 = `0+`        |
| `+`      | `0`   | `-`   | `0`       | `0` | 1 + 0 + (-1) = 0 = `00`        |
| `+`      | `0`   | `0`   | `0`       | `+` | 1 + 0 + 0 = 1 = `0+`           |
| `+`      | `0`   | `+`   | `+`       | `-` | 1 + 0 + 1 = 2 = `+-`           |
| `+`      | `+`   | `-`   | `0`       | `+` | 1 + 1 + (-1) = 1 = `0+`        |
| `+`      | `+`   | `0`   | `+`       | `-` | 1 + 1 + 0 = 2 = `+-`           |
| `+`      | `+`   | `+`   | `+`       | `0` | 1 + 1 + 1 = 3 = `+0`           |

[^alt-truth]: Yes, it’s called a “truth table,” even if it doesn’t just list binary T/F states. Alternative terms do exist, though; it could also be called a “logic table,” “state table” or “function table.”

> [!example] $12 + 8 = 20$
>
> ```plain
>   +     carry
>    ++0  12
> +  +0-   8
> ------
>   +-+-  20
> ```

# Multiplication

Multiplication is done the same way as in other bases. The main difference is that multiplying by +/- 1 is trivial compared to multiplying larger digits. The fact that a digit can be negative does not affect the algorithm.

Just add or subtract the shifted version of one input. Like so:

> [!example] $8 \cdot 12 = 96$
>
> ```plain
>    +0-   8
> *  ++0  12
> ------
>  +0-00   8*9
>+ +0-0   8*3
> ------
>  ++--0  96
> ```

> [!example] $12 \cdot 8 = 96$
>
> ```plain
>    ++0  12
> *  +0-   8
> ------
>  ++000   12*9
> +  --0   12*(-1)
> ------
>  ++--0  96
> ```

## Division and Modulus

The modulus operator (`%`) should return the remainder ($r$) after an integer division ($q = \left \lfloor{n \over d}\right \rfloor$). The one rule that must always be true is that $n = q \cdot d + r$.

Example: $n / d = ±5 / ±3 = q { r \over d}$:

| N   | D   |   Q |   R | Q D + R |
| --: | --: | --: | --: | ------: |
|   5 |   3 |   1 |   2 |       5 |
|   5 |  −3 |  −1 |   2 |       5 |
|  −5 |   3 |  −1 |  -2 |      −5 |
|  −5 |  −3 |   1 |  −2 |      −5 |

> [!example] ${280 \div 8} = 35$
> (Transcribed from an image at <https://www.mortati.com/glusker/fowler/ternary.htm>)
>
> ```plain
>         ++0-  quotient
>     --------
> +0- ) +0++0+  denominator | numerator
>       -0+     subtract +0 times the divisor (by inverting + and - digits of the divisor and add)
>       ------
>        +-+0+  intermediate result
>        -0+    subtract + times the divisor (by inverting + and - digits of the divisor and add)
>        -----
>          -0+  intermediate result (note, this is a negative value!)
>               intermediate result moved over by two digits, this next digit in quotient is 0
>          +0-  subtract - times the divisor (by adding the divisor)
>          ---
>            0  remainder equals zero
> ```

Division is done by adding the denominator to the remainder—and at the same time adding the `-` (-1) digit to the quotient—or subtracting the denominator—whilst adding the digit `+` (+1).

We start by aligning the denominator to the numerator, just like in decimal long division. Since the denominator in the example (`+0-` $= 8_{10}$) is three digits wide, we focus only on the first three digits of the numerator (`+0+` $= 10_{10}$). The numerator digits form a number larger than the denominator, so we add a `+` (+1) in the third position from the left in the quotient and subtract the denominator from the first three digits in the numerator.

The example does this subtraction by inverting the digits (`+0-` changes to `-0+`) which constructs the negative (-8) and then adding that value. Then the remaining digits from the numerator are copied down (which is also the standard approach to decimal long division).

Then we shift the denominator one step and subtract it from this new result (the *partial remainder*). Its first three digits are `+-+` $= 7_{10}$. This subtraction results in a single digit `-` (-1). On the next iteration, the digits do not line up (`-0` is just two digits and almost zero) so we just add a `0` to the quotient. We do not subtract this time.

In the final step, we have a partial remainder of $-8_{10}$ (`-0+`) and instead of subtracting, we *add* the denominator, and we append the final digit, `-`, to the quotient. That addition results in a remainder of 0, and the division is completed. The resulting quotient is `++0-`, which is read as $1 \cdot 3^3 + 1 \cdot 3^2 + 0 \cdot 3^1 + (-1) \cdot 3 ^0 = 27 + 9 - 1 = 35$

### Negative Digits Complexity

The above example does not illustrate the main complexity of balanced ternary division, which is deciding when to add a zero digit and when to add to/subtract from the remainder. The difficulty stems from the fact that digits can be negative.

One way to illustrate this complexity is to compare the divisions $20 / 4 = 5$ and $16 / 4 = 4$.

> [!example]
> ${20 / 4} = 5$
>
> ```plain
>       +--    quotient
>    -------
> ++ ) +-+-    denominator | numerator
>      --      subtract 4 from 2 => -2
>      -----
>      -++-    the last two digits are copied down
>       ++     add 4 to -5 => -1
>       ----
>        --    the final digit is copied down
>        ++    add 4 to -4 => 0
>        ---
>         0    no remainder
> ```

> [!example]
> ${16 / 4} = 4$
>
> ```plain
>        ++    quotient
>    -------
> ++ ) +--+    denominator | numerator
>       --     subtract 4 from 5 => -1
>      -----
>        --    the last digit is copied down
>        ++    add 4 to -4 => 0
>       ----
>         0    no remainder
> ```

As we see, we align the denominator differently in these two examples. When dividing 20, we align to the first digit of the numerator, but when dividing 16 we align to the second digit. Why is that?

We always choose our quotient digit with the goal that the next step should start with a partial remainder as close to zero as possible.

I do not have a mathematical proof for this (though I’m sure we could provide one if necessary) but the key number here is half the denominator: $\left \lceil denominator \over 2 \right \rceil$, which is 2 in both the above examples. When we align our denominator to the first two digits (or any partial remainder actually) we compare those digits with the key number. If the remainder > 2, we subtract our denominator. If the remainder < -2, we add. If it is between -2 and 2 (exclusive) we just note a zero in that position.

If the partial remainder is exactly 2 or -2, we have to look at the remaining digits of the numerator to decide our action. In the case of 20 / 4, the remainder is 2 (> 0) and the next digit is `+`. If we were to add that digit without first subtracting, we would get the remainder `+-+` $= 7_{10}$. This number is farther from zero than 2 is. Actually: it is more than twice the denominator (3)! Even if we subtract in the next step, we cannot ever get down to a small remainder.

In the case of 16 / 4, the remainder is also 2 but the next digit is `-`. Adding that digit *after* subtracting, would yield the remainder -7 (also twice the denominator). In the next step we would add another digit (`+`) which results in a new partial remainder -20. We’re just moving farther and farther from a zero remainder instead of closer. That’s why we must *not* subtract early in this case.

In summary, when the denominator aligns up with a partial remainder that equals half the denominator (rounded up), we must look ahead at the remaining digits. If the next non-zero digit is negative, we must skip this position and note a zero. And the same is true if the partial remainder is the negative of half the denominator (assuming a positive denominator) and the next non-zero digit is positive.

Here are a few other examples to help illustrate the process:

> [!example]
> ${23 / 10} = 2 {3 \over 10}$
>
> ```plain
>         +-    quotient
>     -------
> +0+ ) +0--    denominator | numerator
>       -0-     subtract denominator * 3^1 (q += 3)
>       -----
>        -+-    k = 0 (final position); here we have (q,r) == (3,-7)
>        +0+    add the divisor as the remainder is negative (q += -1)
>        ----
>         +0    final remainder is 3
> ```

> [!example]
> ${25 / 5} = 5$
>
> ```plain
>         --    quotient
>     -------
> +-- ) +0-+    denominator | numerator
>      -++      subtract 45
>      ------
>       -+-+    -20
>       +--     add 15
>       -----
>        -++    -5
>        +--    add 5
>        ----
>          0    no remainder
> ```

This example starts with the denominator far to the left. The three digits of the denominator are matched to only two of the numerator.

This happens because $\left \lceil 5 \over 2 \right \rceil = 3$, the first two digits form exactly the number 3, and the next digit is `-`. As explained earlier, when the compared digits form exactly half the denominator, the digits to the right decide if we subtract or skip.

You could see it as starting with the two numbers entirely separated and moving the denominator step by step to the right until their smallest digits (the ones) align.

```plain
   +0-+
+--       numerator is zero here (no digits) => skip
  -------
   +0-+
 +--      numerator is 1, still < 3 => skip
  -------
   +0-+
  +--     numerator is exactly 3, and the last two digits form -2 < 0
           => subtract here
```

> [!example]
> $40 / 5 = 8$ (rest 0)
>
> ```plain
>         +0-
>     -------
> +-- )  ++++    denominator | numerator
>       -++      subtract (++ = 3 > 2 = ceil(5 / 2))
>       -----
>         -++
>          0     no change
>        ----
>         -++
>         +--    q -= 1
>         ---
>           0    no remainder. (5 divides 40)
> ```

Similar to the previous example, but in this case the first two digits of the numerator form the number $4 > \left \lceil 5 \over 2 \right \rceil = 3$ and the future digits are irrelevant.

> [!example]
> ${8 \div 3} = 2 (r 2) [= 3 (r -1)]$
>
> ```plain
>       +-    quotient
>  --------
> +0 ) +0-    denominator | numerator
>      -0     subtract
>      ----
>       0-
>       +0    final normalisation
>       ---
>       +-
> ```

In this case it would be technically correct to say that ${8 \over 3} = 3 {-1 \over 3}$, but it is a strange format to present. The rules say that we should add a zero in the final step (because the remainder is -1, and $-2 < -1 < 2$), but ending with a negative remainder does not make sense here. To correct the issue we can add a normalisation step, only applicable at the end.

Or we could think of it as changing the rules for the final step. In all the earlier steps, we wanted to add or subtract the denominator (or skip) to bring the remainder as close to zero as possible for the next step. In the final step, we have no next step, so that is no longer the goal.

I have also formulated this as a [Long Division Algorithm](alu-long-div.md) for use in hardware (ALU).
