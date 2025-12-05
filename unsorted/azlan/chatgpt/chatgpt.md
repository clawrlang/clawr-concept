Rules:

- `let`: Conception: a variable that can never be mutated. Implementation: a block of memory that is tagged with a copy-on-write flag so that when assigned to a mutable variable (that is later modified) the data is copied and the new variable altered to reference the copy.
- `mut`: Conception: a variable that can be mutated, but only by direct reference. It can never be mutated by changing another variable. Implementation: similar to `let`. Though either the original variable *or* the new variable might be changed. The changed variable always references the copy after mutation.
- `ref`: Conception: a variable without guarantees. The shared data might be passed to code that is far removed from the variable itself. And it might be mutated in surprising ways. Implementation: A block of memory with the copy-on-write flag unset, which prevents copying.

Assignment Rules:

1. `let` → `mut`:

   - Does not trigger an immediate copy.
   - If the `mut` variable is later modified, a deep copy is performed (Copy-On-Write).

2. `mut` → `mut` :

   - Does not trigger an immediate copy.
   - Same behavior as `let` → `mut`; changes to either `mut` variable trigger a deep copy of the shared data.

3. `mut` ↔ `ref`:

   - Assigning a `mut` to a `ref` triggers an **immediate deep copy**.
   - Similarly, assigning a `ref` to a `mut` also triggers an **immediate deep copy**.
   - This ensures that the `ref` variable retains the shared, mutable semantics, while the `mut` variable adheres to value semantics.

4. `ref` → `ref`:

   - No copy is performed.
   - Both variables share the same memory, and changes to one affect the other.

Memory Layout:

Each memory block contains:

1. Reference Count (`ref_count` )
   - `true`: Block is copyable (used for `let` and `mut`).
   - `false`: Block is not copyable (used for `ref`).
2. **Actual Data**: The payload held by the memory block.

Struct:

- Represents data-only types, with no instance methods or behavior. Static methods and operators are allowed.
- Used for DTOs, data analysis, or other lightweight purposes.
- Supports polymorphism through traits.
- Example:
  ```azlan
  struct Point {
      mut x: Int
      mut y: Int

      static func origin(): Point {
          return Point(x: 0, y: 0)
      }

      static func +(lhs: Point, rhs: Point): Point {
          return Point(x: lhs.x + rhs.x, y: lhs.y + rhs.y)
      }
  }
  ```

Object:

- Represents behavior-oriented types with strict encapsulation. Supports instance methods, inheritance, and polymorphism.
- Example:
  ```azlan
  object Counter {
      private mut count: Int = 0

      public func increment() {
          count += 1
      }

      public func value(): Int {
          return count
      }
  }
  ```

Implementation of `mut` Objects with Inheritance:

- Inheritance can be employed for `mut` objects by utilizing Copy-On-Write (COW) semantics.
- **COW for Inheritance**:
  - When assigning or copying a `mut` object, no copy occurs immediately.
  - Upon mutation, the entire object hierarchy (base and derived fields) is duplicated.

Example:

```azlan
object Base {
    mut baseValue: Int

    func baseMethod() {
        print("Base method")
    }
}

object Derived: Base {
    mut derivedValue: Int

    func derivedMethod() {
        print("Derived method")
    }
}

mut obj1: Derived = Derived(baseValue: 10, derivedValue: 20)
mut obj2: Derived = obj1  // COW: No copy yet

obj2.derivedValue = 30  // Triggers deep copy
```

Runtime Implementation:

1. **COW Mechanism**:

   - Reference counting is maintained for the entire inheritance hierarchy.
   - Mutating a `mut` object triggers a deep copy of all fields, including those inherited.

2. **VTable for Dynamic Dispatch**:

   - The vtable (virtual method table) is copied alongside the object during COW.
   - Polymorphic behavior remains unaffected, as each copy of the object retains its own vtable pointer.

Edge Cases:

- **Complex Hierarchies**:
  - Deep copying ensures that even multi-level hierarchies maintain value semantics.

Pseudocode for COW with Inheritance:

```plaintext
function mutateObject(mut obj):
    if obj.memory.ref_count > 1:
        // Shared memory, trigger COW
        new_memory = deep_copy(obj.memory)
        decrement_ref_count(obj.memory)
        obj.memory = new_memory
    // Proceed with mutation
    perform_mutation(obj.memory)
```

Pure Functions:

- The `pure` keyword identifies functions with no side effects and consistent outputs for the same inputs.
- Pure functions enable significant optimizations even with encapsulation:
  1. **Memoization**: Cache results for specific inputs.
  2. **Function Call Elision**: Inline or eliminate redundant calls.
  3. **Parallel Execution**: Evaluate calls independently.
  4. **Dead Code Elimination**: Remove unused pure function calls.

Example:
```azlan
object Math {
    pure func square(x: Int): Int {
        return x * x
    }

    pure func sum(a: Int, b: Int): Int {
        return a + b
    }
}

object Statistics {
    private let dataset: List<Int>

    init(data: List<Int>) {
        self.dataset = data
    }

    pure func average(): Float {
        return dataset.reduce(0, +) / dataset.size
    }

    pure func variance(): Float {
        let mean = self.average()
        return dataset.map(x -> (x - mean) * (x - mean)).reduce(0, +) / dataset.size
    }
}
```
