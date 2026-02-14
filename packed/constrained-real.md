# Constrained `real` numbers

- `real` should be an unconstrained real number, $x \in \mathbb{R}$.
- `@precision(decimal: min)` indicates how many correct digits are needed (minimum)
- `@range(min...max)` indicates the allowed size of the value (subset-generating)

Questions:

- How many bits/trits does a value need?
- When can calculations be done using `Float256`or smaller, and when is a `BigDecimal` needed?
- Should the `base` of `BigDecimal` (`mantissa × base^exponent`) be 10 or 2 (or 3 for ternary)?
- If we can freely choose a base (it is not explicit), why not use dozenal or hexadecimal?

Problems with `real` numbers:

- Hardware cannot represent infinite resolution.
- Multiplying two numbers sums the number of digits needed (both for the integer part and tye expansion).
- Algebraic, trigonometric and logarithmic operations often generate irrational numbers (infinite expansion). Even rational numbers have infinite (though cyclic) expansion.
- The usual solution is to set a specific resolution (`double`) for individual values and ignore the rounding errors introduced by operators.

- How do we express constraints for `real` numbers that can be translated to widths in memory?
- How do we maintain the right precision?

---
---

> [!question] AI Prompt
> Is it possible to create an arbitrarily size/precision floating-point number?
>
> I just watched a talk about using continued fractions in Haskell to define numbers exactly. But I don't think that will work for Clawr.

Looking at your question about arbitrary precision floating-point numbers in Clawr, the answer is **yes, it's definitely possible** - and your language's semantic model actually gives you some interesting options for how to implement it.

## Standard Approaches

Most languages handle arbitrary precision in one of two ways:

1. **BigDecimal-style libraries** (Java, C#, Python's `decimal`): Store the number as a large integer mantissa plus an exponent, performing arithmetic with explicit precision/rounding rules
2. **BigNum/GMP-style libraries** (C, Rust): Similar approach but optimized for performance with custom memory management

These work well and are battle-tested. They represent numbers as `(mantissa × 10^exponent)` or `(mantissa × 2^exponent)` with arbitrary-size integers for the mantissa.

## Why Continued Fractions Won't Work

You're right to be skeptical about continued fractions for Clawr. They have beautiful theoretical properties in Haskell because:

- Haskell's lazy evaluation lets you define infinite sequences
- You can compute with "partial" numbers, refining precision on demand
- The pure functional nature avoids state management issues

But in Clawr, you'd face:

- **Eagerness**: You'd need explicit precision limits upfront
- **Performance**: Converting to/from continued fractions for each operation is expensive
- **Engineering complexity**: Basic operations become algorithmically complex

## Clawr's Semantic Advantage

Here's where Clawr's `const`/`mut`/`ref` model becomes interesting:

```clawr
// BigDecimal type could be defined once
object BigDecimal {
    // ... arithmetic operations ...
    
data:
    mantissa: BigInt
    exponent: integer
    precision: integer
}

// Use it with appropriate semantics
const pi = BigDecimal.parse("3.14159265358979323846...")
mut calculation = BigDecimal.zero()
ref sharedAccount = account.balance  // If BigDecimal
```

The same `BigDecimal` type works whether you need:

- Immutable constants (`const`)
- Local isolated calculations (`mut`)
- Shared mutable state (`ref`)

You don't need separate `BigDecimalValue` and `BigDecimalReference` types.

## Implementation Recommendations

For Clawr, I'd suggest:

1. **Start with proven algorithms**: Implement a BigDecimal using the mantissa/exponent approach with arbitrary-precision integers
2. **Make precision explicit**: Require users to specify precision for operations that need rounding
3. **Optimize for copy-on-write**: Since your runtime already supports this, large number types benefit automatically
4. **Consider a standard library**: This feels like a core type that should ship with the language

Would you like to explore what a BigDecimal API might look like in Clawr, or discuss the implementation details of the underlying arbitrary-precision integer type it would need?

> [!question] AI Prompt
> Clawr uses annotations to constrain types. A type is considered set of possible values. A subtype is a subset. And constraint-annotations essentially create a subset too. Though these sets can be partially overlapping.
>
> So `real` should ideally be a `BigDecimal` if unconstrained, and `Float64` or `Float256` or whatever it can be proven to “fit.”

Ah, that's a much more elegant approach! This fits beautifully with Clawr's philosophy of "define once, use contextually."

## The Core Insight

Instead of having separate types like `Float64`, `BigDecimal`, etc., you have **one conceptual type** (`real`) that the compiler optimizes based on provable constraints:

```clawr
const x: real = 3.14159  // Compiler infers precision needs

const y: real@precision(15) = 3.14159  // Fits in Float64
const z: real@precision(50) = pi_to_50_digits  // Requires BigDecimal

func calculate(value: real@range(-1000..1000)) -> real {
    // Compiler knows value fits in smaller representation
}
```

## The Beautiful Parallel

This mirrors your variable semantics philosophy:

- **Variable semantics**: Same type, different behavior (`const`/`mut`/`ref`) based on usage context
- **Numeric precision**: Same type, different representation (`Float64`/`Float128`/`BigDecimal`) based on provable constraints

The type itself (`real` or `BowlingGame`) doesn't dictate implementation details—the context does.

## Constraint-Based Optimization

The compiler could make optimization decisions based on:

```clawr
// Constraints that enable Float64
real@precision(≤15)           // Decimal precision
real@range(-10^308..10^308)   // Magnitude range
real@normalized               // No subnormal numbers needed

// Forces BigDecimal (or larger float)
real@precision(100)           // Needs arbitrary precision
real@exact                    // No rounding errors allowed
real@range(10^400..10^500)    // Outside Float64 range
```

## Implementation Challenges

The tricky parts would be:

1. **Cross-boundary operations**: What happens when `Float64` + `BigDecimal`?
    
    - Promote to BigDecimal?
    - Require explicit conversion?
    - Infer from result constraints?
2. **Type inference**: How do you prove sufficient precision?
    
    ```clawr
    const a: real@precision(10) = ...
    const b: real@precision(10) = ...
    const c = a * b  // Needs precision(20)? Or still 10?
    ```
    
3. **Runtime vs compile-time**: Some constraints may only be checkable at runtime
    
    ```clawr
    const userInput: real = parseInput()
    // Can't prove precision at compile time
    ```

## Possible Solution: Constraint Propagation

```clawr
// Input constraints
func calculateInterest(
    principal: real@precision(2),  // Money: 2 decimal places
    rate: real@range(0..1)@precision(4)
) -> real@precision(2) {
    // Compiler verifies: can intermediate calculations 
    // produce a result that fits the return constraint?
    return principal * rate
}

// Compiler could:
// 1. Use Float64 for all operations (precision proven sufficient)
// 2. Or use BigDecimal internally, round to precision(2) at return
// 3. Flag if result constraint is unprovable from inputs
```

## The Annotation Algebra

You mentioned "partially overlapping sets"—this is interesting:

```clawr
real@precision(10)  // Set of all reals representable with 10 digits
real@range(0..100)  // Set of all reals in range [0, 100]

// Intersection:
real@precision(10)@range(0..100)  // Numbers in both sets

// But these partially overlap:
real@precision(50)  // Can represent tiny or huge numbers
real@range(0..100)  // Limited range but any precision
```

The runtime representation choice could be based on the intersection of constraints.

## Questions for Your Design

1. **Default behavior**: Unconstrained `real`—does it always use BigDecimal, or does the compiler try to infer minimal representation?
2. **Explicit vs implicit**: Can users force a representation (`real@repr(Float64)`) or is it always compiler-determined?
3. **Error handling**: What happens when a runtime value violates its constraint annotation? Trap? Exception? Implicit conversion?
4. **Literal inference**: Does `const x: real = 1.23` get minimal precision, or does the compiler track that it's exactly representable?

This is a really compelling design. The constraint system lets you express _intent_ (precision needs, range requirements) without dictating _mechanism_ (Float64, BigDecimal). Very Clawr-like!

> [!question] AI Prompt
> > `real@precision(15) = 3.14159 // Fits in Float64`
>
> It feels as though `@precision` is not a constraint like `@range`. You can add a number with high precision to a number with low precision. And, as you hinted at, multiplying two numbers mathematically requires the sum of their precisions.
>
> But a variable that has `@precision(2)` should be able to be assigned a value with higher precision. Maybe the value has to be rounded to fit the representation, but that should be okay. The precision of a value is a minimum requirement. “I should be able to store (at least) 2 correct decimal digits.”

Ah yes, you're absolutely right! I was confusing two different concepts:

## Precision as Capacity vs. Constraint

**`@precision` is a capacity guarantee**, not a value constraint:

```clawr
const x: real@precision(2) = 3.14159265  // OK: rounds to 3.14
const y: real@precision(10) = 3.14       // OK: stores 3.14 (exact)

// Contrast with @range (actual constraint):
const z: real@range(0..100) = 150  // ERROR: value outside range
```

- `@precision(2)`: "This variable can store at least 2 decimal digits accurately"
- `@range(0..100)`: "This variable will only ever hold values in [0, 100]"

## Type Compatibility

This means precision creates a **subtyping relationship**:

```clawr
const high: real@precision(10) = 3.14159
const low: real@precision(2) = high  // OK: rounds/truncates

const low2: real@precision(2) = 3.14
const high2: real@precision(10) = low2  // OK: exact value preserved

// real@precision(10) is a subtype of real@precision(2)
// (more precision = narrower type = more specific guarantee)
```

## Arithmetic Propagation

And your multiplication insight is key:

```clawr
const a: real@precision(5) = ...
const b: real@precision(3) = ...

// What is the type of a * b?
const c = a * b  // Should be: real@precision(8)

// The compiler must track precision requirements:
const result: real@precision(2) = a * b  
// OK: 8 digits available, rounds to 2
```

## The Representation Decision

So the compiler's job becomes:

```clawr
const x: real@precision(2) = 3.14

// Compiler decides:
// - Float32? Has ~7 decimal digits → sufficient
// - Float64? Has ~15 decimal digits → overkill but safe
// - BigDecimal(2)? Minimal but has overhead

// Decision factors:
// 1. What operations are performed?
// 2. How does this interact with other values?
// 3. What's the performance trade-off?
```

## Mixed Precision Arithmetic

```clawr
const price: real@precision(2) = 19.99      // Money: Float32 ok
const rate: real@precision(6) = 0.065       // Interest: Float64 ok
const tax: real@precision(8) = price * rate // Needs Float64

// But if you declare:
const tax: real@precision(2) = price * rate
// Result is rounded back to 2 digits
```

## The Key Insight

`@precision` is a **representation requirement**, not a value constraint:

- `@range(0..100)`: "Values will always be in this set"
- `@precision(5)`: "I need storage that maintains 5 digits"

This is similar to:

- `array@capacity(100)`: "Allocate space for 100 elements" (not "array always has 100 elements")
- `string@maxLength(50)`: "Reserve 50 characters" (not "string is always 50 chars")

Does this align with your thinking? And does this mean `@precision` might be better named something like `@minPrecision` or `@accuracy` to emphasize it's a capacity guarantee?

> [!question] AI Prompt
> > Does this mean `@precision` might be better named something like`@accuracy` to emphasize it's a capacity guarantee?
>
> I don't think so. I believe “accuracy” is about the number itself. Is it close to the correct number or is it wildly inaccurate? 5 is inaccurate if the correct value is 20. If we just round an accurate number, we llose precision, not accuracy.
>
> I think achery cam ne a useful analogy. Accuracy is whether or not you hit the target. High precision is how much of the target is affected by the impact. A thin arrow is more precise.

Excellent analogy! You're absolutely right.

## Accuracy vs. Precision

**Accuracy**: How close to the true value

- `5` when the true value is `20` → inaccurate
- `3.14159` when π ≈ `3.14159265...` → accurate (to those digits)

**Precision**: How much detail/resolution you maintain

- `3.14` → low precision (3 decimal places)
- `3.14159265358979` → high precision (14 decimal places)

The archery analogy is perfect:

- **Accuracy**: Hitting the bullseye center
- **Precision**: Tight grouping of arrows (small impact area)

You can be:

- Precise but inaccurate (tight cluster, but all off-target)
- Accurate but imprecise (scattered around the bullseye)
- Both (tight cluster in the center)
- Neither (scattered and off-target)

## In Clawr's Type System

```clawr
// Precision is about representation capacity
const pi: real@precision(5) = 3.14159265  // Stores ~3.14159
const pi: real@precision(15) = 3.14159265 // Stores all digits given

// Accuracy is about the value itself (not the type)
const almostPi: real@precision(15) = 3.0  // High precision, but inaccurate value
const goodPi: real@precision(5) = 3.14159 // Lower precision, but accurate
```

So `@precision` is indeed the right name. It describes the **resolution of the storage**, not the correctness of the value.

## Arithmetic and Precision Loss

```clawr
const a: real@precision(10) = 1.234567890
const b: real@precision(10) = 9.876543210

// Mathematically: a + b = 11.11111110 (needs 10 digits after decimal point)
// But if stored in @precision(5):
const c: real@precision(5) = a + b  // ≈ 11.11111 (lost precision, still accurate)
```

You lose precision through rounding, but if the rounding is done correctly, the result remains accurate (within the limits of that precision).

Thank you for the clarification—`@precision` it is!