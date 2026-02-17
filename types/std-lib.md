
Here is a list of types that should probably be included in the standard library:

- `List: ordered collection with varying size
- `Set`: unordered, unique elements
- `Dictionary`: key-value pairs
- `Optional<T>`
- `Data`: Raw binary (or ternary) data
- `List`

```clawr
enum boolean { false, true }
enum ternary { false, ambiguous, true }

union Optional<T> {
  case empty
  case (T)
}
```

