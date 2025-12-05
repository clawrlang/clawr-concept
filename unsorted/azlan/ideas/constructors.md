# Constructors in Azlan

Azlan will not have constructors like Java and C#. Instead it will have `static` factory methods and `struct` initialisers.

A `struct` is a naked data structure. That is reflected in how it is constructed/instantiated. Either load it from a serialised source, or use the `struct` literal:

```azlan
struct Point { x: real, y: real } // implicitly mut
let initial: Point = { x: 1, y: 30 }

mut a = initial
a.x += 12

let b = initial assigning { y: 0 }

print a // { x: 13, y: 30 }
print b // { x: 1, y: 0 }
```

Instances of `object` types are structurally similar to `struct` instances, but they are *encapsulated*. This means that users of the `object` must not know what fields it has or what other implementation details it employs. It only knows interaction-points (methods). While a `struct` communicates its contents and composition—and nothing of its use—an `object`  communicates intent and purpose through method names.

```azlan
object Point {

    // An `object` is defined in terms of methods, not fields.
    // Fields are private and can only be accessed through methods.

    func x() => .x
    func y() => .y
    func r() => sqrt(.x * .x + .y * .y)
    func theta() => atan2(.y, .x)

factory:

    // This section defines factory methods that create and return
    // instances of the containing object type. These methods are
    // called like `static` methods on the object type itself, not
    // on instances. The return type of these methods is always the
    // containing object type. The methods typically have parameters,
    // which are used to initialize the fields.
    
    // The method body can often be simplified to a struct literal.

    func cartesian(x: real, y: real) => {x: x, y: y}
    func polar(r: real, theta: real)
        => {x: r * cos(theta), y: r * sin(theta)}

static:

    // This section defines static fields and methods. These are
    // associated with the object type itself, not with instances
    // of the object type. The fields and methods can be accessed
    // using the object type name as a qualifier.

    let origin: Point = {x: 0.0, y: 0.0}

struct:

    // An `object` is essentially an encapsulated `struct`. These are
    // the fields of that struct. The struct is private to the object,
    // so the fields can only be accessed indirectly, via methods.

    let x: real
    let y: real
}
```

To instantiate an `object` from an external user involves calling a factory method. But *internally* an `object`’s fields are very similar to a `struct`’s. The only difference is that an `object` can inherit from a super-type (another `object` type).

```azlan
object abstract Entity {

    // These first methods are non-mutating, so they will never trigger
    // copy-on-write, and they can be called from `let` variables.

    func id() => .id
    func reconstitutedVersion() => .version
    func unpublishedEvents() => copy .unpublishedEvents

mutating:

    // These methods are mutating and unavailable to `let` variables.
    // They will trigger copy-on-write before being executed.

    func add(event: UnpublishedEvent) { unpublishedEvents.add(event) }
	func abstract replay(event: PublishedEvent)

struct:

    let id: EntityId
    let version: EntityVersion
    mut unpublishedEvents: [UnpublishedEvent]

factory:

    func new(id: EntityId) => { id: id, version: .new }

    func reconstitute(_ id: Entityid, version: EntityVersion, replaying events: [PublishedEvent]) {

		// This method has post-initialization code. All the fields must
		// be initialized before that is allowed. That is done by assigning
		// to the special variable `self`.
	    self = { id: id, version: version }

		// NOTE: Assigning to `self` does not allocate a new instance. The
		// inner `struct` has already been allocated in memory before executing
		// the factory-method. The literal assigned to `self` represents the
		// initialization of that `struct`, and it needs to define all the
		// fields before it can run post-initialization code. 

		// NOTE: The semantics of `self` (copy or reference) is irrelevant
		// here. It is decided by the variable that the value is being
		// assigned to. And as the reference count will be one during setup,
		// there is no need to worry about isolation.

	    // `self` is assumed to be completely set up after the literal
	    // assignment. It should be safe to call methods. That means that
	    // all sub-type fields must also have been initrialized before calling
	    // this factory method.

	    for event in events {
		    // Call methods on the sub-type to restore state information
		    // corresponding to the events.
		    // Calling mutating methods from this context is safe as
		    // the object will not have multiple referents.
		    replay(event: event)
	    }
	}
}

object Student: Entity {

    func name() => name
    func isEnrolled(in course: Course) => enrolledCourses.contains(course)

mutating:

	func enroll(course: Course) {
		add(event(for: course))
	}
	
	override func replay(event: PublishedEvent) { ... }

factory:

	// All the fields will be assigned first. Then the super factory method
	// will be called and set up the fields of the super-type. And that in turn
	// will call back to methods on this type.
    func reconstitute(id: EntityId, version: EntityVersion, replaying events: [Event]) => {
		super.reconstitute(id, version: version)
		name: name
	}

    func new(id: EntityId, name: string) {
		self = {
	        super.new(id: id)
	        name: name
        }
        // Calling a mutating method in this class.
	    self.add(event(for: course))
    }

struct:

    name: string
    enrolledCourses: Set<Course> = []
}

let student = Student.new("Johan")
print student.unpublishedEvents()
```

The factory-methods are not like typical functions. They are similar to initialisers or constructors in other object-oriented languages, but they are also different.

When the compiler sees a call to an initialiser, it injects an allocation and then initialises the memory by calling the method. When a factory method is found inside a `struct`-like literal, the allocation has already been done to construct the instance, so it will not be necessary again. It will just call the factory method referring to the existing memory as `self`.

It is not technically a function that creates an `object`. It just defines the initial field-values of the internal `struct`.
