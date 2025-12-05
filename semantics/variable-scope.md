# Variable Scope & Semantics

> What if you want the same type in different parts of your code, but sometimes you need it to be a `struct` and at other times a `class`?

This is the thought that sparked the need for a new programming language.

In the languages I know, such a need would requires duplicating code—which violates DRY—or wrapping one type inside another—a `class` that contains a `struct`—which is awkward.

In Clawr, I want to be able to define a type once and then specify its "kind" (i.e., `struct`-like vs `class`-like) based on the context in which it is used. This would allow for more flexible and reusable code without duplication.

## The Problem: Shared Mutable State

“What is the difference between a `struct` and a `class`,” I hear you ask? Well, in programming, there is a big problem called *shared mutable state*.

Shared mutable state occurs when multiple parts of a program can access and modify the same data. This can lead to unexpected behaviour and bugs, it makes reasoning about code more difficult, and it adds complex synchronisation requirements in parallel execution.

It is caused by assigning one variable to another (`x = y`). Here are some concrete situations that can lead to shared mutable state:

- A variable is assigned to a field of an object or data structure
- A variable is passed as an argument to a function
- A field is returned from a function
- Multiple threads are started with access to the same variable
- A variable is captured in a closure
- A variable is stored in a global context
- A variable is stored in a collection that is shared across different parts of the program
- etc

### How Languages Address This

Different programming languages take different approaches:

- **Functional languages** (Haskell, Clojure): Disallow mutation altogether
- **Modern system languages** (Rust): Use ownership and borrowing systems
- **Hybrid languages** (C#, Swift): Introduce types with isolated mutation
    - `struct`: Value semantics (copied, isolated)
    - `class`: Reference semantics (shared, mutable state)

The problem with the hybrid approach: **You must decide at type definition whether it will be a struct or class**, limiting reusability.

The problem with ownership and borrowing is that it can be confusing. While Rust's ownership system prevents entire classes of bugs, it comes at a cost: programmers must explicitly manage lifetimes and borrowing relationships through complex syntax. This shifts cognitive effort from domain problems to memory management details, making the code's intent less immediately clear.

## Clawr’s Paradigm

Here is a proposal for Clawr. Instead of defining semantics per type, let’s make each variable individually declare its isolation level.

Rust uses ownership and borrowing to manage memory safety. While this is powerful, it requires explicit lifetime annotations that add syntactic overhead. With the proposed strategy, we can provide similar safety guarantees with clearer, more readable code.

| Keyword | Mutability | Semantics              | Use Case             |
| ------- | ---------- | ---------------------- | -------------------- |
| `let`   | Immutable  | Isolated/Copy on Write | Constants, pure data |
| `mut`   | Mutable    | Isolated/Copy on Write | Isolated mutation    |
| `ref`   | Mutable    | Shared Reference       | Shared state         |

Mental Model:

- `let` variable: A constant value (even if structurally complex)
- `mut` variable: A container for data. The data can be copied to another container, but the containers remain independent.
- `ref` variable: A pointer to an entity. Multiple variables can reference and modify the same entity.

> [!note]
> We might want to consider additional keywords. For example, we might want to disallow structural mutation on `ref` variables (i.e., only allow calling mutating methods, but not changing fields directly). This would enforce better encapsulation. (Though a `let` copy might be sufficient in that case.)

With this approach, types can be defined without inherent semantics.

Let's explore an example to see why this flexibility is powerful. Consider a bowling game score calculator that needs to track rolls:

```clawr
object BowlingGame {

    score() -> integer {
        // Calculate total score
        // See the Bowling Game Kata (http://www.butunclebob.com/ArticleS.UncleBob.TheBowlingGameKata) for an example algorithm.
    }
    
mutating:
    func roll(droppingPins count: integer) {
        rolls.append(count)
    }

data:
    rolls: [integer]
}
```

> [!note]
> This `BowlingGame` type is defined as an `object`, meaning it hides its data structure behind an encapsulation. This will be discussed in a [different document](object-data.md).

Now, when using `BowlingGame`, we can choose the appropriate semantics based on our needs:

### Copy Semantics with `mut`

When using `mut` variables, changes are isolated:

```clawr
mut game1 = BowlingGame()
game1.roll(droppingPins: 9)
print(game1.score) // 9

mut game2 = game1                    // Shares memory (temporarily)
game2.roll(droppingPins: 1)          // Triggers copy-on-write
print(game1.score) // 9  ← unchanged
print(game2.score) // 10 ← includes second roll
```

### What happened?

1. `game1` and `game2` initially reference the same memory
2. When `game2.roll()` is called (a mutating method), the runtime detects multiple references
3. A copy is made before modification, ensuring `game1` remains unchanged
4. Each variable now has its own independent game state

### Reference Semantics with `ref`

When using `ref` variables, changes are shared:

```clawr
ref game1 = BowlingGame()
game1.roll(droppingPins: 9)
print(game1.score) // 9

ref game2 = game1                    // Shares the same game
game2.roll(droppingPins: 1)          // Modifies shared state
print(game1.score) // 10 ← changed!
print(game2.score) // 10 ← same game
```

### What happened?

1. Both variables reference the same game entity
2. Modifications through either variable affect the shared state
3. No copying occurs—this is true reference semantics

### When to Use Each

```clawr
// Local calculations - use mut for isolation
mut tempScore = game.calculateFrame(3)
tempScore.adjust(bonus: 10)  // Only affects tempScore

// Shared game state - use ref for coordination
ref activeGame = gameManager.currentGame
player1Thread.update(activeGame)
player2Thread.update(activeGame)  // Single game instance

// Immutable snapshots - use let for safety
let finalScore = game.score
archiveToDatabase(finalScore)  // Safe to share
```

## Notes on Implementation

### Memory Structure

To enforce isolation semantics, the runtime will need to manage memory with metadata indicating whether a memory block is `ISOLATED` or a shared `SHARED`.

- **Semantics flag**: `ISOLATED` (for `let`/`mut` variables) or `SHARED` (for `ref` variables)
- **Reference Counter**: To track how many variables reference a memory block
- **Type Information**: To enable polymorphic behaviour and method dispatch, and to support runtime type-checking if needed

### Copy-on-Write Optimisation

The implementation should use automatic reference counting (ARC) with copy-on-write:

1. No copying at assignment: When x = y, both variables initially reference the same memory
2. Copy only when needed: A copy is made only when:
    - Memory is flagged ISOLATED, AND
    - Reference count > 1, AND
    - A mutating operation is performed
3. Never copy SHARED memory: This would violate the shared-state contract

This provides the safety of value semantics with the performance of reference semantics.

### Type Safety Rules

The compiler enforces the following rules:

- Cannot assign `ref` to `mut` or `let` without explicit copy:

    ```clawr
    ref r = BowlingGame()
    mut m = r              // Compile error
    mut m = r.copy()       // Explicit copy - OK
    ```

- Cannot assign `mut`/`let` to `ref` (would create isolated entity when shared expected):

    ```clawr
    mut m = BowlingGame()
    ref r = m              // Compile error
    ref r = m.copy()       // Explicit copy - OK
    ```

Different semantics cannot be mixed without explicit intent. There is no way to maintain two different sets of semantic guarantees for the same memory block. Therefore, a copy with different semantics must be created immediately at assignment. If this is done implicitly, it can lead to confusion and bugs.

### Function Parameters and Return Values

Function parameters and return values should also respect semantics:

- Parameters default to `let` semantics (isolated). Passing a `ref` requires explicit copy.
- Each function can specify if it returns `ref` or `let`/`mut` semantics.

Idea/exploration: What if parameters had their own semantics? They could be something like:

1. require immutable, isolated values; does not mutate or share state and reqiures that no other thread can change it while it’s working.
2. allow reference, but promise not to mutate: safe to pass `let` or `ref` variables without copying.
3. explicitly mutates received structure: requires `ref` variables; allows mutation of shared state.
4. temporarily borrows value for mutation: accepts `mut` or `ref` variables; might be dangerous to allow if the value can “escape.”
5. and other options?

## Proof of Concept

There is a [proof of concept repository](https://github.com/clawrlang/clawr-poc) that implements a compiler and runtime for Clawr, demonstrating the variable scope and semantics model described above. Its main focus is showing how the runtime can manage memory with the proposed semantics while providing safety guarantees.

It also implements the other big language idea of Clawr: enforcing [encapsulation vs pure data segregation](object-data.md).
