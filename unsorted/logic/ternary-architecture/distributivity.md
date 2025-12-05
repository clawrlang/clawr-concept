# AND / OR

Ternary `AND` distributes over `OR` terms (like standard multiplication and addition):
$$A \times (B + C) = A \times B + A \times C$$
**proof:**

Ternary `AND` is also known as `MIN` as it returns the smallest of the inputs (on the order $-1 < 0 < 1$). Ternary `OR` (a.k.a. `MAX`) returns the largest (according to the same order).

By symmetry we can say $B \leq C$ and know that the proof would work the same if $C \leq B$. `MAX` is commutative, so we can just rename $B$ as $C$ and $C$ as $B$.

There are three possible cases for $A$. $A \leq B$, $B < A \leq C$ or $C < A$. Let’s examine each case in turn.

For $A \leq B$:

$$A \leq B \implies A \leq C$$
$$A \times (B + C) = Min(A, Max(B, C)) = Min(A, C) = A$$
$$A \times B + A \times C = Max(Min(A, B), Min(A, C)) = Max(A, A) = A$$
$$\square$$

For $B < A \leq C$:

$$A \times (B + C) = Min(A, Max(B, C)) = Min(A, C) = A$$
$$A \times B + A \times C = Max(Min(A, B), Min(A, C)) = Max(B, A) = A$$
$$\square$$

For $C < A$:

$$A > C \implies A > B$$
$$A \times (B + C) = Min(A, Max(B, C)) = Min(A, C) = C$$
$$A \times B + A \times C = Max(Min(A, B), Min(A, C)) = Max(B, C) = C$$
$$\square$$

---
# MUL / SUM

`MUL` distributes over `SUM`:
$$A \otimes (B \oplus C) = A \otimes B \oplus A \otimes C$$
I cannot write a mathematical proof on the same form as for `AND`/`OR`, but since there are only three possible values, I can just exhaustively list all the possible scenarios and show that the equality holds in all cases.

Here is a truth table [^1] that shows that both sides are equal for every combination of inputs:

[^1]: Maybe “*truth table*” is the wrong term when using ternary logic? Don’t have a better term though.

| $A$ | $B$ | $C$ | $B \oplus C$ | $A \otimes (B \oplus C)$ | $A \otimes B$ | $A \otimes C$ | $A \otimes B \oplus A \otimes C$ |
| --- | --- | --- | ------------ | ---------------------------- | ------------- | ------------- | ------------------------------------ |
| `-` | `-` | `-` | `+`          | `-`                          | `+`           | `+`           | `-`                                  |
| `-` | `-` | `0` | `-`          | `+`                          | `+`           | `0`           | `+`                                  |
| `-` | `-` | `+` | `0`          | `0`                      | `+`           | `-`           | `0`                              |
| `-` | `0` | `-` | `-`          | `+`                          | `0`           | `+`           | `+`                                  |
| `-` | `0` | `0` | `0`          | `0`                          | `0`           | `0`           | `0`                                  |
| `-` | `0` | `+` | `+`          | `-`                          | `0`           | `-`           | `-`                                  |
| `-` | `+` | `-` | `0`          | `0`                          | `-`           | +             | `0`                                  |
| `-` | `+` | `0` | +            | `-`                          | `-`           | 0             | `-`                                  |
| `-` | `+` | `+` | `-`          | `+`                          | `-`           | `-`           | `+`                                  |
| `0` | `-` | `-` | `+`          | `0`                          | `0`           | `0`           | `0`                                  |
| `0` | `-` | `0` | `-`          | `0`                          | `0`           | `0`           | `0`                                  |
| `0` | `-` | `+` | `0`          | `0`                          | `0`           | `0`           | `0`                                  |
| `0` | `0` | `-` | `-`          | `0`                          | `0`           | `0`           | `0`                                  |
| `0` | `0` | `0` | `0`          | `0`                          | `0`           | `0`           | `0`                                  |
| `0` | `0` | `+` | `+`          | `0`                          | `0`           | `0`           | `0`                                  |
| `0` | `+` | `-` | `0`          | `0`                          | `0`           | `0`           | `0`                                  |
| `0` | `+` | `0` | +            | `0`                          | `0`           | `0`           | `0`                                  |
| `0` | `+` | `+` | `-`          | `0`                          | `0`           | `0`           | `0`                                  |
| `+` | `-` | `-` | `+`          | `+`                          | `-`           | `-`           | `+`                                  |
| `+` | `-` | `0` | `-`          | `-`                          | `-`           | `0`           | `-`                                  |
| `+` | `-` | `+` | `0`          | `0`                          | `-`           | `+`           | `0`                                  |
| `+` | `0` | `-` | `-`          | `-`                          | `0`           | `-`           | `-`                                  |
| `+` | `0` | `0` | `0`          | `0`                          | `0`           | `0`           | `0`                                  |
| `+` | `0` | `+` | `+`          | `+`                          | `0`           | `+`           | `+`                                  |
| `+` | `+` | `-` | `0`          | `0`                          | `+`           | `-`           | `0`                                  |
| `+` | `+` | `0` | `+`          | `+`                          | `+`           | `0`           | `+`                                  |
| `+` | `+` | `+` | `-`          | `-`                          | `+`           | `+`           | `-`                                  |
