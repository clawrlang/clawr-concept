# Function Parameter Semantics

## Parameter Semantics Rules

Note: `mut` does not mean move ownership as `&mut` in Rust. Instead it means that value semantics (copy-on-write) applies to the variable.

Parameters have one extra semantics mode that ordinary variables cannot use:

- (default): Read-only access
    - Accepts: any variables regardless semantics
    - No copy created
    - Cannot be modified by the function
    - Could be modified by other thread if parallel execution is enabled
- **`let`**: Immutable isolated access
    - Semantically similar to the default, but cannot be affected by parallel mutation
    - Accepts: `let` or `mut` variables (and unassigned return values) but not `ref`
    - No copy created
    - Cannot be modified by the function
    - Value is immutable within function scope
- **`mut`**: Mutable isolated access
	- Semantically equivalent to `let`, but allows mutation in the function body
    - Accepts: `let` or `mut` variables (and unassigned return values) but not `ref`
    - Copies if mutating and high ref-count (CoW)
    - Reference count incremented on call
    - Value is mutable within function scope
    - Changes not visible to caller (isolated)
- **`ref`**: Shared mutable access
    - Accepts: `ref` variables only
    - Shares reference (increments refs)
    - Value is mutable within function scope
    - Modifications visible to all references (shared)

### Tension

Not sure if the signature should only allow `let` and not `mut`. Maybe the developer should be allowed to shadow the variable instead:

```clawr
func foo(label varName: let Type) {
  mut varName = varName // Makes varName mutable but does not increment refcount
  // Now varName can be mutated
  varName.modify()
}
```

Or maybe `let` and `mut` are interchangeable?

```clawr
trait SomeTrait {
  func foo(label varName: let Type)
}

object SomeObject: SomeTrait {
  // This works as implementation of the trait requirement
  func foo(label varName: mut Type) {
    varName.modify()
    // ...
  }
}

object IncorrectObject: SomeTrait {
  // This does not match the trait requirement (wrong semantics)
  func foo(label varName: ref Type) {
    varName.modify()
    // ...
  }
}
```

## Examples

### Example 1: `mut` parameter with COW

```clawr
func transform(value: mut Data) -> let Data {
  value.modify()  // Triggers COW if refs > 1
  return value
}

mut original = Data.new()
let result = transform(original)
// original unchanged (was copied on write inside transform)
// result contains the modified version
```

**What happens:**

1. `original` created from factory (`refs` = 1)
2. `original` passed to function and assigned to `value` (`refs` = 2)
3. `value.modify()` triggers COW (`refs` > 1, so copy happens)
4. `original.refs` is decremented to 1, `value` is pointed to new memory with `refs` = 1
5. `result` is assigned the modified copy (moved—`refs` stays as 1)
6. `original` is unchanged

### Example 2: `mut` parameter without copy

```clawr
func transform(value: mut Data) -> let Data {
  value.modify()  // Triggers COW if refs > 1
  return value
}

let result = transform(Data.new())
// No copy needed - Data.new() was unique (refs == 1)
```

**What happens:**

1. `Data.new()` creates unique value (`refs` = 1)
2. Passed to function (moved—`refs` stays 1)
3. `value.modify()` works directly on the value (refs == 1, no copy)
4. Returns the modified value
5. Efficient - zero copies

### Example 3: `let` parameter

```clawr
func analyze(data: let Data) -> Report {
  // Cannot modify data
  return Report.from(data)
}

mut myData = Data.new()
let report = analyze(myData)
// myData still accessible and unchanged
```

**What happens:**

1. `myData` created from factory (`refs` = 1)
2. `myData` passed to function (`refs` stays 1 as COW cannot occur)
3. Function has immutable view (compiler prevents modification)
4. No copy occurs (just reference sharing)

### Example 4: `in` parameter (default)

```clawr
func size(data: Data) -> Int {  // Implicit: data: in Data
  return data.count()
}

mut data1 = Data.new()
ref data2 = Data.new()
let data3 = Data.new()

size(data1)  // OK
size(data2)  // OK
size(data3)  // OK
// All share reference temporarily, no copies
```

**What happens:**

1. All variables created with `refs` = 1
2. Passed to function (`refs` stays 1 as COW cannot occur)
3. Function has immutable view (compiler prevents modification)
4. No copy occurs (just reference sharing)

## The Key Insight: COW Handles Everything

**Copy-on-write makes all of this work seamlessly**:

1. Parameters increment reference counts (cheap)
2. Read-only operations never trigger copies
3. Mutations trigger COW only when `refs` > 1
4. `mut` and `let` differ only in compile-time mutation permission
5. `ref` is the only one with shared mutation semantics

## Return Type Interaction

```clawr
func process(data: mut Data) -> let Data {
  data.modify()
  return data  // Returns ISOLATED (cannot prove unique)
}

func create() -> Data {
  return Data.new()  // Returns unique
}

// Usage:
ref r1 = create()      // OK: unique can become SHARED
ref r2 = process(...)  // Error: ISOLATED needs copy

mut m1 = create()      // OK: unique can become ISOLATED  
mut m2 = process(...)  // OK: ISOLATED → ISOLATED
```

## Complete Syntax Proposal

```clawr
func example(
    param1: Data,              // Implicit: in Data (read-only, any variable)
    param2: in Data,           // Explicit: read-only, any variable
    param3: let Data,          // Immutable isolated (let/mut variables)
    param4: mut Data,          // Mutable isolated (let/mut variables, COW)
    param5: ref Data           // Shared mutable (ref variables only)
) -> let Result {              // Returns ISOLATED
  // Function body
}

func factory() -> Widget {     // Returns unique (refs == 1 proven)
  return Widget.new()
}

func getter(obj: ref Container) -> ref Widget {  // Returns SHARED
  return obj.widget
}
```

> [!neutral]
> Testing

