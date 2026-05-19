> [!info] Reference-counted types
> - A `data` structure aggregates a number of related variables — “fields.”
> - An `object` is a `data` structure that has been hidden behind an interface — “methods.” Code that uses an `object` may only operate its methods, not its fields directly.
> - A `service` is an `object` that is allowed to access and manipulate state outside its `data` structure.

> [!danger] Shared Mutable State
> A `service` is *by definition* not isolated. Because it is not restricted to its own memory, it can be affected by other services or even by physical events in nature.
> 
> Therefore, it cannot fulfil the guarantees implied by the isolated semantics keywords `const` and `mut`. All `service` variables are restricted to `ref` only.
