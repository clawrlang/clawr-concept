# Implementation Details

Swift allocates some memory on the stack (or inline in a parent structure) and some memory on the heap. This is true for all types, even `struct` types. Only if the structure is exceptionally small (at the most a handful of integers) can the entire structure fit on the stack/parent structure. The rest is allocated on the heap. This might be a strategy worth replicating for Azlan.

The simplest of values (such as `real` and `integer`) will not need any extra information beyond the value-bits themselves. For larger structures, a small structure (perhaps 32 or 64 bytes, enough for 4 or 8 64-bit registers) will be allocated on the stack. This structure will contain a pointer to the heap, where the actual data structure resides. I'm unsure what data Swift places in this location (or what size it is); some research might be called for here.

Apart from the programmer-defined structure, the heap allocated memory will contain a reference counter and an `is_a` pointer. We will also need room to select between copy and reference (ref) semantics (but that might steal a bit or two from the reference counter; nine pentillion referents will probably never be required).

## Variables and Copying

When a `semantics:ref` structure is assigned to a `ref` variable, nothing is done other than incrementing the reference counter. The two variables will share the same memory block until one is reassigned or goes out of scope. When a variable exits scope or is reassigned to a new block of memory, the reference counter is decremented by one. If the counter then becomes zero, the structure has no more referents and the memory can be freed/deallocated.

This is similar to how classes work in C# and Java. The way that they differ is that they do not perform reference counting. C# and Java periodically run a garbage collector to find and deallocate structures that are no longer needed. Azlan deallocates memory immediately when the last reference is removed.

When a `semantics:copy` structure is assigned to a `mut` or `let` variable, the memory block can be shared initially similar to `semantics:ref` structures. The reference counter alsso works similarly. If, however, one of the referencing variables modifies its data, a copy of the memory block is created and assigned to that variable. The copy will get a reference count of one (as it is only referenced by the changing variable). The reference count of the original memory block will be decremented by one to indicate that the changing variable no longer references it.

> If, on the other hand, the reference counter is one (1) when modifying, only the modified variable refers to the memory structure. and the runtime will know not to make a copy.

When a `semantics:copy` structure is assigned to a `ref` variable, or a `semantics:ref` structure to a `mut` variable, a copy is made immediately. The two variables have different semantics and cannot be allowed to share the same memory block. The memory block also cannot have two distinct values for the same flag.

This is probably not a thing that happens often. It should be discouraged in the documentation/training material. Hence, the performance hit from copying should remain small.

## Sample Code

```azlan
struct Point { x: real, y: real }
let p: Point = { x: 12, y: 3 }

```

Results in:

```azlan IR-pseudo
p = {
  is_a: &type_Point, // reference to the type information
  semantics: copy,   // copy semantics because of the `let` variable declaration (first bit of refs)
  refs: 1,           // reference count of 1 because it was just created to initialize the p variable
                     // smantics+refs are combined into 0x8000_0000_0000_0001, (bit 63 is the semantics bit)

  x: 12, // the declared data
  y: 3
}

// ...where the type_Point object has a structure (vtable?) akin to this:
let type_Point: type = {
  size: 32,          // Size of the structure in bytes (8 bytes each for x, y and is_a plus another 8 bytes for semantics+refs)
  alignment: 8,      // Alignment requirement - address must be a multiple of 8
  // Mapping of property names to types and to addresses/initializer of the struct
  properties: [
    "x": (&type_real, offset: ),
    "y": (&type_real, &self.y),
  ],
  traits: [
    "CustomCodable": [
      // named (or addressable) methods
    ]
  ]
}

let type_real: type = {
  // information or methods that indicates/perform direct conversion
  size: 8,        // Size of the structure in bytes
  alignment: 8,   // Alignment requirement - address must be a multiple of 8
  properties: [], // empty because the type is non-composite
                  // or maybe built-ins do not even need a structure in memory?
}
```

## Optimisations

- If the variable is known to never be assigned anywhere (“escape analysis”)
  - The reference counter might be ignored or perhaps even not allocated room for.
  - The entire structure might be stack-allocated instead of on the heap.
- If the structure is complex, nested parts that are not assigned to other variables might be inlined (instead of creating nested heap-allocated structures).

## Inheritance
