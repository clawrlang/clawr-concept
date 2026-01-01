
# Operator Precedence

**Initially supported binary operators:**

| operator                                              |                                                           |                                                                                |
| ----------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `=`, `??=`, `&&=`, `\|\|=`,<br>`+=`, `-=`. `*=`, `/=` | Assignment                                                | statement, not expression                                                      |
| `\|\|`                                                | Boolean OR                                                |                                                                                |
| `&&`                                                  | Boolean AND                                               |                                                                                |
| `??`, `?:`                                            | “Elvis” operator/null coalescing                          |                                                                                |
| `<`, `>`, `<=`, `>=`, `≤`, `≥`                        | Comparison                                                |                                                                                |
| `==`, `===`, `!=`, `≠`, `!==`                         | Equality                                                  |                                                                                |
| `+`, `-`                                              | Addition/subtraction / concatenation / union/intersection |                                                                                |
| `*`, `/`                                              | Multiplication                                            |                                                                                |
| `**`                                                  | Exponentiation                                            | Right-associative?<br>$2^{3^4}$ (preferred)<br>$(2^3)^4 = 2^{3*4}$ (undesired) |
| `.`, `?.`, `!.`                                       | Member Access                                             |                                                                                |

**Unary operators:**

| `!`, `~` | Boolean NOT |
| -------- | ----------- |

**Ternary operator:**

| `?` `:` | Ternary operator |
| ------- | ---------------- |

**All known binary operators:**

Not all these will be supported. (At least not initially.)

| operator                                                                               |                |                                 |
| -------------------------------------------------------------------------------------- | -------------- | ------------------------------- |
| `.`                                                                                    | Member Access  |                                 |
| `<<`, `>>`                                                                             | Shift          | Must be higher than comparisons |
| `**`                                                                                   | Exponentiation |                                 |
| `*`, `/`                                                                               | Multiplication |                                 |
| `+`, `-`                                                                               | Addititon      |                                 |
| `!=`, `≠`, `!==`                                                                       |                |                                 |
| `==`, `===`                                                                            | Equality       |                                 |
| `^`                                                                                    | Boolean XOR    |                                 |
| `&&`, `&`                                                                              | Boolean AND    |                                 |
| `\|\|`, `\|`                                                                           | Boolean OR     |                                 |
| `<`, `>`, `<=`, `>=`, `≤`, `≥`                                                         | comparison     |                                 |
| `??`, `?:`                                                                             | Elvis operator |                                 |
| `=`, `??=`, `+=`, `-=`. `*=`, `^=`, `\|=`,<br>`&=`, `^=`, `<<=`, `>>=`, `&&=`, `\|\|=` | Assignment     | statement, not expression       |

$\supseteq$ 