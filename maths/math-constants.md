# Exact Values of Math Constants

- $\phi = {1 + \sqrt {5} \over 2} = 1 + \sqrt { 1 + \sqrt { 1 + ... } } = 1 + {1 \over {1 + {1 \over {1 + ...}}}}$
- $e = \lim_{n \to \infty} \left (1 + {1 \over n} \right )^n = \sum_{k=0}^\infty {1 \over k!}$
- $\pi = \sum_{k = 1}^\infty {(-1)^k \over 2k + 1}$ (Leibniz — slow — algorithm)

## One Hundred Digits

```clawr
const e = 2.718281828459045235360287471352662497757247093699959574966967627724076630353547594571382178525166427427 // https://apod.nasa.gov/htmltest/gifcity/e.1mil
const π = 3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982 // https://www.piday.org/million/
const φ = 1.618033988749894848204586834365638117720309179805762862135448622705260462818902449707207204189391137484 // https://nerdparadise.com/math/reference/phi10000
```

### Why 100 Digits is a Fantastic Baseline

Storing 100 decimal digits of π is an excellent choice for several reasons:

- **Overkill for 99.9% of Use Cases:** For any scientific, engineering, or graphics application running on real-world hardware (even exotic ternary machines), 100 decimal digits is astronomically precise.
    - _Context:_ 39 digits of π is enough to calculate the circumference of the observable universe to within the width of a single hydrogen atom. 100 digits is so far beyond any physical measurement that it's effectively an "exact" constant for any practical computation.
- **Minimal Storage Cost:** 100 digits is trivial to store. Even as a string, it's a tiny fraction of a kilobyte. You could store it as a packed decimal (approx 42 bytes) or as a text literal.
- **Sufficient for "Arbitrary Precision" Up to a Point:** If a user is doing calculations with, say, 50-digit precision, having π to 100 digits means the precision of π will not be the bottleneck.
- **Psychologically "Complete":** 100 is a nice round number. It feels like a "high-precision" constant, much more so than 32 or 64.