# Types and Value-sets

Types work differently in Clawr than in other languages. A variable is not defined by its structural type alone, but by a *subset*.

A primitive type is a set of similarly structured values. The `integer` type allows any integer $i \in \mathbb{Z}$. The `real` type allows any  $r \in \mathbb{R}$. And the `ternary` type allows any truth-value in the set {`false`, `true`, `ambiguous`}.

A `subset` selects certain values of a primitive superset. That can be a contiguous range or a list of individual values. Like these, defined in Clawr's standard library:

```clawr
subset boolean = ternary { false, true } // ternary except ambiguous
subset natural = integer [0...] // any non-negative integer
```
