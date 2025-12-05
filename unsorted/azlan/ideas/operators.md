

| Level  | Category                  | Operators                                   | Applies To           |
| :----: | :------------------------ | :------------------------------------------ | :------------------- |
| **12** | **Postfix / access**      | `.`, `[]`, `()`, `?.`, `!`, `!.`, `++`/`--` | all                  |
| **11** | **Unary / prefix**        | `-`, `+`, `!`, `~`, `copy`, `await`, `not`  | all                  |
| **10** | **Bitwise shift**         | `<<`, `>>`                                  | bitfield             |
| **9**  | **Exponentiation**        | `^`                                         | integer              |
| **9**  | **Bitwise and, xor**      | `^`, `&`                                    | bitfield             |
| **7**  | **Multiplicative**        | `*`, `/`, `%`                               | integer              |
| **6**  | **Bitwise or**            | `\|`                                        | bitfield             |
| **6**  | **Additive**              | `+`, `-`                                    | integer              |
| **6**  | **Concatenation**         | `+`                                         | string               |
| **5**  | **Comparison / equality** | `<`, `>`, `<=`, `>=`, `==`, `!=`            | all comparable types |
| **4**  | **Logical AND**           | `&&`                                        | bool                 |
| **3**  | **Logical OR**            | `\|\|`                                      | bool                 |
| **2**  | **Conditional**           | `a if cond else b`                          | all                  |
| **1**  | **Assignment**            | `=`, `*=`, `+=`, `-=`, `<<=`…               | all                  |
