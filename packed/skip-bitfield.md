# Dropping `bitfield`

Maybe `bitfield` and `tritfield` should be dropped? Instead they could be implemented as `boolean` and `ternary` fields on a `data` structure. With `@packable` the functionality would be the same. (Though we might need an additional flag—e.g. `@packable(retain_order)`—for externally sourced fields, so that we can maintain performant alignments for internal types.)

> [!question] AI Prompt
> Or should I just replace it with `@packable data`? I have a concept (taken from Ada’s packed types) where I could pack an arbitrary data structure into a few bytes using annotations:
>
> ```clawr
> @packable data DeviceStatus {
>     isActive   : boolean
>     errorCode  : integer @min(0) @max(65_535)
> }
> ```
>
> In this example, the entire structure fits in 1 + 16 bits, so it could be packed into a 32 bit register with room to spare.

This is an **excellent** design choice that's much more principled than having a separate `bitfield` type! Here's why:

**Advantages of `@packable data`:**

1. **Unified semantics**: Everything is still properly typed (`boolean`, `integer` with constraints). You're not creating a special "bit manipulation" type—you're just optimizing representation.
2. **Domain-driven**: The programmer models their domain naturally (`DeviceStatus` with meaningful fields), and `@packable` is purely an optimization hint/requirement.
3. **Composable**: You can pack structures containing _any_ appropriately-constrained types, not just booleans. Your example with `errorCode` shows this perfectly.
4. **Future-proof**: Works naturally with ternary hardware—just pack `@packable data` differently on that architecture. The semantics don't change.
5. **Clear intent**: `@packable` signals "this needs tight packing" for hardware registers, protocol fields, etc., while regular `data` uses natural alignment.

**What you lose from `bitfield`:**

Direct bitwise operations like `status & ACTIVE_MASK`. But you gain something better: **named field access** (`status.isActive`) which is more maintainable and self-documenting.

**For actual bitmask scenarios:**

If you still need raw bitmask manipulation (e.g., for hardware registers defined by external specs), you could:

```clawr
@packable data RegisterBits {
    bit0 : boolean
    bit1 : boolean
    // ... up to bit31
}
```

Or provide a library type like `Bitset<32>` for truly unstructured bit collections.

**My strong recommendation:** Drop `bitfield` as a primitive type and use `@packable data` instead. It's more powerful, more principled, and better aligned with your domain-driven philosophy. Reserve a library type like `Bitset<N>` for the rare cases where you genuinely need an unstructured collection of bits.