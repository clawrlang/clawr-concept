# Ambiguous is False

The value `ambiguous` is not `true`. When you use it to make decisions it acts like `false`. Only the value `true` triggers the main branch of an `if` statement.

```clawr
if ambiguous { /* this is not executed */ }
if false { /* this is also not executed */ }
if true { /* but this is */ }
```

But `ambiguous` is also not the same as `false`:

```clawr
if !ambiguous { /* this is not executed */ }
if !true { /* this is also not executed */ }
if !false { /* but this is */ }
```

You could think of `ambiguous` as a `false` value, that stays `false` even after applying not (`!`).
