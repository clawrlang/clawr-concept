```clawr
data Info @packable {
  a: integer [1...100]      // Fits in 7 bits/4 trits
  b: boolean                // Fits in 1 bit/trit
  c: ternary                // Fits in 2 bits/1 trit
  d: string                 // Fits in 1 register (pointer)
}
```
The `Info` type could be packed into two registers’ worth of memory. Two memory addresses.

Ideas for syntax:

```clawr
@packable
data Info {
  [1...100]
  a: integer
  b: boolean
  c: ternary
  d: string
}
```

```clawr

```
