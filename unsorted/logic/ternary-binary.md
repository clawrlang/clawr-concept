# Boolean Values are Ternary

Types are sets. The `ternary` type is a superset to `boolean`. A `boolean` value *is* a `ternary` value with the **added constraint** that it is not allowed/possible to be the neutral (`unset`) value.

The value `ternary.positive` is the same as `boolean.true`. And the value `ternary.negative` is the same as `boolean.false`. At least **conceptually**.

In the **implementation**, on the other hand, `boolean.false` must be a zero (at least on binary hardware), and `ternary.negative` must be -1. That is because in a binary bit-field, digits can only **be** 1 or 0. And in a ternary “trit-field,” `positive` and `negative` must be separated by `unset`.

What the actual implementation value is should however be irrelevant to the programmer. To them it should be enough to understand the algebra. The `!` operator toggles between `false` and `true`: `!false == true`, `!true == false`, but `!unset == unset`. The operator `&&` (“AND”) returns the minimum of two values and `||` (“OR”) returns the maximum, and `false < unset < true`.

This is all that is necessary to understand logics and Boolean/ternary algebra. What actual integer values are used behind the scenes is unimportant; an implementation detail.
