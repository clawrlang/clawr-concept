# Constrained `integer`

An `integer` is a member of $\mathbb{Z}$. It can be arbitrarily big (either positively or negatively) as long as the hardware and OS supply enough memory to hold it (and there is enough time to compute and assign it).

A value can be known exactly (`integer @value(5)`) and so can a constant (immutable variable) that is assigned that value.

A mutable variable can be reassigned, so it cannot hold a constrained type implicitly. It will have to allow any `integer` value unless explicitly limited.

A type is a sacred promise. If a variable has an explicit limit, it must always contain a value within the range. It can never be allowed to exceed it. When it is assigned a new value, the compiler might be able to prove that the value is within the range. If such proof is not possible, the compiler will have to inject runtime checks. If the value is not acceptable, the process must end processing and `panic`, similar to `fatalError()` in Swift or `exit(EXIT_FAILURE)` in C. (I suppose `panic()` is the form for Python, because the AIs keep referring to it.)

## Optimisation Through Type Constraints

A variable that is constrained to a small range can be stored in a small number ot bits (or trits in ternary). This can be used to optimise storage and computations.

```clawr
mut x: integer @range(0..100) // fits in 7 bits or 5 trits
mut y = x // unconstrained integer
const A = 5 // implicit integer @value(5) - ultimately constrained
```

The compiler should choose the smallest representation possible to fit each variable. If no constraint is specified (or inferred), the compiler has no choice but use the arbitrarily sized “big integer” type, but with a known constraint, it can store values more compactly.

It is even possible to [pack](./ada-implementations.md) multiple small values into a single register! This can be valuable for tiny electronic devices.

## Machine-code Implementation

My implementation generates C code before compiling to machine code, so I will refer to C types here, but a different (future) implementation might use LLVM or a custom IR—or even generate machine code immediately! I'll try not to judge.

> [!note]
> I assume that the compiler will know the specifics of its target architecture.
>
> And I also assume that arithmetics will always be performed on a dedicated register in the processor even if the values fit a smaller size.

The compiler can assign `int27` (ternary), `uint32_t` or `int64_t` etc (or whatever the register size is on the target processor) at runtime for all `integer` operations that can be proven small enough to fit.

The compiler can probably detect risky situations and (temporarily) use bigger widths (such as two or four registers, or—in the worst case—even arbitrary width integers) to support intermediate values that do not fit in a single register.

If a (mutable) variable is not explicitly constrained, it cannot be optimised and will always have to use a “big-integer” implementation for its own storage–and hence also for computations—even if the values are in fact always small. What cannot be proven cannot be optimised for.

---

> [!question] AI Prompt
> I prefer proof that values fit, not assertions.
>
> I want the code to work seamlessly with ternary hardware. Hence “64 bit register” is not a concept in Clawr. It can be a concept in an IR language (that can be specific/adapted to the compiler's target architecture), but in the code (and probably also in the AST) there should be no mention of width in bits (unless the type is a `bitfield` where each bit—or trit—counts as a separate Boolean value).

You're absolutely right. If Clawr is designed for ternary or arbitrary hardware, bit widths should be entirely derived from constraints, not specified. This aligns perfectly with your "types as constraints" philosophy.

## True Constraint-Driven Layout

```clawr
# The programmer specifies constraints, not bit widths
var x: integer @range(0, 100)   # Compiler chooses minimal representation
var y: integer @range(-50, 50)  # Signed representation needed
var z: integer @value(42)       # Could be compile-time constant

# No `u8`, `i32`, etc. in the language
# Layout is ALWAYS inferred from constraints
```

## Proofs, Not Assertions

You're correct to reject "I know this fits" assertions. Instead:

```clawr
# Bad: Assertion (what you reject)
var x: integer @range(0, 10) = 5
x = x +! 6  # "Trust me" - unsafe

# Good: Proof via control flow
var x: integer @range(0, 10) = get_input()
if x <= 4 {  # This proves x ∈ [0, 4] in this branch
    x = x + 6  # Result ∈ [6, 10] ⊆ [0, 10] ✓
} else {
    # Can't add 6 here - would overflow
    x = x - 1  # Still in bounds (==actually could be -1==)
}

# Better: Mathematical proof
var x: integer @range(0, 100) = get_input()
x = (x * 2) % 101  # Always in [0, 100] by modulo property
```

## Ternary Hardware Considerations

For ternary computers (base-3), the math changes:

```clawr
# On binary: range 0-7 fits in 3 bits (2³ = 8 values)
# On ternary: range 0-8 fits in 2 trits (3² = 9 values)

var small: integer @range(0, 8)  # 2 trits on ternary
var medium: integer @range(0, 26)  # 3 trits on ternary (3³ = 27)

# The compiler's layout algorithm:
# 1. Calculate minimum values needed: max - min + 1
# 2. Convert to minimal trits: ceil(log₃(values))
# 3. Choose balanced/unbalanced representation
```

## Implementation Strategy

### 1. **Abstract Machine Model**
```clawr
# Target-independent representation
enum IntegerRep {
    Unsigned { min: BigInt, max: BigInt },
    Signed { min: BigInt, max: BigInt },
    Modulo { modulus: BigInt },  # For cyclic types
    Fixed { value: BigInt },     # Compile-time constant
}

# Operations defined mathematically
trait IntegerMath {
    fn add(a: IntegerRep, b: IntegerRep) -> IntegerRep {
        // Returns new range: [a.min + b.min, a.max + b.max]
    }
    fn multiply(a: IntegerRep, b: IntegerRep) -> IntegerRep {
        // Returns range covering all possible products
    }
}
```

### 2. **Compilation Pipeline**
```
Source → AST → Constraint Analysis → IR → Target Code

Constraint Analysis Phase:
1. Propagate range constraints through expressions
2. Prove operations safe where possible
3. Insert runtime checks where needed
4. Choose optimal representation for target
```

### 3. **Target-Specific Backends**
```rust
// Abstract interface for any hardware
trait HardwareBackend {
    fn optimal_width(&self, range: Range) -> Representation;
    fn generate_add(&self, a: Rep, b: Rep) -> Code;
    fn generate_mul(&self, a: Rep, b: Rep) -> Code;
}

// Binary backend
struct BinaryBackend {
    word_size: usize,  // e.g., 32, 64
    supports_bigint: bool,
}

// Ternary backend  
struct TernaryBackend {
    tryte_size: usize,  // e.g., 6 trits = 729 values
}
```

## Range Analysis and Proofs

The key is the constraint solver/range analyzer:

```clawr
# Example: The compiler proves this safe
var x: integer @range(0, 100) = get_input()
var y = x * 2

# Range analysis:
# x ∈ [0, 100]
# y = x * 2 ⇒ y ∈ [0, 200]
# But assignment to x requires [0, 100]

# So this would need a check or proof:
x = y  # Needs: [0, 200] ⊆ [0, 100]? No → error

# But with a proof:
if y <= 100 {  # This proves y ∈ [0, 100] in this branch
    x = y  # Safe, no check needed
}
```

## Modular Arithmetic as Proof

Your modulo example becomes elegant:

```clawr
var x: integer @range(0, 11) = get_input()
x = (x + 54) % 12

# Proof:
# 1. x ∈ [0, 11]
# 2. (x + 54) % 12 ≡ (x + 6) % 12 (since 54 ≡ 6 mod 12)
# 3. x + 6 ∈ [6, 17]
# 4. (x + 6) % 12 ∈ [0, 11]
# 5. Matches x's constraint → no runtime check

# Generated code (ternary):
# Use 2-trit arithmetic throughout
```

## Handling Large Intermediate Values

For expressions that could produce huge values:

```clawr
var x: integer @range(0, 100) = 50
var temp = x ^ 100  # 50¹⁰⁰ is astronomical

# Options:
# 1. Compile-time warning: "Intermediate value may be huge"
# 2. Use mathematical reasoning: If result is reduced modulo something
# 3. Allow but optimize common cases

# Practical approach:
# - Most real code doesn't need huge numbers
# - When it does, use modular reduction early
x = (x ^ 100) % 101  # Stays small due to modulo
```

## A Complete Example

```clawr
// Game: Player position on 20×20 grid
var pos_x: integer @range(0, 19) = 10
var pos_y: integer @range(0, 19) = 5

// Move with wrap-around
fn move(dx: integer @range(-1, 1), dy: integer @range(-1, 1)) {
    // Mathematical proof that result stays in bounds:
    pos_x = (pos_x + dx + 20) % 20  // Always in [0, 19]
    pos_y = (pos_y + dy + 20) % 20  // Always in [0, 19]
    
    // Compiler can use 5-trit arithmetic (3⁵ = 243 > 20)
    // Or on binary: 5 bits (32 > 20)
}

// Safe increment with bounds
fn safe_increment() {
    if pos_x < 19 {
        pos_x = pos_x + 1  // Proof: pos_x ≤ 18 ⇒ pos_x+1 ≤ 19
    }
    // else stay at 19
}
```

## The Compiler's Job

The compiler becomes a **constraint solver**:

1. **Parse constraints**: `@range(0, 100)`, `@value(42)`, `@mod(12)`
2. **Propagate through expressions**: Track range of every subexpression
3. **Prove safety**: Can assignment E ⊆ V? (E in expression range, V in variable range)
4. **Choose representation**: Minimal bits/trits for the range
5. **Generate checks**: Only where proofs fail
6. **Optimize**: Remove redundant operations, use modular arithmetic

## The Big Picture

You're designing a language where:
- **Types are mathematical sets** (not memory layouts)
- **Operations are mathematical** (not machine instructions)  
- **Layout is inferred** (not specified)
- **Proofs replace assertions** (not "trust me")

This is beautifully consistent and could work exceptionally well for:
- **Formal verification** (constraints are explicit)
- **Hardware portability** (no bit-width assumptions)
- **Optimization** (constraints enable aggressive transformations)
- **Safety** (runtime checks where proofs fail)

The challenge is implementing the constraint solver and range analysis, but the semantics are clean and compelling. This could be a truly novel approach to systems programming.

> [!question] AI Prompt
I assume that the compiler knows the specifics of its target architecture. And I also assume that arithmetics will always be performed on a dedicated register even if the values fit a smaller size. (Is that how it usually works?)
>
> Then the compiler can assign integer27, integer32 or integer64 etc (or whatever a register size is) to all integers that are proven small enough to fit. There will be very little risk of overflow if the type is @range(0, 100), and the compiler can probably detect risky situations and (temporarily) use bigger widths to support intermediate values.

You've hit on a key practical insight. Let's explore this pragmatic approach.

## The Register-Based Reality

Yes, in most architectures (including ternary), arithmetic happens in registers of fixed size:

```clawr
# Source level: Only constraints
var x: integer @range(0, 100) = 50
var y = x * 2 + 10

# Compiler's internal reasoning:
# 1. x ∈ [0, 100] → fits in 7 bits (binary) or 5 trits (ternary)
# 2. But target has 32-bit registers (or 6-tryte registers)
# 3. Use full register size for arithmetic
# 4. Only truncate when storing to memory
```

## A Practical Compilation Strategy

### 1. **Two-Level Representation**
```clawr
# In the compiler's mind:

# Source Type (constraint-only)
type SrcInt = {
    min: BigInt,
    max: BigInt,
    // No mention of bits/trits
}

# Target Representation (architecture-specific)
enum TargetInt {
    RegisterSize,  // e.g., i32, tryte6
    BigInt,        // When register isn't enough
    Const(Value),  // Compile-time known
}
```

### 2. **Default to Register Arithmetic**
```clawr
# Simple case: Everything fits in registers
var a: integer @range(0, 100) = get_input()
var b: integer @range(0, 100) = get_input()
var c = a * b  # Max 10,000, fits easily in 32-bit

# Compiler: "Both fit in register, multiply in registers"
# Generated code (binary):
#   load a into r1  (as i32)
#   load b into r2  (as i32)
#   mul r1, r2 → r3 (i32 multiplication)
#   store r3 to c
```

### 3. **Temporary Upsizing for Safety**
```clawr
# Risky case: Multiplication might overflow register
var x: integer @range(0, 100_000) = get_input()
var y: integer @range(0, 100_000) = get_input()
var z = x * y  # Could be up to 10,000,000,000

# On 32-bit: Max 4,294,967,295, so 10B overflows!
# Compiler's options:
# 1. Use 64-bit arithmetic for this expression
# 2. Insert overflow check
# 3. Use big integer library

# Smart compiler analysis:
# - If both in [0, 100k], product ≤ 10B
# - 10B < 2⁶⁴ (18,446,744,073,709,551,616) ✓
# - Use 64-bit multiplication
```

### 4. **Architecture-Specific Decisions**
```clawr
# The same source on different targets:

# Source:
var x: integer @range(0, 1000) = get_a()
var y: integer @range(0, 1000) = get_b()
var z = x * y  # Max 1,000,000

# On 32-bit binary:
# - 1M < 2³² (4.29B) ✓
# - Use 32-bit registers

# On 6-trit ternary (max 729 values):
# - 1M > 729 ✗
# - Need multiple trytes or big integer
# - Or compiler error: "Value too large for target"
```

## The Compilation Pipeline

Here's how it might work:

```rust
// Compiler phases
struct Compiler {
    // Phase 1: Constraint collection
    fn collect_constraints(ast: &AST) -> ConstraintMap;
    
    // Phase 2: Range analysis  
    fn analyze_ranges(constraints: &ConstraintMap) -> RangeMap;
    
    // Phase 3: Target representation selection
    fn select_representations(ranges: &RangeMap, target: &Target) -> RepMap;
    
    // Phase 4: Code generation
    fn generate_code(reps: &RepMap) -> MachineCode;
}
```

### Example: Multiplication Analysis
```clawr
// Source
var a: integer @range(0, 100) = ...
var b: integer @range(0, 100) = ...
var c = a * b

// Analysis
a_range = [0, 100]
b_range = [0, 100] 
c_possible = [0, 10000]  // Worst case

// On 32-bit target:
max_32bit = 2³² - 1 = 4,294,967,295
10000 ≤ 4.29B ✓ → Use 32-bit multiplication

// On 6-trit ternary:
max_6trit = 3⁶ - 1 = 728
10000 > 728 ✗ → Need special handling
```

## Practical Checks and Errors

```clawr
# Compile-time overflow detection
var x: integer @range(0, 1_000_000_000) = get_input()
var y: integer @range(0, 1_000_000_000) = get_input()

# On 32-bit:
var z = x * y  # Compiler error: "Multiplication may overflow 32-bit"
               # Max possible: 1,000,000,000,000,000 > 4,294,967,295

# Solutions:
# 1. Use 64-bit (if target supports)
if target.has_64bit {
    # Compiler uses 64-bit for this expression
}

# 2. Add explicit modulo
var z = (x * y) % 1_000_000_001  # Now fits in 32-bit

# 3. Use saturating multiplication
var z = x *| y  // Saturate at max value

# 4. Use checked multiplication (runtime panic)
var z = x * y  // With overflow check inserted
```

## Ternary-Specific Considerations

For ternary hardware, the math is different:

```clawr
# Ternary register sizes might be:
# - Tryte (6 trits): 0 to 728 (3⁶ - 1)
# - 2-tryte: 0 to 531,440 (3¹² - 1)
# - etc.

var x: integer @range(0, 500) = get_input()
var y = x * 2  # Max 1000

# On 6-trit hardware: 1000 > 728 → overflow risk
# Options:
# 1. Use 2-tryte arithmetic (if available)
# 2. Insert overflow check
# 3. Compiler proves it won't overflow based on actual values
if x <= 364 {  # 364*2 = 728
    y = x * 2  # Safe in single tryte
}
```

## The "Big Enough Register" Assumption

Your insight is correct: **Most practical integer ranges fit in standard register sizes.**

```clawr
# Common patterns and their register needs:

# Counters, small indices
var i: integer @range(0, 100)        # 7 bits / 5 trits → fits register

# Array sizes (up to 4GB)
var len: integer @range(0, 1_000_000_000)  # 30 bits → fits 32-bit

# Money in cents ($0 to $1M)
var cents: integer @range(0, 100_000_000)  # 27 bits → fits 32-bit

# Timestamps (seconds since 1970)
var ts: integer @range(0, 4_000_000_000)   # 32 bits → needs 64-bit for math
```

## The Compiler's Safety Net

The compiler can be conservative but smart:

```clawr
# Conservative default
fn compile_expression(expr: Expr, expected_range: Range) -> Code {
    // 1. Calculate worst-case range for expr
    const expr_range = analyze_range(expr);
    
    // 2. Check if fits in target's register
    if expr_range.fits_in_register(target) {
        // Use register arithmetic
        generate_register_code(expr);
    } else if can_prove_smaller(expr, context) {
        // Actually smaller than worst case
        generate_optimized_code(expr);
    } else {
        // Need bigger representation or checks
        if target.has_larger_registers() {
            generate_large_register_code(expr);
        } else {
            insert_overflow_check(expr);
        }
    }
}
```

## Recommendations

1. **Start with register-only arithmetic** for simplicity
2. **Add overflow detection** for risky operations
3. **Let the compiler choose sizes** based on constraints and target
4. **Provide escape hatches** only when necessary:

    ```clawr
    var huge: integer @layout(big) = ...  # Force big integer
    var precise: integer @checked(always) = ...  # Always check
    ```

5. **Trust the hardware**: Most arithmetic will be in registers anyway

This approach gives you:
- **Clean source code** (no bit widths)
- **Good performance** (register arithmetic)
- **Safety** (overflow detection)
- **Portability** (different backends)

It's a pragmatic balance between mathematical purity and practical implementation. The key insight is: **Let the compiler worry about representation based on constraints and target, not the programmer.**
