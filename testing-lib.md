# How to design a Testing Library?

```clawr
import { assert, expect } from `clawr:testing`
import { x } from `tested_module`

assert.that(x, is.empty)
expect(
    x, 
    Did.addEvent(name: 'NameChanged')
        .withDetails({ name: "New Name" })
)
```

JavaScript's `expect` function is not extensible in TypeScript. Nor would it be if ported to Clawr (unless retroactive modelling).

```ts
expect(x).toMatchObject({})
```

The object returned from `expect(x)` is set. Adding methods — in TypeScript — is impossible.

Maybe it can be done with retroactive modelling:

```clawr
import { assert, expect } from `clawr:testing`
import { x } from `tested_module`

assert.that(x).is.empty()
expect(x).Did.addEvent(name: 'NameChanged')
    .withDetails({ name: "New Name" })
```

But it would probably be more ergonomic to add a `Matcher` parameter to the `assert.that()` function. With a syntax inspired by Swift’s trailing closure syntax (but for a trailing *collection* instead):

```clawr
// func expect<T>(_ unit: T, matchers: Matcher<T>[])

expect(x) [
    Is.empty

    Did.addEvent(name: 'NameChanged')
        .withDetails({ name: "New Name" })
]
```

Maybe this syntax can support both collections and `data` structures?

```clawr
// data Options { flag: boolean, count: integer [1...10] }
// func doSomething(_ parameter: X, options: Options)

doSomething(x) { // Braces to signify a structure (square brackets for a list)
    flag: true
    count: 123
}
```
