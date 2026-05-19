# Lowering of `ternary`(and `boolean`)

Idea: represent ternary values as two bits:

- `false == 0b00`
- `ambiguous == 0b01`
- `ambiguous == 0b10`
- `true == 0b11`

Note that `ambiguous` appears twice in the list. That is because both values `0b01` and `0b10` can be interpreted as `ambiguous`.

Boolean operators can then be implemented as follows:

- `x && y => x & y`
- `x || y => x | y`
- `!x => ~x`

It gets more interesting with non-Boolean operators (i.e. operators that can yield `ambiguous` even when the input is strictly Boolean):

- `rotate_up(x) => (x + 1) % 4`. If the result is 2 (`0b10`), return 3 instead.
- `rotate_down(x) => (x - 1) % 4`. If the result is 1 (`0b01`), return 0 instead.
- `adjust_up(x) => min(x + 1, 3)`. If the result is 2 (`0b10`), return 3 instead.
- `adjust_down(x) => max(x - 1, 0)`. If the result is 1 (`0b01`), return 0 instead.

Then we have the sum operators. I call them `rotate(by:)` and `adjust(towards:)` to abstract away the specific numbers.

- `adjust(x, towards: true)` is the same as `adjust_up(x)`
- `adjust(x, towards: false)` is the same as `adjust_down(x)`
- `rotate(x, by: true)` is the same as `rotate_up(x)`
- `rotate(x, by: false)` is the same as `rotate_down(x)`
- `adjust(x, towards: ambiguous)` and `rotate(x, by: ambiguous)` are both the identity `x`

And since they are all commutative, you could also say that ”`rotate(true, by: x)`  is the same as `rotate_up(x)`,” but it sounds weird, because it confuses the linguistic intent of the parameter label.

I don't know if `consensus` and `gullibility` (a.k.a. CONS and ANY) are important operators. We can hold off their analysis for now.

Another important question is that of `if` and other decision-making statements. I believe that the most intuitive interpretation treats `ambiguous` as `false` in predicates. Hence, `if x` is equivalent to `if x == true`. My experience of beginners to e.g. Java — beginners who do not yet understand that you can use Boolean variables as predicates — typically write `if (x == true)`, rather than `if (x != false)`.

For an statement/expression like `if x == ambiguous` to work, both cases of `ambiguous` will need to be checked in runtime. This might not be too big of a problem if the typical use case is to stick with the `boolean` subset.




![[20630383-BDF4-487D-ABAB-B931F356E0FB_1_102_o.jpeg]]