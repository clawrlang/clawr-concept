# Covariance and Contravariance

Other languages make a big deal of covariance and contravariance. These labels are applied to generic types. If a collection of dogs is referred to as a collection of animals, someone could incorrectly add a cat to it. Since cats are fundamentally incompatible with dogs, a client that wants to play fetch will be in for a surprise when one of the “dogs” is instead acting distant and aloof.

So languages add the concept of covariance and contravariance to say when the inheritance of a generic type argument can be seen as relevant to the inheritance order of the generic type itself.

E.g. the `IEnumerable<in T>` type in C# is covariant. As no elements can be added through the interface, the value can be sen as immutable. And the items of an immutable collection can be referred to as any supertype to their actual type. An `IEnumerable<Dog>` value can be passes to an `iEnumerable<Animal>` parameter without risk. The type-system adds `in` to the type parameter to indicate that this is allowed.

There is also *contravariance* which applies in the reverse. In C# this is labelled as `<out T>` and has to be asserted on a per-generic-argument-list basis.

In Clawr, variance is implicit and straightforward.

- Isolated variables (`const`, `mut`) always enjoy covariance.
- Shared variables (`ref`) are completely invariant.

---

> [!question] AI Prompt
> How should covariance and contravariance work?
>
> In C# this is a runtime error:
>
> ```
> object[] array = new string[10];
> array[0] = 10; // Error: int item is incompatible with string array
> ```
>
> That means that the runtime must remember the generic type parameters of each value `Array<string>` even if the variable is `Array<object>`. I do not think I want Clawr to do that. It seems like it could generate a lot of overhead.
>
> In Clawr, an immutable variable is certainly covariant only. There is no risk that an invalid item is added to a collection that cannot change. At the other end is `ref`: a function that accepts a `ref` parameter can make changes, and if it is unspecific about generic types, it could set values that should not be allowed. I'm not sure about `mut`, but I expect that the C# example does apply (but without runtime protection).

This is a great question that sits at the intersection of your variable semantics and type theory. Let me think through the implications.

## The Core Problem

Covariance and contravariance issues arise when you have:

1. A type relationship (e.g., `Dog` is a subtype of `Animal`)
2. A generic container (e.g., `Array<T>`)
3. An attempt to treat the container as if it has a different type parameter

The classic problem: if `Array<Dog>` could be treated as `Array<Animal>`, you could insert a `Cat` into what's actually a `Dog` array.

## How Clawr's Semantics Change Things

Your semantics actually give you natural solutions:

### `const` variables: Safe covariance

```clawr
const dogs: Array<Dog> = [fido, rover]
const animals: Array<Animal> = dogs  // Safe!
```

This works because:

- The array is immutable
- No one can insert incompatible items
- Reading elements as `Animal` is always safe
- **No runtime type tracking needed** - the compiler just knows you can only read, and upcasting on read is always safe

### `ref` variables: Invariant (neither co- nor contravariant)

```clawr
ref dogs: Array<Dog> = [fido, rover]
ref animals: Array<Animal> = dogs  // Should be compile error
```

This must fail because:

- `animals` could be used to insert a `Cat`
- That would violate the `Array<Dog>` contract
- The function receiving `animals` doesn't know it's really dogs

**No runtime tracking needed** - just disallow it at compile time.

### `mut` variables: The interesting case

Here's where your semantics shine:

```clawr
mut dogs: Array<Dog> = [fido, rover]
mut animals: Array<Animal> = dogs  // What happens?
```

I see two defensible options:

**Option A: Disallow (like `ref`)**

- Treat `mut` like `ref` for variance purposes
- Safest, simplest to reason about
- Consistent rule: "mutable means invariant"

**Option B: Allow with copy-on-write semantics**

- The assignment triggers (or schedules) a copy
- `animals` gets an `Array<Animal>` with the same elements
- The type "widens" during the copy
- `dogs` remains `Array<Dog>`, isolated from `animals`

I lean toward **Option A** for consistency and predictability. But Option B has an interesting property: it makes the type system more permissive without runtime overhead, because the copy can transform the type parameter as it copies.

## Implementation Implications

### No Runtime Type Tracking Required

Unlike C#, you don't need to store generic type parameters at runtime because:

1. **`const` covariance**: Compiler enforces read-only access, so runtime doesn't care
2. **`ref` invariance**: Compiler prevents the assignment entirely
3. **`mut` invariance/copy**: Either prevented by compiler, or copy happens with new type

### Function Parameters

This gets interesting with generic functions:

```clawr
func processAnimals(mut animals: Array<Animal>) {
    animals.append(Cat())
}

mut dogs: Array<Dog> = [fido, rover]
processAnimals(dogs)  // What happens?
```

With Option A (disallow): Compile error. You'd need explicit widening:

```clawr
processAnimals(dogs.widen())  // or dogs.asArray<Animal>()
```

With Option B (copy): The function receives a copy that's truly `Array<Animal>`, leaving `dogs` unchanged.

## My Recommendation

**Go with invariance for both `mut` and `ref`, with explicit conversion when needed.**

Why?

1. **Predictable**: Same rule for all mutable contexts
2. **No surprises**: Assignment never changes types implicitly
3. **Explicit when needed**: Forces you to think about whether you want a copy or a widened view
4. **Zero runtime overhead**: All type checking at compile time
5. **Matches your philosophy**: Explicit over implicit, local reasoning

### The API Surface

```clawr
// Covariant conversion (safe, cheap)
const animals: Array<Animal> = dogs  // OK for `const`
const animals: Array<Animal> = dogs.asImmutable()  // Explicit for `mut/ref`

// Contravariant operations (require new container)
mut animals: Array<Animal> = dogs.widen()  // Creates new Array<Animal>
ref animals: Array<Animal> = dogs.widen()  // Creates new shared Array<Animal>
```

The `widen()` method makes it explicit that you're creating a new container with a looser type constraint.

## Contravariance for Function Types

Function types should follow standard rules:

```clawr
type DogProcessor = (Dog) -> void
type AnimalProcessor = (Animal) -> void

// Functions are contravariant in parameters
const processor: AnimalProcessor = someDogProcessor  // Error
const processor: DogProcessor = someAnimalProcessor  // OK - can handle dogs
```

This is unaffected by `const`/`mut`/`ref` since function types are always immutable references.

---

Does this align with your vision? The key insight is that your semantics give you a clean way to handle variance without runtime type information, which is both efficient and conceptually elegant.

> [!question] AI Prompt
> I think your point that `mut` will copy on write is important. It means that an `Array<Dog>` can be “converted” to an `Array<Animal>` without even having to create a copy.
>
> But maybe there is another interesting case? Let's say we have an `object` like this:
>
> ```clawr
> object Container<T> {
>     value() => self.value
> mutating:
>     set(value: T)
> data:
>     value: T
> }
>
> companion Container {
>     func new(_ value: T) -> Container<T> => { value: value }
> }
> ```
>
> What happens if we say:
>
> ```clawr
> mut c: Container<Animal> = Container<Dog>.new(rover)
> ```
>
> Does it matter if the “actual” type is `Container<Dog>`? Maybe it doesn't?

This is a brilliant observation! You've hit on something subtle and important.

## The Key Insight

With copy-on-write semantics, **the "actual" runtime type doesn't matter for `mut` variables** because:

1. The variable `c` is isolated
2. Any mutation triggers a copy
3. The copy can be constructed as whatever type the variable declares

So in your example:

```clawr
mut c: Container<Animal> = Container<Dog>.new(rover)
```

This should work! Here's why:

- `Container<Dog>.new()` creates some memory with a `Dog` inside
- Assigning to `c: Container<Animal>` doesn't need to "remember" it was a `Dog`
- When/if `c.set(someAnimal)` is called, copy-on-write triggers
- The copy is constructed as a true `Container<Animal>` with an `Animal` inside
- The original `Container<Dog>` (if still referenced) remains unchanged

## The Mental Model

Think of it this way:

```clawr
// This creates a Container<Dog> in memory
mut temp: Container<Dog> = Container<Dog>.new(fido)

// This assignment means:
// "c will behave as Container<Animal>, and if it needs to be modified,
//  we'll copy the data into a proper Container<Animal>"
mut c: Container<Animal> = temp

// At this point, c and temp share memory (both reference the Container<Dog>)
// But the *type contract* for c is Container<Animal>

// Now we mutate through c:
c.set(fluffy_the_cat)  // Triggers copy-on-write

// After mutation:
// - temp still has Container<Dog> with fido
// - c now has Container<Animal> with fluffy
// - The copy "widened" the type during construction
```

## Why This Works for `mut` but Not `ref`

```clawr
// This is still an error:
ref c: Container<Animal> = Container<Dog>.new()
```

Because:

- `ref` means "shared entity"
- Multiple references could exist to this entity
- If we allowed the type to "lie", someone could call `c.set(cat)`
- This would corrupt the shared `Container<Dog>` that others might be referencing
- **There's no copy-on-write protection** - mutations happen in place

## Implementation Details

### For `mut`: Lazy Type Widening

The compiler/runtime doesn't need to track "actual" vs "declared" type:

1. **Before mutation**: Both variables reference the same memory block
    - Runtime just needs reference count
    - Type information is only in the compiler's static analysis
2. **On mutation**: Copy-on-write creates new memory
    - The new allocation uses the variable's declared type
    - The copy constructor can widen types as needed

### For `ref`: Type Must Match

```clawr
ref c: Container<Animal> = Container<Dog>.new()  // Error
ref c: Container<Animal> = Container<Animal>.new()  // OK
```

The runtime must enforce this because shared mutations happen in-place.

## Covariance Rules Summary

| Context |Covariance|Why|
|---|---|---|
| `const` |✅ Safe|Immutable - can only read, upcasting is safe|
| `mut`   |✅ Safe|Copy-on-write protects isolation, copy can widen type|
| `ref`   |❌ Unsafe|Shared mutation could corrupt narrower type|

## The Beautiful Consequence

This means `mut` variables are **almost as flexible as `const`** for accepting values, but with mutation capabilities:

```clawr
// All of these work:
const dogs: Array<Dog> = [fido, rover]

const animals1: Array<Animal> = dogs  // OK - immutable covariance
mut animals2: Array<Animal> = dogs  // OK - copy-on-write covariance
ref animals3: Array<Animal> = dogs  // ERROR - would allow corruption
```

## Edge Case: Reading Through Wrong Type

One subtlety:

```clawr
mut c: Container<Animal> = Container<Dog>.new(fido)
const animal: Animal = c.value()  // What do we get?
```

Before any mutation occurs, `c` still references the `Container<Dog>` memory. But `c.value()` returns `Animal`. This works because:

- The actual data is a `Dog` (which _is_ an `Animal`)
- Returning it as `Animal` is just upcasting
- No type safety violation occurs

## Recommendation

**Allow covariant assignment to `mut` variables.** This gives you:

1. Maximum flexibility
2. Zero runtime type tracking overhead
3. Complete type safety (via copy-on-write)
4. Intuitive behavior: "`mut` is flexible like `const`, but can be modified"

The only restriction remains on `ref`, which makes sense: shared mutable state must be type-exact.

---

Does this analysis match your intuition? The copy-on-write mechanism really does give you a "free" type widening opportunity.

> [!note]
> There is no need for a type argument when calling the constructor:
> ```clawr
> mut c: Container<Dog> = Container.new(fido)
> // or
> mut c = Container.new(fido) // Container<Dog> is implied as fido is a Dog
> ```
