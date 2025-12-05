# Swift's Struct Memory Management

Swift uses a sophisticated mechanism called **Existential Containers** for value types, which allows for more complex memory management than a simple contiguous memory layout.

## Existential Container Structure
```
+-------------------+
| Metadata Pointer  | // Type information
+-------------------+
| Reference Count   | // Shared reference count for the entire struct
+-------------------+
| Inline Storage    | // First 3 words of data
+-------------------+
| Out-of-line Data  | // Pointer to additional data if struct is large
+-------------------+
```

## Copy-on-Write Mechanism

When you do:
```swift
struct B {
    var bValue: Int
}

struct A {
    var aValue: Int
    var b: B
}

let x = A(aValue: 1, b: B(bValue: 2))
let y = x.b
```

- <b>Swift does NOT immediately copy the `B` struct</b>
- The reference count for the entire `A` structure is incremented.
- `y` references the same memory as `x`! Even though it only uses a small portion.
- `y` references `A` stru

## Mutation Triggers

If you modify `y`:
```swift
var y = x.b
y.bValue = 3
```

- Swift checks if the `A` reference count is > 1

## Performance Issue

This can be a problem when dealing with very large `struct`s.

```swift
struct Small { var intValue: Int }
struct A { 
    var largeData: [Int] // Imagine this is very large
    var small: Small
}

let x = A(
	largeData: Array(repeating: 0, count: 10000),
	small: Small(intValue: 2)
)
let y = x.small

// Modification copies the entire `A` structure
// (though the array might still be reused if only modifying the intValue)
x.small.intValue = 1
// Directly modifying the array requires it to be copied though
x.largeData[0] = 1

// `y` retains the entire original `A` structure (including the `largeData`
// array), even though it only “knows” about the `Small` structure.
```
 If `x` goes out of scope (or worse: is modified), `y` still retains all this `largeData` even if it is no longer used (or even accessible). This can lead to high memory use. It is not technically a *leak* as the memory will eventually be reclaimed. But if the `y` variable is retained for a long time, all that unused memory will be inaccessible by anyone for all that time.

I don't know if this is still better than my (perhaps naïve) strategy. I make every `struct` its own block of memory, with its own header. That means allocating a bit more memory than strictly needed (unless optimisation can merge structures that are not shared), but it also means that assigning a variable to a small section of a very large struct will not cause the entire thing to be retained.
