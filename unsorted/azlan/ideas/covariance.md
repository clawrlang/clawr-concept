# Covariance and Contravariance

```azlan
let null: Optional
null = Optional.none
```

`Optional.none` matches the type of `Optional<T>` for any type `T`. As .none doesn't reference the generic type parameter at all, it becomes irrelevant. Think Covariant inheritance: `Optional<integer>` -> `Optional<Arithmetic>` -> `Optional<any> == Optional`

The hypothesis is that covariance will always apply (implicitly) for immutable variables. (And enum cases are always immutable.)

When mutating a variable, either covariance or contravariance might apply. That might have to be explicit. Or can a general rule be formulated?
