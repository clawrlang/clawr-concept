The returned value-set of an operator follows this rule:

```clawr
(:t subset_l) [op] (:t subset_r) -> t { x [op] y : x ∈ subset_l, y ∈ subset_r }
```

This is the cartesian product of the two subsets. The cartesian product is simple-ish for ranges (assuming that the operator is a bijective function):

```clawr
operator (left: type [min_l...max_l]) [op] (right: type [min_r...max_r]) -> type [
    min (min_l [op] min_r, min_l [op] max_r, max_l [op] min_r, max_l [op] max_r)
    ...
    max (min_l [op] min_r, min_l [op] max_r, max_l [op] min_r, max_l [op] max_r)
]
```

...which might be reduced further for addition and subtraction):

- `x - min` >= `x - max`
- `max - x` >= `min - x`
- `x + max` >= `x + min`
- `max + x` >= `min + x`
- `max + x` >= `min + x`

It is presumed that `min <= max` (or error should have been thrown) because otherwise the value-set would be empty.
 
Therefore:

```clawr
operator (left: type [min_l...max_l]) - right: (type [min_r...max_r]) -> type [min_l-max_r...max_l-min_t]
operator (left: type [min_l...max_l]) + right: (type [min_r...max_r]) -> type [min_l+min_r...max_l+max_t]
```

(Other operators cannot be simplified quite so easily. They’ll have to employ the generic cartesian product definition.)

Specific examples:

```clawr
mut x: integer [1...10]
mut y: integer [-5...5]

const xmy = x - y // integer [-6...15]
const ymx = y - x // integer [-15...4]
const xpy = x + y // integer [-4...15]
const xty = x * y // integer [-50...50]

mut z: integer [5...]

const xmz = x - z // integer [...5]
const zmx = z - x // integer [-4...]
const xpz = x + z // integer [6...]
const xtz = x * z // integer [5...]
```

But not all operators are bijective. Exponentiation e.g. is not. `x^2` has a minimum when `x == 0` and grows arbitrarily towards positive infinity for both positive and negative inputs. But that is not true for negative exponents. For `x^y` (where both inputs are ranges) it can become arbitrarily complex I believe. What is the range of `(:integer [-2..2]) ^ (:integer [-2..2])` ?

And that is just for integers. What about `real` values? `(:real [0...1])^(:real [-1...1]) -> real [??]`… And what about introducing functions? Like `tan(x)` , `ln(x)`, `sin(x)/x`…?

---

The returned value-set of an operator follows this rule:

```clawr
(:t subset_l) [op] (:t subset_r) -> t { x [op] y : x ∈ subset_l, y ∈ subset_r }
```

This is the *cartesian product* of the operation applied to the two subsets. The cartesian product is simple-ish for ranges (assuming that the operator is a bijective function):

$$
\left \{ x \circ y : x ∈ [x_{min}, x_{max}], y ∈ [y_{min},y_{max}] \right \} =
    \left [
    \min (x_{min} \circ y_{min}, x_{min} \circ y_{max}, x_{max} \circ y_{min}, x_{max} \circ y_{max})
,
    \max (x_{min} \circ y_{min}, x_{min} \circ y_{max}, x_{max} \circ y_{min}, x_{max} \circ y_{max})
    \right ]
$$

```clawr
operator (left: type [min_l...max_l]) [op] (right: type [min_r...max_r]) -> type [
    min (min_l [op] min_r, min_l [op] max_r, max_l [op] min_r, max_l [op] max_r)
    ...
    max (min_l [op] min_r, min_l [op] max_r, max_l [op] min_r, max_l [op] max_r)
]
```

...which might be reduced further for addition and subtraction (`min <= max` is presumed (or error should have been thrown — or the value-set is empty):

- `x - min` >= `x - max`
- `max - x` >= `min - x`
- `x + max` >= `x + min`
- `max + x` >= `min + x`
- `max + x` >= `min + x`

Therefore:

```clawr
operator (left: type [min_l...max_l]) - right: (type [min_r...max_r]) -> type [min_l-max_r...max_l-min_t]
operator (left: type [min_l...max_l]) + right: (type [min_r...max_r]) -> type [min_l+min_r...max_l+max_t]
```

(Other operators cannot be simplified quite so easily. They’ll have to employ the generic cartesian product definition for ranges.)

Specific examples:

```clawr
mut x: integer [1...10]
mut y: integer [-5...5]

const xmy = x - y // integer [-6...15]
const ymx = y - x // integer [-15...4]
const xpy = x + y // integer [-4...15]
const xty = x * y // integer [-50...50]

mut z: integer [5...]

const xmz = x - z // integer [...5]
const zmx = z - x // integer [-4...]
const xpz = x + z // integer [6...]
const xtz = x * z // integer [5...]
```

Division by zero is not allowed… Can we model that?

```clawr
operator (left: integer) - (right: integer) - {0} -> integer
operator (left: real) - (right: real) - {0} -> real
```

For `ternary` operators):

```clawr
subset boolean = ternary { false, true } // from stdlib

operator (left: boolean) && (right: boolean) -> boolean
operator (left: boolean) || (right: boolean) -> boolean
```
