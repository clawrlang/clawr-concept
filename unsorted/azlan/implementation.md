# Variable Semantics

There are two kinds of memory structures in Azlan: `semantics:copy` and `semantics:ref`.

With traditional object-oriented programming languages we’re taught to think of variables as pointers into memory. When we create an “object,” it will occupy a block of memory, and assigning it to a variable simply stores the address of that block. Multiple variables, function parameters and fields of other objects can store the same memory address, and hence refer to the same object. When the object is updated through any one of the variables, it is the *object* that is changed, not the variable, so all variables that reference this object will see the new state.

This practice causes *shared mutable state*, which makes reasoning about the state of the application hard, if not impossible. And parallel execution requires complex synchronisation code.

Some languages have introduced “value types,” types that should not be thought of as “objects,” but “values.” The memory is uniquely the property of a single variable, and assigning one variable’s value to another copies the contents instead of the memory address. This enables “local reasoning,” a major improvement to the cognitive effort of understanding application state. And it also negates the need for synchronisation code.

In Azlan, there are no value types or reference types. Instead, we select semantics on a variable by variable basis. Use the ref  keyword to indicate that the referenced object is the subject. And use `let` or `mut` to indicate that the variable is your focus.

# Variable Semantics

There are two kinds of memory structures in Azlan: `semantics:copy` and `semantics:ref`.

When a variable is declared as `let` or `mut`, the corresponding data structure will be flagged as the `semantics:copy` variety. This means that if there are multiple references to that structure when it is edited, the editing must be performed on a copy of the structure, not the structure itself. Only the variable that is explicitly edited may be modified. No other variables that reference the original structure may be changed. Local reasoning is a really powerful concept for understanding the state of your program. That is the contract when using `let` and `mut`.

When using `ref`, the contract says that the main subject is the referenced object (the structure in memory), not the variable. A variable is but one of potentially myriad pointers *referencing* this object. Modifying the object from one location, should instantly be reflected to all other references. Using `ref` can improve performance—as no (implicit) copying is performed—but it invalidates local reasoning. And it also adds complexity in parallel execution contexts; you will need locking or other mechanisms to ensure that two processes cannot modify the same information at the same time.

To illustrate the difference between copy and reference semantics, let’s consider a Bowling game score calculator as an example. The actual code to calculate the score is irrelevant here, but we can assume that it needs to log how many pins were knocked down (or “dropped”) by each roll of the bowling ball. Let’s imagine an encapsulated `BowlingGame` `object` type that calculates the score for a single player:

```mermaid
classDiagram
class BowlingGame {
  - rolls: integer[]
  + [mutating] roll(droppingPins: integer)
}
```

## Copy Semantics

Let’s start playing a game using a `mut` variable, and then assign the game to a different variable that we’ll continue the game through. Because we’re using `mut` variables, this will create two isolated games.

```azlan
mut game1 = BowlingGame() // Creates a new `copy` memory structure
game1.roll(droppingPins: 9)
print(game1.score) // 9

mut game2 = game1 // Temporarily references the same memory block
game2.roll(droppingPins: 1) // Mutating game2 causes an implicit copy where the change is applied
print(game1.score) // 9 - the game1 variable has not changed by the last roll
print(game2.score) // 10 - game2 includes the score for the second roll
```

Let’s follow the state of the memory for each line of code in the example. First a `BowlingGame` object is instantiated and assigned to the `game1` variable. We can illustrate that as follows:

```azlan
mut game1 = BowlingGame()
```

```mermaid
flowchart
game1([mut game1]) --> g1

g1["`semantics = copy
is_a → *BowlingGame*
refs = 1
rolls = []`"]

classDef new  fill:#ffd6d6,stroke:#333,stroke-width:1px,color:black;
class g1 new;
```

The memory holds the state of the game as defined by the `BowlingGame` object type. It also holds some data defined implicitly by the Azlan compiler. These include a `semantics` flag, an `is_a` pointer that references the object's type, and a reference counter (`refs`).

The `is_a` pointer is irrelevant to memory management and will be elided in the other charts on this page. It identifies the type of the object and can be used for runtime type checking. The assigned type defines the layout of the memory block. It is also used for polymorphism (looking up which function to execute for a given method call).

The `semantics` flag identifies the memory structure as belonging to a `mut` variable and hence requiring isolation, the behaviour expressed in this exchange.

The `refs` counter starts at zero and is incremented with every variable assignment. When a variable is reassigned or descoped, the counter is decremented so that it always counts exactly how many referents the structure has. When the counter reaches zero the memory is released to the system for other uses.

For a local variable, reference counting might be redundant, as the memory will certainly be reclaimed when the function returns. But the structure can also be referenced by another structure, and will then have to be kept around for as long as that structure maintains *its* reference.

The second line logs a roll of the bowling ball, which knocks down 9 pins. Because the `refs` counter is 1, this change is written directly into the memory without creating a copy.

```azlan
game1.roll(droppingPins: 9)
```

```mermaid
flowchart
game1([mut game1]) --> g1

g1["`semantics = copy
refs = 1
rolls = [9]`"]
```

Then the new variable `game2` is assigned to the structure.

```azlan
mut game2 = game1
```

```mermaid
flowchart
game1([mut game1]) --> g1
game2([mut game2]) --> g1

g1["`semantics = copy
refs = 2
rolls = [9]`"]
```

This increments the `refs` counter as there are now two variables referencing the same structure. As long as no modification is made to the structure, there is no need to maintain isolation. Both variables can reference the same memory block.

But then `game2` is modified though the `game2.roll(droppingPins: 1)` call, The method is tagged as `mutating`, which indicates that calling it will cause changes to the memory. As the `semantics:copy` flag indicates that memory changes must be done in isolation, a copy is made, and then the method is invoked *on that copy*.

```azlan
game2.roll(droppingPins: 1) // mutating method call
```

```mermaid
flowchart
game1([mut game1]) --> g1
game2([mut game2]) --> g2

g1["`semantics = copy
refs = 1 (was 2)
rolls = [9]`"]

g2["`semantics = copy
refs = 1
rolls = [9, 1]`"]

classDef new  fill:#ffd6d6,stroke:#333,stroke-width:1px,color:black;
class g2 new;
```

In the image, the red background signals a newly claimed block of memory. The other block is the original, unchanged one.

The new block will only be referenced by the changing variable (`game2`) and receives a `refs` counter of 1. Because `game2` has been reassigned, the old structure’s `refs` counter is decremented by one.

And this is how we can play two isolated bowling games even though we only explicitly created one.

## Reference Semantics

When a structure is instantiated and assigned to a `ref` variable, on the other hand, it will be flagged as `semantics:ref`. This means that multiple `ref` variables may reference the same (shared) structure and no implicit copying will be made.

Here is an example of usage:

```azlan
ref game1 = BowlingGame() // Creates a new `ref` memory structure
game.roll(droppingPins: 9)
print(game1.score) // 9

ref game2 = game // References the same structure
game2.roll(droppingPins: 1) // Mutation does not cause a copy
print(game1.score) // 10
```
Let’s follow the state of the memory for each line of code in the example. First a `BowlingGame` object is instantiated and assigned to the `game1` variable. We can illustrate that as follows:

```mermaid
flowchart
game1([ref game1]) --> g1

g1["`semantics = ref
refs = 1
rolls = []`"]

classDef new  fill:#ffd6d6,stroke:#333,stroke-width:1px,color:black;
class g1 new;
```

The memory is structured exactly the same way as for a `semantics:copy` variable and the `is_a` (elided here) and `refs` properties have the same purposes. The only difference is the value of the `semantics` flag. In this case we use `semantics:ref` which has implications when we assign this block to multiple variables.

The second line logs a roll of the bowling ball, which knocks down 9 pins:

```mermaid
flowchart
game1([ref game1]) --> g1

g1["`semantics = ref
refs = 1
rolls = [9]`"]
```
When the other variable is assigned:

```mermaid
flowchart
game1([ref game1]) --> g1
game2([ref game2]) --> g1

g1["`semantics = ref
refs = 2
rolls = [9]`"]
```

And when the next roll is logged it updates the shared memory, affecting both variables:

```mermaid
flowchart
game1([ref game1]) --> g1
game2([ref game2]) --> g1

g1["`semantics = ref
refs = 2
rolls = [9, 1]`"]
```

This did not trigger a copy in this case. Because the variables are `ref`, and the memory is flagged as `semantics:ref` the contract is different than that of `mut` variables.

A `mut` variable has to be isolated: it must not be changed by changing other variables, and no other variables may change when *it* is changed. This is a powerful guarantee that makes local reasoning possible.

But the `ref` contract requires that a single entity can be referenced (and modified) from multiple locations. It must *not* be copied (unless explicitly requested to) or the contract is broken.

# Weak References

Weak references are necessary to avoid leaking when reference cycles are possible. If two objects in memory have (strong) references to each other, the runtime will not know to deallocate them, and their memory will have “leaked.” That memory can no longer be used for anything as long as the program runs. It will not be deallocated until the program exists and all its memory is reclaimed by the operating system.

A `weak` reference is not reference-counted, but is set to `null` when the referenced object goes out of scope. This means that cycles are safe from memory leakage as long as at least one of the references in each cycle is `weak`.

## Implementation

The implementation is much like Pepparholm, the artificial island that was created for the bridge from Malmö to Copenhagen. When you come off the bridge at Pepparholm, you are not at your destination, you will need to pass through a tunnel (a second water crossing) before you arrive in Copenhagen, Denmark.

The `weak` reference implementation also uses a stepping-stone that requires passing through a second junction (pointer) to get to the true destination.

Every `object` and `struct` contains an optional `WeakReference` structure. [^side-table] This structure contains a pointer back to the main structure, and a reference-counter that tracks the `weak` references to the object in memory. This establishes a reference cycle, but this cycle is safe because it is kept under strict control.

[^side-table]: Swift and the AIs call this a “side table,” but it’s not a table. It is essentially Pepparholm: a tiny structure/manufactured island, where the bridge from Malmö ends before it connects through another link (the tunnel) to the real destination: Copenhagen, Denmark.

```mermaid
classDiagram
class WeakReference {
  refs: integer
  object: MetaHeader
}
class MetaHeader {
  semantics = ref
  is_a: type_info
  refs: integer
  weakRef: WeakReference?
  payload
}

WeakReference <--> MetaHeader
```

When the first `weak` reference is established, the `WeakReferece` structure is created with a reference-counter of 1, and the main object is updated to reference it. (The main object might be counted as well, but it is not necessary. If it is, the reference-counter should start at 2.)

When subsequent `weak` references are established, the reference-counter is incremented, and when they are reassigned or descoped, the counter is decremented. The structure is however not necessarily deallocated when the counter reaches zero. Instead it is deallocated with the main object.

If the main object is deallocated when the reference-counter is non-zero, the structure will *not* be deallocated. Instead it will be deallocated when the reference-counter reaches zero (i.e. when all `weak` references have been removed).

Adding the main object to the reference-counter might simplify this logic. Then the counter would be decremented when the object itself goes out of scope as well as when `weak` references are removed. Whether is is caused by the references or by the object itself, the `WeakReference` structure is deallocated as soon as the counter reaches zero.

Whether the object is included in the counter is—at this time—a purely aesthetic choice. It may be prudent to perform some analysis/tests of the performance ramifications before settling on the implementation.

Here is a sketch of how it might be implemented in C (with the object included in the counter):

```c
typedef enum {
    SEM_COPY,
    SEM_REF
} Semantics;

/// A header that is prefixed on all programmer types
typedef struct MetaHeader {
    Semantics semantics;
    void *is_a;           // type info
    atomic_uintptr_t refs;
    struct WeakReference *weakRef; // Is always NULL for SEM_COPY
} MetaHeader;

// Note that using this type is a bit weird. The Azlan code will not be
// aware of the MetaHeader struct as such, but will refer to the memory 
// after the header.

// allocateObject(sizeof(PayloadType), SEM_COPY, PayloadType_info)
// allocateObject(sizeof(PayloadType), SEM_REF, PayloadType_info)

MetaHeader *allocateObject(size_t payload_size, Semantics sem, void *type) {
    // Allocate header + payload in one block
    MetaHeader *hdr = malloc(sizeof(MetaHeader) + payload_size);
    hdr->refs = 1;
    hdr->is_a = type;
    hdr->semantics = sem;
    hdr->weakRef = NULL;
    return hdr;
}

typedef struct WeakReference {
    MetaHeader *object;
    atomic_uintptr_t refs; // Counts the `weak`references to object
} WeakReference;

WeakReference *createWeakRef(MetaHeader *object) {
    if (!object->weakRef) {
        object->weakRef = makeWeakReference(object, 2);
    } else {
	    atomic_increment(&object->weakRef->refs);
    }
    return object->weakRef;
}

void deallocateObject(MetaHeader *object) {
    WeakReference *weakRef = object->weakRef;
    if (weakRef) {
        weakRef->object = NULL;
        releaseWeakRef(weakRef);
    }
    free(object);
}

void releaseWeakRef(WeakReference *weakRef) {
	// Note: atomic_decrement() returns the old value, not the new.
	// So to check if there are zero references, we compare the old
	// value with 1, which is equivalent to comparing the new value with 0.
    if (atomic_decrement(&weakRef->refs) == 1) {
        free(weakRef);
    }
}

MetaHeader *lookup(WeakReference *weakRef) {
	if (!weakRef) return NULL;
	return weakRef->object;
}
```

When a `weak ref` variable is assigned, the runtime executes `createWeakRef(referencedObject)` and assigns the address of the created `WeakReference` structure to the variable, not the address of the `referencedObject` itself. When a `weak ref` is later reassigned or exits scope, the runtime calls `releaseWeakRef(weakRef)`. And when the last strong reference to the object is removed, the runtime calls `deallocateObject(referencedObject)` (which also calls `releaseWeakRef()`).

When a `weak ref` variable is looked up, it is always done through the `lookup(weakRef)` call. If a field or a method is executed, the same lookup must be repeated before looking up the field or method in the actual object. It should probably be recommended to always look up the variable only once when making multiple calls to the same object.

We might also need these functions:

```c
void *getPayload(MetaHeader *hdr) {
    return (void *)(hdr + 1); // memory right after header
}

MetaHeader *getHeader(void *payload) {
    return ((MetaHeader *)payload) - 1;
}
```

Or maybe the compiler can just add offsets to all variables so that they point directly to the correct address?
### Synchronisation

The `refs` counters need to be atomic. If multiple references are added and/or removed at the same time, the `refs` counter could easily be corrupted otherwise. The question is whether more of the logic needs to be protected.

When an object is deallocated (freed), it will not have any references to it, so `free(object)` should not need protection.

Suppose, however, that there is one single variable reference to an object, and two processes access that variable in parallel. One process discards the variable that holds the reference, but the other is assigning the object to a new variable. If the process that adds a reference increments the `refs` counter first, there should be no problem. But if the decrement happens first, there could be an issue.

```mermaid
sequenceDiagram
Thread1 ->> Object: decrement refs
Object  -->> Process1: refs is 0
Thread2 ->> Object: increment refs
Thread1 ->> Object: free()
Thread2 -x  Object: call method (but pointer is now hanging)
```

Thread 1 decrements the counter to zero and prepares to deallocate the object, but then the thread is halted and Thread 2 increments the counter. The solution to this scenario might be to check the increment and see that it returns zero (0) because it was just decremented, and now it is incrementing from zero. That means that the object is in the process of being deallocated,  but the deallocation was interrupted before the variable was cleared/reassigned.

Would always reassigning first and deallocating later make the code simpler? No, probably not. A different process might have accessed the object just before it was reassigned. And then be interrupted until after the object is freed:

Thread 1 looks up the object but does not assign it to a new variable. It just calls a method on the object or reads/updates one of its fields. Thread 2 interrupts Thread 1 just before the method is called and reassigns the variable. Now the object may be freed before Thread 1 gets to continue. And it’s hence looking for a method in deallocated memory. Should Thread 1 increment the `refs` counter before calling the method? That doesn’t feel right though.

```mermaid
sequenceDiagram
Thread1 ->> Object: get pointer from variable
Thread2 ->> Object: reassign variable
Thread2 ->> Object: free()
Thread1 -x  Object: call method (but pointer is now hanging)
```
