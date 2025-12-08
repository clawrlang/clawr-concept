# Serialisable `data`

Simple `data` structures should be directly representable as JSON (and other persistence formats).

Supposedly, that means that its properties must be accessible by name, and that the runtime must know the type of each property.

Imagine a type like this one:

```clawr
data Point { x: real, y: real }
```

This should be automatically translated to/from JSON like this:

```json
{ "x": 12, "y": 0.3 }
```

The field names of the `struct` should be matched to the property names of the JSON.

There are some additional considerations.

- Sometimes the JSON properties need to include hyphens or other invalid (for Clawr) characters.
- Sometimes a structure needs to be converted to an array. (The point above might for example be represented as `[12, 0.3]`.)
- Etc.

For that, we should add a trait (maybe called `CustomCodable`?):

```azlan
model Point: CustomCodable {
  // complex code to generate structured data that does not map directly to the properties
}
```

Or we might use annotations:

```clawr
data Point {
  x: real @encoded_name("$x")
  y: real @encoded_name("$y")
}
```

## Complications

A `data` with `ref` fields cannot be implicitly serialisable as `ref` fields might generate referential cycles. If it is possible to prove the absence of cycles through static analysis, they *might* be allowed. But if cycles might be possible, serialisation cannot be generalised.

If it *is* possible to detect cycles, they should perhaps cause compilation errors. To break the cycle, make some references `weak` (i.e. not reference-counted). This is a good feature for combatting memory leaks as well.

A `weak` reference could allow serialisation by simply being ignored/skipped. This would of course mean that the reference cannot be reestablished after deserialisation, though.
