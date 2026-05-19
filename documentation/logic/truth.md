# Truth in Clawr

Programming languages typically define a `boolean` type. So does Clawr. Boolean values are either `true` or `false`. They are used for branching and decision-making in programs:

```clawr
const isHappy: boolean = true

if isHappy {
   smile()
} else { 
   frown()
}
```

Boolean algebra includes three fundamental operators: “not” (`!`), “and” (`&&`) and “or” (`||`). The “not” operator returns the opposite of its input: `!true == false` and `!false == true`.

| `b`     | `!b`    |
| ------- | ------- |
| `false` | `true`  |
| `true`  | `false` |

The “and” operator returns `true` only if *both* inputs are `true`. The “or” operator returns `true` if *either* input is `true`. These three operators are enough to describe any function involving `boolean` values. There is another important operator

| `a`     | `b`     | `a && b` | `a \|\| b` |
| ------- | ------- | -------- | ---------- |
| `false` | `false` | `false`  | `false`    |
| `false` | `true`  | `false`  | `true`     |
| `true`  | `false` | `false`  | `true`     |
| `true`  | `true`  | `true`   | `true`     |

```clawr
if !isHappy { frown() }

if a && b || !c {
   // ...
}
```

## De Morgan’s Theorem

Boolean expressions can be simplified by knowing De Morgan’s laws. Looking at the truth-table above, the similarity between `a && b` and `a || b` is striking. They are almost exactly each other’s opposite. Augustus De Morgan formulated the law as follows: [^de-morgan]

[^de-morgan]: Of course, De Morgan did not express his laws in Clawr syntax, but used mathematical notation. See [Wikipedia](https://en.wikipedia.org/wiki/De_Morgan%27s_laws).

```clawr
!(a && b) == !a || !b
!(a || b) == !a && !b
```

## Three-Valued Truth

Truth is however not limited to Boolean certainty. The truth of a claim can be unknown or it can be paradoxical. To model this incertitude, Clawr introduces a third truth-value: the `ambiguous` truth. `boolean` is actually not its own type in Clawr, but a mere [`subset`](./types-are-sets.md) of another type: `ternary`.

```clawr
enum ternary { false, ambiguous, true }
subset boolean = ternary - { ambiguous }
```

Ambiguity allows for more complex logic. The `ambiguous` value is neither `true` nor `false`. [^kleene] Therefore, using it in an `if` statement will lead to that branch being skipped.

[^kleene]: This matches the logic systems of  [Stephen Cole Kleene and Jan Łukasiewicz](https://en.wikipedia.org/wiki/Three-valued_logic)

```clawr
const isHappy = ambiguous

if isHappy {
   smile() // This will not happen.
} else if !isHappy {
   frown() // Nor will this.
} else {
   lookConfused() // This will.
}
```

The Boolean operators also become more complex. Not (`!`) retains its original definition (toggle between `true` and `false`). The only addition is that the input can be `ambiguous`.

| `b`         | `!b`        |
| ----------- | ----------- |
| `false`     | `true`      |
| `ambiguous` | `ambiguous` |
| `true`      | `false`     |

The “and” operator changes to a min function and “or”  becomes max. We order the values such that `false < ambiguous < false`. Then taking the minimum or maximum of two values makes sense. This behaviour is also consistent with the pure Boolean truth-table from earlier.

| `a`         | `b`         | `a && b`    | `a \|\| b`  |
| ----------- | ----------- | ----------- | ----------- |
| `false`     | `false`     | `false`     | `false`     |
| `false`     | `ambiguous` | `false`     | `ambiguous` |
| `false`     | `true`      | `false`     | `true`      |
| `ambiguous` | `false`     | `false`     | `ambiguous` |
| `ambiguous` | `ambiguous` | `ambiguous` | `ambiguous` |
| `ambiguous` | `true`      | `ambiguous` | `true`      |
| `true`      | `false`     | `false`     | `true`      |
| `true`      | `ambiguous` | `ambiguous` | `true`      |
| `true`      | `true`      | `true`      | `true`      |

If you inspect these `ternary` truth-tables, you will notice that the output is never `ambiguous` unless at least one of the inputs is. That means that you can stay securely in the Boolean world if you do not need the added power of `ternary`.

If you do wish to employ the full `ternary` set, some additional operations become relevant.

### Adjusted and Rotated Truth

The “and” and “or” operations define an ordering of truth values: `false < ambiguous < true`. There are two main functions that traverse this ordering: `adjust(a, towards: b)` shifts the value of `a` in the direction of `b`, and `rotate(a, by b)` does the same, but with one important difference: `adjust` stops if `a == b`, but `rotate` continues “out the side” and comes “back in” on the other side. Rotation is useful for cryptography as it is fully reversible.

| `a`         | `b`         | `adjust(a, towards: b)` | `rotate(a, by: b)` |
| ----------- | ----------- | ----------------------- | ------------------ |
| `false`     | `false`     | `false`                 | `true`             |
| `false`     | `ambiguous` | `false`                 | `false`            |
| `false`     | `true`      | `ambiguous`             | `ambiguous`        |
| `ambiguous` | `false`     | `false`                 | `false`            |
| `ambiguous` | `ambiguous` | `ambiguous`             | `ambiguous`        |
| `ambiguous` | `true`      | `true`                  | `true`             |
| `true`      | `false`     | `ambiguous`             | `ambiguous`        |
| `true`      | `ambiguous` | `true`                  | `true`             |
| `true`      | `true`      | `true`                  | `false`            |

There are also single-input versions of the functions that move in a specific direction: `strengthen(t)` shifts towards `true` and `weaken(t)` shifts toward `false`. The corresponding rotational functions are named `rotateUp(t)` and `rotateDown(t)`.

| `t`         | `strengthen(t)` | `weaken(t)` | `rotateUp(t)` | `rotateDown(t)` |
| ----------- | --------------- | ----------- | ------------- | --------------- |
| `false`     | `ambiguous`     | `false`     | `ambiguous`   | `true`          |
| `ambiguous` | `true`          | `false`     | `true`        | `false`         |
| `true`      | `true`          | `ambiguous` | `false`       | `ambiguous`     |
### Consensus and Gullibility

There are two other core operations for `ternary` truth. The `consensus` function (sometimes referred to as `CONS`) returns `ambiguous` if the two inputs are different. If they are the same value, that value is also the output.

The `any` function (a.k.a. “gullibility”) requires only one clear opinion to follow it. Otherwise it is the same as `cons`.

| `a`         | `b`         | `consensus(a, b)` | `any(a, b)` |
| ----------- | ----------- | ----------------- | ----------- |
| `false`     | `false`     | `false`           | `false`     |
| `false`     | `ambiguous` | `ambiguous`       | `false`     |
| `false`     | `true`      | `ambiguous`       | `ambiguous` |
| `ambiguous` | `false`     | `ambiguous`       | `false`     |
| `ambiguous` | `ambiguous` | `ambiguous`       | `ambiguous` |
| `ambiguous` | `true`      | `ambiguous`       | `true`      |
| `true`      | `false`     | `ambiguous`       | `ambiguous` |
| `true`      | `ambiguous` | `ambiguous`       | `true`      |
| `true`      | `true`      | `true`            | `false`     |
