# the Modulus Operator

The modulus operator (`%`) behaves strangely in C, Java, Swift and similar languages. Python is a language that chooses a different behaviour which feels more intuitive. But it is not free.

## The Definition

The modulus operator (`%`) returns the remainder after integer division. Integer division results in two numbers: a quotient and a remainder according to this formula:

$${\text{dividend} \over \text{divisor}} = \text{quotient} + {\text{remainder} \over \text{divisor}}, \text{remainder} \in \left [ 0, \text{divisor} \right )$$

Multiplying both sides of the equation by the divisor gives the sacred invariant:

$$\text{dividend} = \text{quotient} \cdot \text{divisor} + \text{remainder}$$

This invariant *must* hold true for all `integer` divisions in Clawr, or the feature is broken.

In Clawr — as in probably all programming languages — the modulus operator (`%`) returns the remainder after division. The division operator (`/`) returns the quotient. By the sacred invariant:

```
dividend == (dividend / divisor) * divisor + (dividend % divisor)
```

So the modulus operator can be defined as:

```
dividend % divisor => dividend - (dividend / divisor) * divisor
```

## The Inconsistency

In C, and C-like languages, division is rounded toward zero (a.k.a. “truncated”). That means that when the quotient is less than zero, the result is rounded *up*, not down; we take the *ceiling*, not the floor. The consequence is that the remainder will be negative even if the divisor is positive.

Let’s use a concrete example (±5 / ±3) to illustrate. ${5 \over 3} = 1 {2 \over 3}$. When either one of the operands is negative, the result will be $-1{2 \over 3}$ (i.e. $-1  + {-2 \over 3}$).  Here is what the operators return for all the sign variants:

```
5 / 3 == 1
5 / -3 == -1
-5 / 3 == -1
-5 / -3 == 1
```

All nicely intuitive, but what about the modulus?

```
5 % 3 == 2
5 % -3 == 2
-5 % 3 == -2
-5 % -3 == -2
```

This is shockingly unintuitive! One would expect that the remainder should always be in the range $[0, \text{divisor})$, but we get both positive and negative remainders almost randomly. It could be reasonable if a negative divisor yielded a negative remainder, but it is instead the dividend’s sign that is honoured.

This does not bode well for modular mathematics and Galois fields (0 -> 1 -> 2 -> … -> divisor -2 -> divisor -1 -> 0).

The percent sign is often used to maintain a variable within a defined range. For positive values, the modulus rotates around the values: $0 \to 1 \to 2 \to … \to \text{divisor} -1 \to 0 \to 1 \to …$ If the remainder’s range depends on the sign of the dividend, it disrupts the logic of moving backwards in the sequence: $\text{divisor} - 1 \to \text{divisor} - 2 \to … \to 0 \to -1 \to…$ Hang on! It became negative! And if we continue decrementing the values will still rotate around — just as for increments — but the range has changed: $0 \to -1 \to -2 \to … \to -\text{divisor} + 2 \to -\text{divisor} + 1 \to 0 \to …$ We do not get back to positive values.

A workaround exists. C programmers often use a pattern like this one:

```c
val = (a % b + b) % b // ensure that 0 ≤ val < b (if b > 0)
```

If `a % b < 0`,  we add `b` to switch the sign. Taking the modulus after that will not change the value. If `a % b >= 0`,  adding `b` gets us higher than `b`. Taking the modulus again, undoes that addition.

Just incrementing/decrementing in steps of 1 is slightly simpler:

```c
rot_up = (val + 1) % b;
rot_dn = (val + b - 1) % b;
```

If `val` is known to already be in the range, it is not necessary to normalise it before incrementing/decrementing. When incrementing, `val + 1` is known to be positive, and the modulus operator will behave. When rotating down, `val` could be zero which would make `val - 1` negative. To make the modulus behave for that case (and all cases), the strategy used for the general example is employed (adding `b` before applying the modulus).

## Python’s Way

Python has a different behaviour from C. In Python, the modulus more intuitively follows the sign of the divisor:

```
 5 %  3 == 2   //  5 ==  3 +  2
-5 %  3 == 1   // -5 == -6 +  1
 5 % -3 == -1  //  5 ==  6 + -1
-5 % -3 == -2  // -5 == -3 + -2
```

This is achieved by making division always round *down* (towards negative infinity) instead of truncating.

```
 5 /  3 ==  1
-5 /  3 == -2
 5 / -3 == -2
-5 / -3 ==  1
```

Rounding down is not as intuitive as truncating, but unintuitive can be acceptable. What is  worse is that $-5 / 3 ≠ -(5 / 3)$. What gives!?

When the dividend and the divisor are both positive, or both negative, Python behaves the same way as C and Java. But when the signs differ — and the quotient becomes negative — the behaviours differ too.

This means that in Python, the sign of the divisor determines the sign of the remainder. The modulus operator always returns a value in the range $[0, \text{divisor})$ for divisor > 0, or $(\text{divisor, 0}]$ for divisor < 0. And incrementing or decrementing to the dividend automatically rotates back to into range. This is intuitively the right behaviour for modulus.

But we pay a price for this beauty. The result of the division operator has become erratic. The price Python pays is that $-a / b ≠ -(a / b)$.

## The Trade-off

As the case is in many situations, we are faced with a triangular choice. We can have two of three very reasonable invariants, but never all of them. It is mathematically impossible.

1. dividend = quotient * divisor + remainder
2. quotient / -dividend = -quotient / dividend = -(quotient / dividend)
3. the remainder is GF(divisor); i.e. always within the range $\left [ 0 , \text{divisor} \right )$.

One of the three must be surrendered. We can only have two of them. C has elected to maintain (1) and (2), and give up (3). Probably because C did not actually choose anything; processors have a standardised ALU that performs division in that way.

Python decided to maintain (3) at the expense of (2) [^perf] which it apparently considers less important.

[^perf]: and perhaps at the expense of performance?

## In Clawr

The first invariant must not be violated: dividend = quotient * divisor + remainder. This is sacred and would break many algorithms (including arbitrarily sized integers which is an essential Clawr feature).

The second invariant is how processors work internally, and probably not a good idea to sacrifice. I also happen to agree with the choice: the behaviour of the division operator is intuitively more important than that of the modulus.

But what then of rotational (“Euclidean”) modulus? Must we sacrifice it? Yes: the percent symbol will have to to behave oddly. That seems to be the least unintuitive choice. But, no: we do not have to sacrifice the function altogether. We can add another operator (or a function perhaps) that provides Euclidean modulus.

```clawr
// This might not be the most efficient implementation
func euclidean_mod(a: integer, b: integer) => (a % b + b) % b
```

We might name this function something else. We might make it an operator. Whatever we settle on, we will probably want to implement it. Rotational modulus is a fundamental function in mathematics.

Or it might be better if we let developers choose their own implementation? What range is needed? Negatives? Positives? Balanced around zero? Maybe the domain expert should define what behaviour the domain needs, not the language designer. The technical aspect is not complicated:

```clawr
func rotate-up(current: integer, modulus: integer) =>
        (current + 1) % modulus

func rotate-down(current: integer, modulus: integer) =>
        (current + modulus - 1) % modulus
```

## In Maths

[Modulo mathematics](https://en.wikipedia.org/wiki/Modulo) does not “return the remainder.” Instead, it groups integers in sets and allows any number to represent the set it belongs to.

$$-18 \equiv 42 \equiv 99,982 \ (\text{mod} \ 10)$$$$19 \equiv 4 \equiv -11 \ (\text{mod} \ 3)$$
Because $-1 \equiv 2$ and $-2 \equiv 1$ (mod 3), the discrepancies of `5 % -3` and `-5 % 3` do not necessarily violate the expectations of mathematicians.

A [Galois Field](https://en.wikipedia.org/wiki/Finite_field), on the other hand, is a limited set that is defined similarly to the output range of the modulus operator. Arithmetics on `GF(d)` must return values within the range $\left [ 0, d \right )$ [^shifted]. In `GF(6)`, for example, $3+5=2$ and $3−5=4$.

[^shifted]: or within a similar sized range shifted elsewhere along the number-line – e.g. balanced around zero

The `GF(6)` example implies a need for a rotational modulus operator that doesn't suddenly flip signs — honouring the third invariant defined above. But as we’ve seen, constructing such functionality (even with an erratic modulus operator) is not overly complicated.
