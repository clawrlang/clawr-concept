When calling a function, what should be the `semantics` flag of its parameters and return value?

```azlan
object Business: Entity {
  mut name: string

mutating:
  func support(cause: mut Cause): EntityId

static:
  func new(name: string): ref Business
  func reconstitute(id: EntityId, from store: ref EntityStore)
}

struct Cause {
  guardian: EntityId
  effort: EntityId
}
```

When creating a new `Business`, should the caller be required to `copy` if the semantics do not match the structure returned? Should the caller let the function know what semantic it wants to use?

```azlan
let business1 = copy Business.new() // Unnecessary copy if new() could return a `semantics.copy` structure.
mut business2 = copy Business.new() // Unnecessary copying
ref business3 = Business.new()
```

Should it be up do the programmer to create multiple APIs as needed?

```azlan
let business1 = Business.newWithCopySemantics()
mut business2 = Business.newWithCopySemantics()
ref business3 = Business.newWithReferenceSemantics()
```

When passing parameters, what should the semantics be?

It should be possible to pass a literal structure:

```azlan
business.support({ guardian: "WWF", effort: "Panda Love" })
```

… or an object:

```azlan
let cause: Cause = Cause(guardian: "WWF", effort: "Panda Love")
business.support(cause)
```

Should the API reflect the expected `semantics` flag?

```azlan
func support(cause: mut Cause): EntityId
func support(cause: ref Cause): EntityId
```

Maybe parameters should be default (implicit) `let`, which would mean that they cannot be modified by the method body, and therefore the `semantics` flag is irrelevant?

If the structure *is* modified by the function, it needs to be explicitly passed as `ref` which indicates that changes propagate back to the caller’s context.

But then there is the case of storing away the value in a field. What should happen then? In Swift, the `@escaping` keyword is used to indicate such a scenario. I do not see that as helpful or desired for Azlan.

Adding `ref` to the signature means that it is the passed *object or structure* that is stored away. It might be mutated in complex ways for various directions, and the caller *must* pass a `semantics:ref` structure.

If the function wants a `semantics:copy` structure (copy-on-write), they need to tag the parameter as `mut`, and if the caller context is a `ref` variable, they will need to explicitly `copy` it.

```azlan
ref cause: Cause = Cause(guardian: "WWF", effort: "Panda Love")
business.support(copy cause)
```
