Swift has a problem (duh). 

Swift encourages immutability by giving you a warning if you do not mutate a `var`. “Hey, you can use `let` here.” Using `let` is good practice.

But Swift has the `class` keyword. If you make a `class` instance `let` it does not mean it is immutable. The keyword is a lie!

Clawr does not have a `class` keyword. You cannot reference an instance with `const`. A `const` is a *variable*, not a pointer to an *object* with state. You **cannot** reference this variable in any way other than directly, through its own name. And `const` also means “constant” — i.e. immutable — it cannot be modified, even in part. It will always have the same value until it goes out of scope and is destroyed.

The same logic applies to `mut` variables. The only difference is that a `mut` variable is mutable. It can be changed — but only through direct access.

If you want to *reference* an object you explicitly use the `ref` keyword. When you need mutable state information easily referenced by different parts of your code, is when you use `ref`. A `ref` variable is just a pointer to an entity that resides somewhere in memory. A typical use-case for `ref` is a service. A service typically provides access to hardware or the environment.

---

JavaScript has a problem too.

I'm building a parser in TypeScript, and need to match a `string` value to a case in the `VariableSemantics` enum. How can I get `undefined` if the value does not exist, but a `VariableSemantics` types value if it exists?

```ts
export enum VariableSemantics {
    IMMUTABLE = 'const',
    MUTABLE = 'mut',
    SHARED = 'ref',
}
```

```ts
const x = VariableSemantics["const"]
assert(x == VariableSemantics.IMMUTABLE) // fails
```

In this case Swift is the smart one. Swift understand the purpose of an `enum`.

```swift
let x = VariableSemantics(rawValue: "const")
assert(x == .IMMUTABLE)
```

Turns out: It might be better to match repeat the values in the labels:

```ts
export enum VariableSemantics {
    const = 'const',
    mut = 'mut',
    ref = 'ref',
}
```

```ts
const x = VariableSemantics["const"]
assert(x == VariableSemantics.const) // succeeds
```
