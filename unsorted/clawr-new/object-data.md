The `data` type is a simple aggregate of related data elements. All its fields are exposed to any code that references it.

```clawr
// “A Data Structure is a set of data elements operated upon by implied functions.”
// — Uncle Bob Martin

data UserRegistrationCommand {
  username: string

  // There should be no need to name substructures
  passwordHash: { saltedHash: string, salt: string }
}

// A data structure can be instantiated using a literal:
let reg: UserRegistration = {
  username: "johan"
  passwordHash: { saltedHash: "12345AZ", salt: "987654321" }
}
```

Variables have interesting semantic rules.

```
// The reg variable above is immutable (let) and cannot be changed.

mut a_copy = reg // A mutable copy
a_copy.username = "nahoj" // copy-on-write
assert reg.username == "johan" // hasn't changed

ref shared1 = copy reg // explicit copy required: ref and let have incompatible semantic guarantees
ref shared2 = shared1
shared2.username = "alice"
assert shared1.username == "alice" // both ref variables change together
```

The above code illustrates variable semantics. `let` and `mut` guarantee isolation from other variables. Assigning many `mut` variables to the same memory address is okay, because the compiler can employ copy-on-write to isolate mutations.

`ref` on the other hand indicates a reference to a single, shared entity. As the two kinds have different behaviours a `ref` variable cannot ever point to the same memory address as a `let` or `mut`, so assigning across kinds requires explicit copying.

The `object` type is an *encapsulated* `data`structure:

```clawr
object Money {

  // “An Object is a set of functions that operate upon implied data elements.”
  // — Uncle Bob Martin
  
  // The syntax encourages outside-in design by requiring that “pure” methods
  // be defined first and fields only after a `data:` tag.

  pure dollars() => self.cents / 100
  pure cents() => self.cents % 100

factory:
  // These constructors (or “factory methods”) look like static methods from
  // outside, but are used to initialise new instances.
  // The data literals indicate the content of the hidden data structure
  // They have to initialize all the fields

  func cents(_ c: integer) => { cents: c }
  func dollars(_ d: integer, cents: integer = 0) => {
    cents: d * 100 + cents
  }
  func amount(_ a: real) => {
    cents: integer(Math.round(a * 100)
  }

data:
  let cents: integer
}

static Money {
  let zero: Money = { cents: 0 }
  operator l: Money + r: Money -> Money => { cents: l.cents + r.cents }
}
```

The `Money` type is a DDD value-object. It is immutable and calculations will always create new instances.Below is an example that can mutate:

```clawr
object BowlingGame {

  // This method is not truly pure, because it accesses a mutable field.
  // But it is “pseudo-pure” because it does not perform any mutation.
  // Its location in the structure disallows side-effects.

  func score() -> integer {
    // implement Bowling Game kata using functional programming principles
    // look at the `rolls` as an immutable variable
  }
  
mutating:
  // Methods in this section trigger copy-on-write. But the only allowed
  // side-effects are local to the object.

  func roll(pins: integer) {
    rolls.append(pins)
  }

data:
  rolls = List<integer>()
}

static BowlingGame {
factory:
  // This constructor (or “factory method”)
  func new() => { rolls: List.new() }
}
```

The `mutating:` section contains methods that are allowed to mutate the `object`. Unfortunately, “pure” methods are not restricted to the unlabelled section, but can also be included here. Hence, it is possible—but should be discouraged—to define fields before methods:

```clawr
object BowlingGame {

data:
  rolls = List<integer>()
  
mutating:
  func score() -> integer {
    // ...
  }

  func roll(pins: integer) {
    rolls.append(pins)
  }
}
```

This will of course mean that even “pure” methods will trigger copy-on-write.

It will also means that those methods are not available to immutable variables.
