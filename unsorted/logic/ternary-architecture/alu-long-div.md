# Long Division ALU Algorithm

This page discusses a possible hardware implementation of integer long division using balanced ternary digits (-1, 0, 1). Check out the [Arithmetics](arithmetics.md#division-and-modulus) page for a more fundamental explanation of how ternary division works.

There is probably plenty of work that defines the operations of an ALU, but I do not have access to research papers. What I write here is my personal exploration into the concept.

The following algorithm should be implementable in hardware (ALU):

```pseudo
function integer_division(numerator, denominator) {
  if (denominator == 0) error "Division by zero!"
  if (numerator == 0) return (q: 0, r: numerator)

  // R:Q is a single double register. The left half (high trits) belongs to R
  // (the remainder), the right half (bottom trits) start with the digits
  // of the numerator, but are slowly shifted out (and into R).
  // As the register is shifted, the trits are filled in with the computed
  // digits of the quotient.
  R:Q = 0:numerator

  // Normalise to always divide with a positive denominator (5 / -3 → -5 / 3).
  // This is not strictly necessary, but the boundary checks get simpler.
  // There might be a performance gain in not normalising.
  D = abs(denominator)
  Q = Q * sign(denominator)
  D_h = ceil(D / 2)

  for (i = 1; i <= number_of_trits; i++) {
    Shift the next bit from Q into R
    R:Q = R:Q << 1

    // Q >> i are the remaining trits that have not yet been moved into R.
    Q_i = Q >> i

    // If the current partial remainder (R) is greater than half
    // the denominator (D_h), we subtract the denominator from R.
    // If R is exactly equal to D_h, we subtract only if the
    // remaining digits are < 0.
    if (R > D_h || (R == D_h && Q_i < 0)) {
      R = R - D
      // If we subtract the denominator from the remainder, we must
      // add one to the quotient.
      set_lsb(Q, 1)
    // Adding has the same logic as subtracting, but reversed.
    } else if (R < -D_h || (R == -D_h && Q_i > 0)) {
      R = R + D
      // If we add the denominator to the remainder, we must
      // subtract one from the quotient.
      set_lsb(Q, -1)
    }
  }

  // Normalise the result
  if (R < 0 && Q > 0) {
    R = R + D
    Q = Q - 1
  } else if (R > 0 && Q < 0) {
    R = R - D
    Q = Q + 1
  }

  // Q holds the final quotient, R holds the remainder
  return (Q, A)

  // In practice, there should be two processor instructions. One that
  // copies the quotient (a / b) to the output register, and another
  // that copies the remainder (a % b).
}
```

`Q` starts as a container of the trits / digits of the numerator. For each shift of the `R:Q` register, the next digit is shifted out of `Q` and into `R`. Then the last position is populated with the computed digit of the quotient. This shift repeats until `Q` contains *only* the quotient digits. Then that value can be returned as the result of the division.

Let’s dry-run the algorithm with ±5 / 3 to check that it returns the correct quotient whether it’s positive or negative. And let’s also verify that the remainder follows the rule $Q \cdot D + R = N$.

> [!example] Dry-run
> ${5 \div 3} = 1 {2 \over 3}$

For simplicity, make registers only 3 trits large in this example. That’e enough to fit the largest value (5 = `+--`).

Initial setup:
`R:Q = 000:+--  // means R = 000, Q = +-- (5)`
`D = 0+0`
`D_h = 0+-`

for `i = 1`:
`R:Q = 00+:--0 // = R:Q << 1`
`Q_i = --`
$-D_h < R = 1 < D_h \to$ skip

for `i = 2`:
`R:Q = 0+-:-00`
`Q_i = -`
$R = D_h, Q_i < 0 \to$ skip

for `i = 3`:
`R:Q = +--:000`
`Q_i = []` no remaining digits
$R = 5 > D_h \to$ subtract
`R:Q = 0+-:00+`

Remainder: `R` = top of `R:Q = 0+-` = 2.
Quotient: `Q` = bottom of `R:Q = 00+` = 1.
$Q \cdot D + R = 1 \cdot 3 + 2 = 5 = N$ ✅

> [!example] Dry-run
> ${-5 \div 3} = -1 {-2 \over 3}$

Initial setup:
`R:Q = 000:-++  // means R = 000, Q = -++ (-5)`
`D = 0+0`
`D_h = 0+-`

for `i = 1`:
`R:Q = 00-:++0 // = R:Q << 1`
`Q_i = ++`
$-D_h < R = -1 < D_h$

for `i = 2`:
`R:Q = 0-+:+00`
`Q_i = +`
$R = -D_{half}, Q_i > 0 \to$ skip

for `i = 3`:
`R:Q = -++:000`
`Q_i = []` no digits left
$R = -5 < -D_h \to$ add
`R:Q = 0-+:00-`

Remainder: `R` = top of `R:Q = 0-+` = -2.
Quotient: `Q` = bottom of `R:Q = 00-` = -1.
$Q \cdot D + R = (-1) \cdot 3 + (-2) = -5 = N$ ✅

> [!example] Dry-run
> ${8 \div 3} = 2 {2 \over 3}$

Initial setup:
`R:Q = 000:+0-  // means R = 000, Q = +0- (8)`
`D = 0+0`
`D_h = 0+-`

for `i = 1`:
`R:Q = 00+:0-0 // = R:Q << 1`
`Q_i = 0-`
$-D_h < R = 1 < D_h \to$ skip

for `i = 2`:
`R_Q = 0+0_-00`
`Q_i = -`
$R = 3 > D_h \to$ subtract
`R:Q = 000:-0+`

for `i = 3`:
`R:Q = 00-:0+0`
`Q_i = []` no remaining digits
$-D_h < R = -1 < D_h \to$ skip

Remainder: `R` = top of `R:Q = 00-` = -1.
Quotient: `Q` = bottom of `R:Q = 0+0` = 3.

$R < 0, Q > 0 \to$ normalise by adding `D` to `R`
`R:Q = 0+-:0+-`

Remainder: `A` = top of `R:Q = 0+-` = 2.
Quotient: `Q` = bottom of `R:Q = 0+-` = 2.
$Q \cdot D + R = 2 \cdot 3 + 2 = 8 = N$ ✅

> [!example] Dry-run
> ${9 \div 3} = 3$

Initial setup:
`R:Q = 000:+00  // means R = 000, Q = +00 (9)`
`D = 0+0`
`D_h = 0+-`

for `i = 1`:
`R:Q = 00+:000 // = R:Q << 1`
`Q_i = 00`
$-D_h < R = 1 < D_h \to$ skip

for `i = 2`:
`AQ = 0+0_000`
`Q_i = 0`
$R = 3 > d_h \to$ subtract
`R:Q = 000_00+`

for `i = 3`:
`R:Q = 000_0+0`
`Q_i = []` no remaining digits
$-D_h < R = 0 < D_h \to$ skip

Remainder: `R` = top of `R:Q = 000` = 0.
Quotient: `Q` = bottom of `R:Q = 0+0` = 3.
$Q \cdot D + R = 3 \cdot 3 + 0 = 9 = N$ ✅

> [!example] Dry-run
> ${280 \div 8} = 35$

Let’s try a larger example. This numerator requires 6 trits, so let’s use that size for the registers this time. `R:Q`  is then 12 trits large.

Initial setup:
`R:Q = 000_000:+0+_+0+  // means R = 000_000, Q = +0+_+0+`
`D = 000_+0-`
`D_h = 000_0++`

for `i = 1`:
`R:Q = 000_00+:0++_0+0`  (= `R:Q << 1`)
`Q_i = 0++0+`
$-D_h < R = 1 < D_h \to$ skip

for `i = 2`:
`R:Q = 000_0+0:++0_+00`
`Q_i = ++0+`
$-D_h < R = 3 < D_h \to$ skip

for `i = 3`:
`R:Q = 000_+0+_+0+_000`
`Q_i = +0+`
$R = 10 > D_h \to$ subtract
`R:Q = 000_0+-:+0+_00+` (shifted in `00+` as the actual quotient)

for `i = 4`:
`R:Q = 000_+-+:0+0_0+0`
`Q_i = 0+`
$R = 7 > D_h \to$ subtract
`R:Q = 000_00-:0+0_0++`

for `i = 5`:
`R:Q = 000_0-0:+00_++0`
`Q_i = +`
$-D_h < R = -3 < D_h \to$ skip

for `i = 6`:
`R:Q = 000_-0+:00+_+00`
`Q_i = []` no remaining digits
$R = -8 < -D_h \to$ add
`R:Q = 000_000:00+_+0-`

Remainder: `R` = top of `R:Q = 000_000`.
Quotient: `Q` = bottom of `R:Q = 00+_+0-`.
$Q \cdot D + R = 35 \cdot 8 + 0 = 280 = N$ ✅
