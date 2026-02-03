# Clawr Semantics - Core Rules

**1. Two Semantic Worlds**

- **COW World**: `const` and `mut` - isolated, copy-on-write
- **Ref World**: `ref` - shared references

**2. No Cross-World Assignment**

```clawr
mut/const ← mut/const  ✓  // Share memory until mutation
ref ← ref              ✓  // Share memory always
mut/const ← ref        ✗  // Requires copy(...)
ref ← mut/const        ✗  // Requires copy(...)
```

**3. Simple Parameter Semantics**

```clawr
func f(x: T)      // Isolated immutable (implicit const)
func f(mut x: T)  // Isolated mutable
func f(ref x: T)  // Shared, mutable
```

**4. Explicit Return Semantics**

```clawr
func f() -> T      // Returns isolated value
func f() -> ref T  // Returns shared reference
```

**5. Services Are Always References**

```clawr
service Cache { }  // Always ref semantics, never copied
```

This gives you the flexibility you wanted - variable-level semantics choice - while maintaining clear boundaries and preventing dangerous aliasing bugs.

## Example 1: Configuration Management

```clawr
// A configuration object that should be shared globally
object AppConfiguration {
    func timeout() -> Duration => self.timeout
    func maxRetries() -> integer => self.maxRetries
    
mutating:
    func setTimeout(duration: Duration) {
        self.timeout = duration
    }

data:
    timeout: Duration
    maxRetries: integer
}

companion AppConfiguration {
    func default() { // implicit -> Self
        return {
            timeout: Duration.seconds(30)
            maxRetries: 3
        }
    }
}

// Service that holds shared configuration
service ConfigurationService {
    func getConfig() -> ref AppConfiguration {
        return self.config  // Returns shared reference
    }
    
    func updateTimeout(duration: Duration) {
        self.config.setTimeout(duration)
        // All references see this change immediately
    }

data:
    config: ref AppConfiguration
}

// Usage examples
service MyService {
    func doWork() {
        // Get shared reference - sees updates
        ref config = self.configService.getConfig()
        
        // Use timeout multiple times - always current value
        await withTimeout(config.timeout()) {
            await performTask()
        }
        
        // Later in same method, might have changed
        await withTimeout(config.timeout()) {
            await performAnotherTask()
        }
    }
    
    func doWorkWithSnapshot() {
        // Get isolated copy - stable snapshot
        const config = self.configService.getConfig()
        
        // This timeout never changes during this method
        await withTimeout(config.timeout()) {
            await performTask()
        }
        
        await withTimeout(config.timeout()) {
            await performAnotherTask()
        }
        // Both tasks use same timeout even if config changed
    }

data:
    configService: ref ConfigurationService
}
```

## Example 2: Event Sourcing Entities

```clawr
object User: Entity {
    func id() -> EntityId => self.id
    func version() -> EntityVersion => self.version
    func unpublishedEvents() -> [UnpublishedEvent] => self.pendingEvents
    func emailAddress() -> EmailAddress => self.emailAddress

mutating:
    func setEmailAddress(newEmail: EmailAddress) {
        guard newEmail != self.emailAddress or return
        
        // Append to pendingEvents
        // If self.pendingEvents is shared (RC > 1), it gets copied first
        self.pendingEvents.append({
            name: "EmailAddressChanged"
            details: JSON.serialize({ address: newEmail.value() })
        })
        
        self.emailAddress = newEmail
    }
    
    func apply(event: PublishedEvent) {
        match event.name {
            case "Registered" => {
                const details = JSON.deserialize<Registered>(event.details)
                self.username = details.username
                self.name = details.name
            }
            case "EmailAddressChanged" => {
                const details = JSON.deserialize<EmailAddressChanged>(event.details)
                self.emailAddress = EmailAddress.prevalidated(details.address)
            }
        }
    }

data:
    id: EntityId
    version: EntityVersion
    pendingEvents: [UnpublishedEvent]
    username: string
    name: string
    emailAddress: EmailAddress
}

companion User {
    func register(id: EntityId, name: string, emailAddress: EmailAddress) -> User {
        self = {
            id: id
            version: notPersisted
            username: id.value()
            name: name
            emailAddress: EmailAddress.prevalidated("")
            pendingEvents: []
        }
        
        self.pendingEvents.append({
            name: "Registered"
            details: JSON.serialize({ username: id.value(), name: name })
        })
        
        self.setEmailAddress(emailAddress)
    }
    
    func reconstituted(
        id: EntityId, 
        at version: PersistedEntityVersion, 
        from events: [PublishedEvent]
    ) -> User {
        self = {
            id: id
            version: version(version)
            username: ""
            name: ""
            emailAddress: EmailAddress.prevalidated("")
            pendingEvents: []
        }
        
        for event in events {
            self.apply(event)
        }
    }
}

// Usage in command handler
service SetEmailAddressHandler: CommandHandler<SetEmailAddress, Void> {
    async func handle(
        command: SetEmailAddress, 
        context: CommandContext
    ) throws -> Void | CommandError {
        
        // Load user - returns isolated COW value
        mut user = await context.entityStore.reconstitute<User>(
            TypedEntityId { 
                entityId: context.entityId, 
                entityType: "User" 
            }
        ) or match {
            case entityNotFound(_) => 
                return CommandError.notFound("User not found")
        }
        
        // Validate email
        const emailAddress = EmailAddress.of(command.emailAddress)
            or match {
                case invalidEmail(msg) => 
                    return CommandError.badRequest(msg)
            }
        
        // Mutate user - triggers copy if needed
        user.setEmailAddress(emailAddress)
        
        // Publish changes
        await context.entityStore.publishChanges([user], context.actor)?
    }
}
```

## Example 3: Collections with Mixed Semantics

```clawr
// A shopping cart that manages items
object ShoppingCart {
    func items() -> [CartItem] {
        // Returns copy of array
        // Caller can modify their copy without affecting this cart
        return self.items
    }
    
    func total() -> Decimal {
        return self.items.reduce(Decimal.zero) { sum, item in
            sum + item.price()
        }
    }

mutating:
    func addItem(item: CartItem) {
        // If self.items is shared (RC > 1), it gets copied first
        self.items.append(item)
    }
    
    func removeItem(at index: integer) {
        // If self.items is shared (RC > 1), it gets copied first
        self.items.remove(at: index)
    }

data:
    items: [CartItem]
}

companion ShoppingCart {
    func empty() -> ShoppingCart {
        return { items: [] }
    }
}

// Usage showing different collection semantics
service CheckoutService {
    func processOrder(cart: ShoppingCart) {
        // cart is isolated copy - stable during processing
        
        // Get items - another copy
        const items = cart.items()
        
        // Process each item
        for item in items {
            // item is also a copy
            processItem(item)
        }
        
        // Cart and items remain unchanged during processing
        const finalTotal = cart.total()
    }
    
    func reviewCart(ref cart: ShoppingCart) {
        // cart is shared reference - sees live updates
        
        // Get snapshot of items for review
        const itemsSnapshot = cart.items()
        
        // Meanwhile, cart might be modified by user...
        // But itemsSnapshot remains stable
        
        for item in itemsSnapshot {
            reviewItem(item)
        }
    }
}
```

## Example 4: Caching with References

```clawr
// Cache service that maintains shared references
service UserCache {
    func get(userId: EntityId) -> ref User? {
        return self.cache[userId]
        // Returns reference to cached user
    }
    
    func set(userId: EntityId, user: User) {
        // Store as reference so all callers share the same instance
        self.cache[userId] = user
    }
    
    func invalidate(userId: EntityId) {
        self.cache.remove(userId)
    }

data:
    cache: Dictionary<EntityId, ref User>
}

// Usage
service UserService {
    func getUser(userId: EntityId) async -> User | UserNotFound {
        // Try cache first - returns reference if found
        if const ref cachedUser = self.cache.get(userId) {
            // Return copy for isolation
            return cachedUser
        }
        
        // Load from database
        const user = await self.repository.load(userId)
            or return userNotFound(userId)
        
        // Cache it (stores reference)
        self.cache.set(userId, user)
        
        return user
    }
    
    func getUserRef(userId: EntityId) async -> ref User | UserNotFound {
        // Return shared reference from cache
        if const ref cachedUser = self.cache.get(userId) {
            return cachedUser
        }
        
        const user = await self.repository.load(userId)
            or return userNotFound(userId)
        
        self.cache.set(userId, user)
        
        // Return reference to cached instance
        return self.cache.get(userId)!
    }

data:
    cache: ref UserCache
    repository: ref UserRepository
}
```

## Example 5: Builder Pattern with Mutation

```clawr
// Builder that accumulates configuration
object QueryBuilder {
    func build() -> Query {
        return {
            table: self.table
            conditions: self.conditions
            orderBy: self.orderBy
            limit: self.limit
        }
    }

mutating:
    func table(name: string) -> ref Self {
        self.table = name
        return self
    }
    
    func where(condition: Condition) -> ref Self {
        self.conditions.append(condition)
        return self
    }
    
    func orderBy(field: string, direction: Direction) -> ref Self {
        self.orderBy = (field, direction)
        return self
    }
    
    func limit(count: integer) -> ref Self {
        self.limit = count
        return self
    }

data:
    table: string
    conditions: [Condition]
    orderBy: (string, Direction)?
    limit: integer?
}

companion QueryBuilder {
    func new() -> QueryBuilder {
        return {
            table: ""
            conditions: []
            orderBy: null
            limit: null
        }
    }
}

// Usage patterns
func example1() {
    // Fluent API with shared reference
    mut builder = QueryBuilder.new()
    
    builder
        .table("users")
        .where({ field: "age", op: greaterThan, value: 18 })
        .orderBy("name", ascending)
        .limit(10)
    
    const query = builder.build()
}

func example2() {
    // Separate steps with copies
    const builder1 = QueryBuilder.new()
    
    const builder2 = builder1.table("users")
    // builder1 is unchanged (was copied before mutation)
    
    const builder3 = builder2.where({ field: "age", op: greaterThan, value: 18 })
    // builder2 is unchanged
    
    const query = builder3.build()
}

func example3() {
    // Shared builder modified by multiple functions
    mut builder = QueryBuilder.new()
    
    addUserFilters(ref builder)
    addSorting(ref builder)
    addPagination(ref builder)
    
    const query = builder.build()
}

func addUserFilters(ref builder: QueryBuilder) {
    builder
        .table("users")
        .where({ field: "active", op: equals, value: true })
}
```

## Example 6: Nested Structure Mutations

```clawr
data Address {
    street: string
    city: string
    country: string
}

object Person {
    func name() -> string => self.name
    func address() -> Address => self.address

mutating:
    func updateAddress(address: Address) {
        self.address = address
    }
    
    func updateCity(city: string) {
        // Nested mutation: triggers copies if needed
        // 1. If self is shared (RC > 1), copy self
        // 2. If self.address is shared (RC > 1), copy address
        self.address.city = city
    }

data:
    name: string
    address: Address
}

companion Address {
    func new(name: string, address: Address) -> Person {
        return { name: name, address: address }
    }
}

// Usage demonstrating copy-on-write cascade
func demonstrateNestedCOW() {
    mut person1 = Person.new("Alice", {
        street: "123 Main St"
        city: "Portland"
        country: "USA"
    })
    
    // Share person1
    ref person2 = person1
    // Both person1 and person2 point to same Person
    // RC(person1 data) = 2
    
    // Mutate person1's city
    person1.updateCity("Seattle")
    // Triggers:
    // 1. Copy person1 (because RC > 1)
    // 2. Copy person1.address (because it's shared with person2)
    // 3. Update city on the copied address
    
    // Now:
    // person1 points to new Person with new Address
    // person2 still points to original Person with original Address
    
    assert(person1.address().city == "Seattle")
    assert(person2.address().city == "Portland")
}
```

## Key Patterns Summary

1. **Shared Configuration**: Use `ref` returns for global config that all services should see updates to
2. **Entity Snapshots**: Use isolated returns for entities to ensure transactional consistency
3. **Collections**: Always copy collections themselves, even if elements are references
4. **Caching**: Store references in cache, return copies to callers for isolation
5. **Builders**: Return `ref Self` from mutating methods for fluent APIs
6. **Nested Mutations**: Automatically cascade copy-on-write through nested structures
