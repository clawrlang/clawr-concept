# Euclid’s Algorithm

gcd$(a, b)$ is found by repeatedly looking for the remainder after division, $r_k$:

$$r_1 \leftarrow a ≠ 0$$
$$r_2 \leftarrow b ≠ 0$$
$$r_k \leftarrow r_{k-2} - \left \lfloor {r_{k-2}\over r_{k-1}} \right \rfloor \cdot r_{k-1}$$
When $r_k = 0$, gcd$(a, b) = r_{k-1}$. If $\text{gcd}(a, b) = 1$ , $a$ and $b$ are *co-prime*.

In programming:

```clawr
func gcd(_ a: integer, _ b: integer) -> integer {
    if (a == 0) return b
    if (b == 0) return a

    return gcd(b, a % b)
}
```

## Example: gcd$(273, 352)$

$$r_1 \leftarrow 273,r_2 \leftarrow 352$$ $$r_3 \leftarrow r_1 - \left \lfloor {r_1 \over r_2} \right \rfloor \cdot r_2 =
273 - \left \lfloor {273 \over 352} \right \rfloor \cdot 352 = 273$$ $$r_4 \leftarrow r_2 - \left \lfloor {r_2 \over r_3} \right \rfloor \cdot r_3 =
352 - \left \lfloor {352 \over 273} \right \rfloor \cdot 273 = 79$$ $$273 - \left \lfloor {273 \over 79} \right \rfloor \cdot 79 = 36$$ $$79 - \left \lfloor {79 \over 36} \right \rfloor \cdot 36 = 7$$ $$36 - \left \lfloor {36 \over 7} \right \rfloor \cdot 7 = 1$$ $$7 - \left \lfloor {7 \over 1} \right \rfloor \cdot 1 = 0$$ 

$\therefore$ Therefore, gcd$(273,352) = 1$. The inputs are co-prime. Let's verify this by prime factorisation: $273 = 3*91, 352 = 2^5*11$. There are no common prime factors; they are co prime. $\blacksquare$

### Non Co-prime Example: gcd$(3\,910, 255)$

$$3\,910 - \left \lfloor {3\,910 \over 255} \right \rfloor = 85$$
$$255 - \left \lfloor {255 \over 85} \right \rfloor = 0$$
So gcd$(3910, 255) = 85$. This means that their fraction can be reduced:
$${3\,910 \over 255} = {3\,910/85 \over 255/85} = {46 \over 3} = {2 \cdot 23 \over 3}$$

## Least Common Multiple

The *least common multiple* (lcm) can be computed from the greatest common divider, gcd:

$$\text{lcm}(a, b) = \left \lvert ab \over \text{gcd}(a, b) \right \rvert$$

### Example: lcm$(3910, 255)$

From the gcm example, we know that:

$$\text{gcd}(3\,910, 255) = 85$$
$${3\,910 \over 255} = {46 \over 3}$$

We can calculate the least common multiple as:

$$\text{lcm}(3\,910, 255) = \left \lvert 255 \cdot 3\,910 \over 85 \right \rvert = 11\,730$$

$\therefore$ Therefore, we have a means of simplifying sums of fractions like these:

$${x \over 3\,910} + {y \over 255} = {3x + 46y \over 11\,730}$$
