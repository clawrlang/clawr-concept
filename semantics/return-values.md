# Variable Semantics for Function Return Values

Functions can return memory they just allocated, memory that they receive from somewhere else, or memory stored as a field. That memory could have `ISOLATED` or `SHARED` semantics. But functions should be reusable whether the caller assigns the result to a `const` or a `ref` variable. To resolve this, Clawr uses *uniquely referenced values* where possible.

## Uniquely Referenced Values

Functions return “uniquely referenced” values by default. A uniquely referenced value is an `ISOLATED` memory block that has a reference count of exactly one. It is assumed that the value will be assigned to a variable, which is is already counted. If it is not, it must be released (and deallocated) by the caller.

A uniquely referenced value can be reassigned new semantics. If the caller assigns the value to a `const` or `mut` variable, the memory is awarded `ISOLATED` semantics. If it is assigned to a `ref` variable, it is given `SHARED` semantics. Once the value has been assigned, the semantics is locked until it is deallocated (unless it is returned again as a uniquely referenced value).

Uniquely referenced values will always be `ISOLATED`. This is a consequence of the fact that `SHARED` values will always have multiple references. If, for example, you return the value of a `ref` field, that field will hold one reference, and for the caller to be able to hold a reference, the count must be at least two.

## Uniquely Referenced Return Values are *Moved*

Reference-counted values will be deallocated as soon as the counter reaches zero. Therefore, it is impossible for the called function to count down *all* its references and then return the value. It must leave a reference count of one (even though it technically holds zero references). That means that the caller must adjust *its* behaviour accordingly. It just takes over the reference without counting up. If it does not store the value (for example if it just passes it to another function, or uses it for computation etc) it must call `releaseRC()` so that the memory does not leak.

When a function returns an `ISOLATED` value, that memory is “moved.” That means that if the function does `return x` it will not call `releaseRC(x)` (but it will call `releaseRC()` for all other variables in its scope). The receiving variable will not call `retainRC()` on the returned value, but will just take over the reference from the called function.

In other words, returned values must have a reference count of exactly one. We call this a “unique reference.” If it is unclear at compile-time, whether the memory could have multiple references, the compiler could inject a `mutateRC()` call. This function creates a copy of the memory if it has a high reference count, and always returns a memory block with a reference count of one.

Alternatively, we could make the return type `const Value`, meaning that the value har explicit `ISOLATED` semantics and can only be assigned to a `const` or `mut` variable.

## Semantics Rules

1. `ISOLATED` memory may not be assigned to `ref` variables. Explicit `copy()` is required.
2. `SHARED` memory may not be assigned to `const` / `mut` variables. Explicit `copy()` is required.
3. `SHARED` memory returned from a function modifies its return type, `-> ref Value`.
4. `ISOLATED` memory (returned from a function) can be reassigned `SHARED` if `refs == 1`.
5. `ISOLATED` memory with a (possible) high ref count makes the return type `const Value`.
6. If a function cannot prove that the value is always uniquely referenced, it must announce that its semantics are fixed.
7. The compile could inject `mutateRC(returnValue)` to ensure that it is uniquely referenced. Thought this might mean unnecessary copying.

```clawr
func returnsRef() -> ref Student // SHARED memory
func returnsCOW() -> const Student // ISOLATED memory with multiple refs
func returnsUnique() -> Student  // uniquely referenced, reassignable
```

## Constructors

Clawr does not have constructors like other OO languages, but does have `data` literals and factory functions.

A factory is just a free function (probably in a namespace with the same name as the type) that creates an `ISOLATED`, uniquely referenced, memory block. This is then assigned as needed to a `ref`, `mut` or `const` variable according to the rules above.
