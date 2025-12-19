# Return Values are *Moved*

Functions return “unique” values by default. Unique values can be assigned reference semantics *or* copy semantics as needed. The first variable it is assigned to will determine the semantics for the allocated memory. After that if cannot be reassigned to a conflicting semantics variable without explicitly copying.

When a function returns a value, that memory is “moved.” That means that if the function does `return x` it will not `release(x)` (but it will release all other variables in its scope). The receiving variable will not call `retain()` on the returned value, but will just take over the reference from `x`.

If there are multiple other variables that refer to `x` (and they are not descoped), the value cannot be returned as “unique.” So the semantics must be explicit in the function signature and the receiver will have to `copy()` the value if the receiver semantics doesn't match.

## Factories are not Special

They are not a special case. From the client’s perspective they are just `static` methods that return unique structures and called the exact same way.

Without inheritance, factories could be removed entirely and replaced with `companion` methods and `data` literals (`{ field: value }`). This might be supported anyway. The default for an `object` could be `final` / `sealed`, and if you want to support inheritance you need to get explicit about it.

The implementation, however is different: Calling a factory method allocates memory for the entire type (with inherited fields). Then the function is called to allocate those fields and maybe call secondary setup methods after the .

## Example — Inheritance

```clawr
// “Open” and “abstract” objects allow inheritance. They must define
// initializers for inheriting objects to invoke at construction.

abstract object Entity {

  // These first methods are non-mutating, so they will never trigger
  // copy-on-write, and they can be called from `let` variables.

  func id() => .id
  func reconstitutedVersion() => .version
  func unpublishedEvents() => copy .unpublishedEvents

  // Initializers also do not trigger copy-on-write because the
  // reference count is always 1 when they are called.

  init new(id: EntityId) => { id: id, version: .new }

  init reconstitute(_ id: Entityid, version: EntityVersion, replaying events: [PublishedEvent]) {

    // This method has post-initialization code. All the fields must
    // be initialized before that is allowed. That is done by assigning
    // a literal to the special variable `self`.
    self = { id: id, version: version }

    // NOTE: Assigning to `self` does not allocate a new instance. The
    // encapsulated `data` has already been allocated in memory before
    // the factory-method starts executing. The literal assigned to `self`
    // represents the initialization of that `data`, and it needs to define
    // all the fields before it can run post-initialization code. 

    // NOTE: The semantics of `self` (copy or reference) is irrelevant
    // during setup. The reference count will always be one until the
    // initialiser returns. And then the allocated memory will be “moved”
    // to the receiving variable.

    // `self` is assumed to be completely set up after the literal
    // assignment. It should be safe to call methods. That means that
    // all sub-type fields must also have been initialized before calling
    // this factory method.
    for event in events {
      // Call methods on the sub-type to restore state information
      // corresponding to the events.
      // Calling mutating methods from this context is safe as
      // the object will not have multiple referents.
      replay(event: event)
    }
  }

mutating:

  // These methods are mutating and unavailable to `let` variables.
  // They will trigger copy-on-write before being executed.

  func add(event: UnpublishedEvent) { unpublishedEvents.add(event) }
  func abstract replay(event: PublishedEvent)

data:

  let id: EntityId
  let version: EntityVersion
  mut unpublishedEvents: [UnpublishedEvent]
}
```

### Subclassing

```clawr
object Student: Entity {

  func name() => name
  func isEnrolled(in course: Course) => enrolledCourses.contains(course)

mutating:

  func enroll(course: Course) {
    add(event(for: course))
  }
  
  override func replay(event: PublishedEvent) { ... }

data:

  name: string
  enrolledCourses: Set<Course> = []
}

companion Student {

  // As `Student` is implicitly sealed it does not need `init` methods.
  // Instead, it can define “constructors” as ordinary functions.

  func reconstitute(id: EntityId, version: EntityVersion, replaying events: [Event]) => {
    super.reconstitute(id, version: version)
    name: name
  }

  // Return type is Student without decoration. It must return a “unique”
  // instance that is safe to assign semantics that fits the receiver
  func new(id: EntityId, name: string) -> Student {
  // All the fields will be assigned first. Then the super factory method
  // will be called and set up the fields of the super-type. And that in
  // turn will call back to methods on this type.

  // This value will be ISOLATED. Cannot be assigned to a ref variable.
  mut student = {
    super.new(id: id)
      name: name
    }
        
    // This variable would add one to the reference count
    // But that is decremented again when the function exits
    // let otherRef = student // Allowed

    // This variable is incompatible with the semantics of `student`
    // ref sharedSelf = student // Not allowed.

    student.add(event(for: course))

    // When returned, `student` becomes a *unique* instance and its
    // semantics can be changed to match the caller.
    return student
  }
}

let student1 = Student.new("Emil")
ref student2 = Student.new("Emilia")
```

## Rules

1. `ISOLATED` memory may not be assigned to `ref` variables. `copy()` is required.
2. `SHARED` memory may not be assigned to `let` / `mut` variables. `copy()` is required.
3. `SHARED` memory returned from a function must be announced.
4. `ISOLATED` memory (returned from a function) can be reassigned `SHARED` if `refs == 1`.
5. If a function cannot prove that the value is always uniquely referenced, it must announce that its semantics are fixed.

```clawr
func returnsRef() -> ref Student // SHARED memory
func returnsCOW() -> let Student // ISOLATED memory
func returnsUnique() -> Student  // uniquely referenced, reassignable
```

## Default Constructors

Most OO languages allow classes with implicit, no-argument, constructors. This does not exist in Clawr. You will always have to define a public-facing method/initialiser for clients to invoke. It needs to have a name to refer to, just `TypeName()` is not a syntactically valid initialisation. (It would be interpreted as a function call, not a constructor invocation.)

An `abstract` type, however, is never instantiated directly. It doesn't need to expose a method for construction as long as its “concrete” inheritors do. And those inheritors do not necessarily need to invoke an explicit `super` function; they can just return a literal defining field values.

If the abstract type does not have any fields (or all its fields have default values) it might be okay not to define an explicit initialiser for it.

## Destructors

No `object` type will ever need a destructor. They are not allowed to touch the world outside their own memory allocation. There is nothing to clean up beyond `free(self)`.

A `service` might need a destructor. It might e.g. represent a file handle that needs to be closed.
