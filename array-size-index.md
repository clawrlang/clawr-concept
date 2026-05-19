# Array Indexing Semantics (Draft)

1. Index type:
	- The index expression in a[i] must have type integer.
	- No fixed bit-width is part of the language definition.

2. Valid index domain:
	- Let n be the evaluated index value.
	- Let len be the array length.
	- Access is valid iff 0 <= n < len.

3. Failure behavior:
	- If n < 0, runtime trap: negative index.
	- If n >= len, runtime trap: index out of bounds.
	- If n cannot be represented in the backend’s native index/address domain during lowering/runtime conversion, runtime trap: index not representable.

4. Portability rule:
	- The language does not define a global maximum index constant (such as `INT64_MAX`/`UINT64_MAX`).
	- Maximum usable index is implementation-defined by backend/runtime capabilities (address space, allocation limits, internal index representation), but failures must be checked and deterministic.

5. Compile-time diagnostics:
	- If the index is a constant integer literal and is negative, compilers should reject at compile time.
	- If the index is a constant and array length is statically known, compilers may optionally diagnose out-of-bounds at compile time.
	- Otherwise checks are runtime.

6. Assignment/read symmetry:
	- The same index validity rules apply to both read `a[i]` and write `a[i] = v`.

**Runtime Contract (Draft)**
1. `checked_index_convert(Integer*) -> NativeIndex`:
	- Converts language integer to native index type.
	- Fails on negative or overflow/non-representable value.

2. `checked_bounds(index, len)`:
	- Fails unless index < len.

3. `checked_byte_size(len, elem_size)`:
	- Computes allocation/access sizes with overflow checks.
	- Fails if total size cannot be represented.

4. Access sequence:
	- index = checked_index_convert(i)
	- checked_bounds(index, array.count)
	- perform access

**Why this is the right model**
1. Keeps Clawr architecture-neutral.
2. Allows mathematically large integers at language level.
3. Still provides safe, deterministic behavior on every backend.
4. Avoids silently truncating indices, which causes portability bugs.
