These are the gates proposed as “useful” by Louis Duret-Robert <https://louis-dr.github.io/ternlogic.html>

| Matrix    | Name |                   |
| --------- | ---- | ----------------- |
| `[− 0 +]` | BUF  | Pass as is        |
| `[+ 0 −]` | NOT  | Flip sign         |
| `[+ + -]` | PNOT | Positive bias     |
| `[+ - -]` | NNOT | Negative bias     |
| `[+ 0 +]` | ABS  | Absolute value    |
| `[0 0 +]` | CLU  | Clamp up          |
| `[- 0 0]` | CLD  | Clamp down        |
| `[0 + +]` | INC  | Increment tow. 1  |
| `[- - 0]` | DEC  | Decrement tow. -1 |
| `[0 + -]` | RTU  | Rotate up         |
| `[+ - 0]` | RTD  | Rotate down       |
| `[- - +]` | ISP  | “Is positive”     |
| `[- + -]` | ISZ  | “Is zero”         |
| `[+ - -]` | ISN  | “Is negative”     |

| Matrix                         | Name  | Description             |
| ------------------------------ | ----- | ----------------------- |
| `− − −`<br>`− 0 0`<br>`− 0 +`  | AND   | And / minimum           |
| `+ + +`<br>`+ 0 0`<br>`+ 0 −`  | NAND  | Inverted and / minimum  |
| `− 0 +`<br>`0 0 +`<br>`+ + +`  | OR    | Or / maximum            |
| `+ 0 −`<br>`0 0 −`<br>`− − −`  | NOR   | Inverted or / maximum   |
| `− 0 0`<br>`0 0 0`<br>`0 0 +`  | CONS  | Consensus               |
| `+ 0 0`<br>`0 0 0`<br>`0 0 −`  | NCONS | Inverted consensus      |
| `− − 0`<br>`− 0 +`<br>`0 + +`  | ANY   | Any                     |
| `+ + 0`<br>`+ 0 −`<br>`0 − −`  | NANY  | Inverted any            |
| `+ 0 −`<br>`0 0 0`<br>`− 0 +`  | MUL   | Multiplication          |
| `− 0 +`<br>`0 0 0`<br>`+ 0 −`  | NMUL  | Inverted multiplication |
| `+ − 0`<br>`− 0 +`<br>`0 + −`  | SUM   | Addition                |
| `− + 0`<br>`+ 0 −`<br>`0 − +`​ | NSUM  | Inverted addition       |
