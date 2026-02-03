
The modulus operator (`%`) behaves strangely in C, Java, Swift… Clawr will use the behaviour found in Python.

## The Definition

The modulus operator (`%`) returns the remainder after integer division. The division operator (`/`) returns an integer value whether the dividend is an even multiple of the divisor or not. The modulus operator accounts for the difference.

This invariant is true for all integers: `dividend == quotient * divisor + remainder`. The `quotient` is the result of `dividend / divisor`. If the dividend is not an even multiple, the division will return the closest integer below the true value (`a / b ==` $\left \lfloor{a \over b} \right \rfloor$).

```
a == (a / b) * b + (a % b) // dividend = quotient * divisor + remainder
```

So `a % b` can be defined as:

```
a % b == a - (a / b) * b
```

## The Inconsistency

In C, and C-like languages, division is rounded toward zero. That means that when the quotient is less than zero, the result is rounded *up*, not down; we take the *ceiling*, not the floor. The consequence is that the remainder will be negative even if the divisor is positive.

```
5 / 3 == 1
5 % 3 == 2
1 * 3 + 2 == 5

5 / -3 == -1
5 % -3 == 2
-1 * -3 + 2 == 5

-5 / 3 == -1
-5 % 3 == -2
-1 * 3 + -2 == -5

-5 / -3 == 1
-5 % -3 == -2
1 * -3 + -2 == -5
```

This is unintuitive. The modulus should simply rotate through the range $[0, \text{divisor})$. Why should the behaviour change drastically for negative dividends compared to positive?

A workaround exists. C programmers often use a pattern like this one:

```c
val = (a % b + b) % b // ensure that 0 ≤ val < b (if b > 0)
```

If `a % b < 0`,  we add `b` to switch the sign. Taking the modulus after that will not change it. If `a % b >= 0`,  adding `b` gets us higher than `b`. Taking the modulus again, negates the addition.

## Python’s Way

Python has a different behaviour from C. Integer division always rounds *down* (towards negative infinity) instead of rounding towards zero.

```
5 / 3 == 1     // c: 1
5 % 3 == 2     // c: 2
1 * 3 + 2 == 5

5 / -3 == -2   // c: -1
5 % -3 == -1   // c: 2
-2 * -3 + -1 == 5

-5 / 3 == -2   // c: -1
-5 % 3 == 1    // c: -2
-2 * 3 + 1 == -5

-5 / -3 == 1   // c: 1
-5 % -3 == -2  // c: -2
1 * -3 + -2 == -5
```

When the dividend and the divisor are both positive, or both negative, Python behaves the same as C and Java. But when the signs differ, the behaviours differ too.

This means that in Python, the sign of the divisor determines the sign of the remainder. The modulus operator always returns a value in the range $[0 , \text{divisor})$ for divisor > 0, or $(\text{divisor, 0}]$ for divisor < 0. And adding to the dividend always rotates up and subtracting rotates down.

## The Price

As the case is in many situations, we are faced with a triangle of choice. We can have two of three very reasonable invariants, but not all of them.

1. dividend = quotient * divisor + remainder
2. quotient / -dividend = -quotient / dividend = -(quotient / dividend)
3. the remainder is always in the range $|\text{remainder}| \in \big [ 0 , |\text{divisor}| \big )$

One of the three must be surrendered. We can only have two of them. C chose to maintain (1) and (2), and give up (3). Probably because C did not actually choose anything; processors have a built in division mechanism that works like that.

Python decided to maintain (3) at the expense of (2) which it considers more important for intuition. The percent sign is often used to maintain a variable within a range, using a fixed divisor to define the modulus. If the range changes by the sign of the dividend, the math becomes complex and will cause cognitive dissonance in programmer intuition.

The price Python pays is that $-5 / 3 ≠ -(5 / 3)$.

## In Clawr

The primary invariant must not be violated: dividend = quotient * divisor + remainder. This is important for many algorithms (including arbitrarily sized integers which is an essential Clawr feature).

The second invariant is how processors work internally, and probably not a good idea to sacrifice.

But what then of rotational (“Euclidean”) modulus? Must we sacrifice it? Yes: the percent symbol will have to to behave oddly. That seems to be the only valid choice. But, no: we do not have to sacrifice the function altogether. We can add another operator (or a function perhaps) that provides Euclidean modulus.

```clawr
// This might not be the most efficient implementation
func euclidean_mod(a: integer, b: integer) => (a % b + b) % b
```

We might name this function something else. We make it an operator. Whatever we settle on, we will probably want to implement it. Rotational modulus is a fundamental function in mathematics.

## In Maths

[Modulo mathematics](https://en.wikipedia.org/wiki/Modulo) does not “return the remainder.” Instead, it groups integers in sets and allows any number to represent the set it belongs to.

$$-18 \equiv 42 \equiv 99,982 \ (\text{mod} \ 10)$$$$19 \equiv 4 \equiv -11 \ (\text{mod} \ 3)$$
Because $-1 \equiv 2$ and $-2 \equiv 1$ (mod 3), the discrepancies of `5 % -3` and `-5 % 3` do not necessarily violate the expectations of mathematicians.

There is, on the other hand, a concept in mathematics called *algebraic structures*. Sometimes we only consider numbers within a certain range or set and ignore/invalidate all other integers. In such an algebra (mod 6), $3 + 5 = 2$, and $3 - 5 = 4$. This concept is strong motivation for a rotational modulus.

---

> [!question] AI Prompt
> The price Python pays is that `-5 / 3 ≠ -(5 / 3)`.

Exactly! That's the core tradeoff. Let me map out what each approach sacrifices:

## The Fundamental Tension

You can't have all three properties simultaneously:

1. **Division-negation symmetry**: `-a / b == -(a / b)`
2. **Rotational modulo**: Result always in `[0, |b|)` (or sign matches divisor)
3. **Division algorithm invariant**: `a == (a / b) * b + (a % b)`

You must pick two and sacrifice one.

## The Three Approaches

### Truncating (C/Java/Rust)

**Keeps**: Division-negation symmetry + invariant  
**Sacrifices**: Rotational modulo

```
-5 / 3 == -(5 / 3) == -1  ✓
-5 == (-5 / 3) * 3 + (-5 % 3) == -1 * 3 + (-2)  ✓
-5 % 3 == -2  (not in range [0, 3))  ✗
```

### Floored (Python)

**Keeps**: Rotational modulo + invariant  
**Sacrifices**: Division-negation symmetry

```
-5 / 3 == -2  (not -(5 / 3) == -1)  ✗
-5 == (-5 / 3) * 3 + (-5 % 3) == -2 * 3 + 1  ✓
-5 % 3 == 1  (in range [0, 3))  ✓
```

### Euclidean Modulo Only

**Keeps**: Division-negation symmetry + rotational modulo  
**Sacrifices**: Invariant (for standard division)

```
-5 / 3 == -(5 / 3) == -1  ✓
euclidean_mod(-5, 3) == 1  (in range [0, 3))  ✓
-5 ≠ (-5 / 3) * 3 + euclidean_mod(-5, 3) == -1 * 3 + 1  ✗
```

## Which Property Matters Most?

### For **mathematical/scientific** code:

Rotational modulo is invaluable. Array indexing, periodic functions, hash tables—they all want `mod` that wraps cleanly.

### For **systems/performance** code:

Division-negation symmetry matches CPU behavior and compiler optimizations.

### For **business/general** code:

The invariant matters most for accounting, partitioning, and splitting calculations.

## Clawr's Choice

Since you can't have everything, I'd suggest **two separate operators**:

```clawr
// Division always truncates toward zero (matches hardware)
-5 / 3 == -1
-5 / 3 == -(5 / 3)  // symmetry preserved

// Remainder: preserves invariant
-5 % 3 == -2
-5 == (-5 / 3) * 3 + (-5 % 3)  // invariant preserved

// Modulo: always non-negative, rotational
-5 mod 3 == 1
(-5 mod 3) in 0..<3  // rotational property
```

This way:

- `%` keeps the invariant with `/` (for splitting/partitioning logic)
- `mod` gives mathematicians what they expect (for cyclic/periodic logic)
- `/` stays simple and fast (matches CPU)

You pay the cost of having two operators, but you gain clarity: the operator name tells you which property you're prioritizing.

Does that tradeoff feel right for Clawr's goals? Or would you rather pick one approach and stick with it?