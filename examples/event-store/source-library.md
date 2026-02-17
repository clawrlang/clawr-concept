# EventStore Library in Clawr

## Command Handler Infrastructure

```clawr
// Command context provided to handlers
data CommandContext {
    entityId: EntityId
    actor: string
    frameworkContext: ref any
    entityStore: ref EntityStore
}

// In adapter library:
extension CommandContext {
  func aspNetHttpContext() => self.frameworkContext as HttpContext
	  or fatalError("Not properly configured for ASP .Net Web API.")
}

// Command result types
// TODO: These are named for HTTP statuses. Should
// they be renamed to something HTTP agnostic?
union CommandError {
    case badRequest(reason: string)
    case unauthorized(reason: string) // authenticationFailed?
    case forbidden(reason: string) // accessDenied?
    case notFound(reason: string) // unknownEntity?
    case conflict(reason: string)
}

// Use CommandHandler<Command, Void> to return 204 No Nontent when successful
// NOTE: Void type should be syntactically equivalent to `void` in C,
// and be stored as `0` in memory (null pointer) at runtime.

role CommandHandler<TCommand, TResult> {
    async func handle(command: TCommand, context: CommandContext) throws
        -> TResult | CommandError
}
```

## Core Entity Definition

```clawr
typealias EntityId = string @matches(/^[a-zA-Z0-9_-]+$/)
typealias TypeId = string @matches(/^[a-zA-Z0-9._-]+$/)
typealias PersistedEntityVersion = integer @range(0..2_147_483_647)

union EntityVersion {
    case notPersisted
    case version(PersistedEntityVersion)
}

// Event stored in database
data PublishedEvent {
    entityId: EntityId
    name: string
    details: string // JSON
    actor: string
    timestamp: DateTime
    ordinal: integer
    position: integer
}

// Event pending publication
data UnpublishedEvent {
    name: string
    details: string // JSON
    // No metadata until the event is published
}

trait Entity {
    id() -> EntityId
    version() -> EntityVersion
    unpublishedEvents() -> Sequence<UnpublishedEvent>

companion:
    func reconstituted(
        id: EntityId,
        at version: PersistedEntityVersion,
        events: Sequence<PublishedEvent>
    ) -> Self

    func entityType() -> TypeId
    // TODO: Is it possible to add constants to a vtable?
    // const entityType: TypeId
}

extension Entity {
    // Default implementation. Can be overridden for performance if needed.
    func hasChanges() => !self.unpublishedEvents().isEmpty()
}
```

## Entity Store Service

```clawr
service EntityStore {

    async func reconstitute<TEntity: Entity>(id: TypedEntityId) throws
            -> TEntity | EntityNotFound {

        const events = await loadHistory(id.entityId, id.entityType)
            or return entityNotFound(id.entityId)
        return TEntity.reconstitute(id.entityId, at: history.version, from: history.events)
    }
    
    async func loadHistory(entityId: EntityId, entityType: string) throws
        -> (PersistedEntityVersion, [PublishedEvent])
    {
        // TODO: This probably needs some technical shenanigans
        // It is meant to run two SELECT statements in one roundtrip
        return await query(
            "SELECT version FROM Entities WHERE id = ?;
            SELECT * FROM Events WHERE entity_id = ? ORDER BY ordinal",
            entityId, entityId
        )
    }
}
```

## Event Publishing Service

```clawr
service EventPublisher {
    
    // Publish changes from multiple entities atomically
    async func publishChanges(
        in entities: Collection<Entity>,
        as actor: string
    ) throws -> Void | ConcurrencyConflict {
        
        const transaction = await database.beginTransaction()
        defer { transaction.rollback() }
        
        // Get next global position
        const position = await getNextPosition()
        
        // Save each entity's events
        for entity in entities {
            guard entity.hasChanges() or continue

            const events = entity.unpublishedEvents()

            // Check version
            // Get both version and max ordinal in one query
            const (currentVersion, maxOrdinal) = await getVersionAndMaxOrdinal(entity.id())

            guard currentVersion == entity.version() 
                or return concurrencyConflict(
                    entity.id(), 
                    entity.version(), 
                    currentVersion
                )
            
            match entity.version() {
                case notPersisted => {
                    await insertEntity(entity.id(), entity.entityType(), version: 0)
                }
                case version(expectedVersion) => {
                    guard currentVersion == expectedVersion 
                        or return concurrencyConflict(
                            entity.id(), 
                            expectedVersion, 
                            currentVersion
                        )
                }
            }
            
            // Insert events
            // Start ordinal from max existing ordinal
            mut ordinal = maxOrdinal
            for event in events {
                ordinal += 1
                await insertEvent(
                    entityId: entity.id(),
                    name: event.name,
                    details: event.details,
                    actor: actor,
                    ordinal: ordinal,
                    position: position
                )
            }
            
            // Version increments by 1
            await updateVersion(entity.id(), newVersion: currentVersion + 1)
        }
        
        await transaction.commit()
    }
    
    async helper func getVersionAndMaxOrdinal(entityId: EntityId) 
        throws -> (integer, integer)?
    {
        // Single roundtrip query
        const result = await queryOne(
            """
            SELECT 
                e.version, -- NULL if not exists
                COALESCE(MAX(ev.ordinal), -1) as max_ordinal
            FROM Entities e
            LEFT JOIN Events ev ON ev.entity_id = e.id
            WHERE e.id = ?
            GROUP BY e.version
            """,
            entityId
        )
        
        guard result or return null
        
        return (result.version, result.max_ordinal ?? -1)
    }
}
```

## Domain: Email-Address Value Object

This entire type could be replaced with `subset EmailAddress = string @matches(/^[^@]+@[^@]+\.[^@]+$/)`, but we'd lose the domain error—and the `prevalidated()` factory.

```clawr
object EmailAddress {
    func value() -> string => self.value

data:
    // This is a value object (immutable) so its data must not change
    const value: string
    // Though `const` might be redundant here. If there are no `mutating`
    // methods, the value cannot change anyway.
}

companion EmailAddress {
    func of(input: string) -> EmailAddress | InvalidEmail {
        guard input.matches(/^[^@]+@[^@]+\.[^@]+$/) 
            or return invalidEmail("Invalid email format")
        
        const normalized = input.lowercase()
        return { value: normalized }
    }

    // For reconstruction from events (already validated)
    func prevalidated(input: string) -> EmailAddress {
        return { value: input }
    }
}

union EmailError {
    case invalidEmail(string)
}

typealias InvalidEmail = EmailError @case(invalidEmail)
```

## Domain: EmailAddress Availability (Singleton Entity)

```clawr
// Event details for EmailAddressAvailability
data EmailAddressDetails
{
   emailAddress: string
}

// The singleton entity
object EmailAddressAvailability: Entity {
    
    func id() => EmailAddressAvailability.singletonId
    func version() => self.version
	func unpublishedEvents() => self.pendingEvents

    // Query methods
    func isAvailable(email: EmailAddress) -> boolean {
        return !self.usedAddresses.contains(email)
    }

mutating:

    // Domain operation: Claim email address
    func claim(email: EmailAddress) -> Void | EmailAlreadyClaimed {
        guard self.isAvailable(email)
            or return emailAlreadyClaimed(email)

        const details: EmailAddressDetails = {
            emailAddress: email.value()
        }
        pendingEvents.append({
            name: "EmailAddressClaimed"
            details: details
        })
    }
    
    // Domain operation: Release email address
    func release(email: EmailAddress) {
        const details: EmailAddressDetails = {
            emailAddress: email.value()
        }
        pendingEvents.append({
            name: "EmailAddressReleased"
            details: details
        })
    }
    
    // Apply events - mutates self
    func apply(event: PublishedEvent) {
        match event.name {
            case "EmailAddressClaimed" => {
                const details = JSON.deserialize<EmailAddressDetails>(event.details)
                self.usedAddresses.add(
                    EmailAddress.prevalidated(details.emailAddress))
            }
            case "EmailAddressReleased" => {
                const details = JSON.deserialize<EmailAddressDetails>(event.details)
                self.usedAddresses.remove(
                    EmailAddress.prevalidated(details.emailAddress))
            }
        }
    }

data:
    version: EntityVersion
    usedAddresses: Set<EmailAddress>
    pendingEvents: [UnpublishedEvent]
}

companion EmailAddressAvailability {
    const singletonId = EntityId.of("email-availability")
    func entityType() => "EmailAddressAvailability"

    func empty() -> EmailAddressAvailability {
        return {
            version: notPersisted,
            pendingEvents: []
            usedAddresses: Set.empty()
        }
    }
    
    func reconstitute(_ id: EntityId, at version: PersistedEntityVersion, from events: [PublishedEvent]) 
        -> EmailAddressAvailability {
        self = {
            id: id
            pendingEvents: []
            version: version
        }
        
        for event in events {
            apply(event)
        }
    }

    // Get or create singleton
    async func get(ref entityStore: EntityStore) throws
            -> EmailAddressAvailability {
        const typedId = TypedEntityId {
            entityId: EmailAddressAvailability.singletonId,
            entityType: "EmailAddressAvailability"
        }
        
        match entityStore.reconstitute<EmailAddressAvailability>(typedId) {
            case success(entity) => return entity
            case entityNotFound(_) => {
                return EmailAddressAvailability.empty()
            }
        }
    }
}

union AvailabilityError {
    case emailAlreadyClaimed(EmailAddress)
}

typealias EmailAlreadyClaimed = AvailabilityError @case(emailAlreadyClaimed)
```

## Domain: User Entity

```clawr
// User event details
data Registered {
    username: string
    name: string
}

data EmailAddressChanged {
    address: string
}

object User: Entity {
    func id() => self.id
    func version() => self.version
    func unpublishedEvents() => self.pendingEvents

    // State accessors only if needed
    func username() => self.username
    func emailAddress() => self.emailAddress

mutating:
    func setEmailAddress(newEmail: EmailAddress) {
        guard newEmail != self.emailAddress or return // no error and no change

        const details: EmailAddressChanged = {
            address: newEmail.value()
        }
        pendingEvents.append({
            name: "EmailAddressChanged"
            details: JSON.serialize(details)
        })
    }

    // Apply mutates self directly - only called during reconstitution
    func apply(event: UserEvent) {
        match event {
            case "Registered" => {
                const details = JSON.deserialize<Registered>(event.details)
                self.username = details.username
                self.name = details.name
            }
            case "EmailAddressChanged" => {
                const details = JSON.deserialize<EmailAddressDetails>(event.details)
                self.emailAddress = EmailAddress.prevalidated(details.emailAddress)
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
    func entityType() => "User"

    // Register a new User
    func register(id: EntityId, name: string, emailAddress: EmailAddress) {
        self = {
            id: id
            version: notPersisted
            name: name
            emailAddress: EmailAddress.prevalidated("")
            pendingEvents: [{
                name: "Registered",
                details: JSON.serialize(Register {
	                username: id.value()
	                name: name
	            })
            }]
        }
        
        self.setEmailAddress(emailAddress)
    }

    // Efficient reconstitution - single allocation, in-place mutations
    func reconstitute(id: EntityId, at version: PersistedEntityVersion, from events: [PublishedEvent]) -> User {
        self = {
            id: id,
            version: 0,
            username: "",
            name: "",
            emailAddress: EmailAddress.prevalidated("")
        }
        
        for event in events {
            apply(event)
        }
    }
}
```

## Command: Set Email-Address

```clawr
// Command DTO
data SetEmailAddress {
    emailAddress: string
}

// Command handler
service SetEmailAddressHandler: CommandHandler<SetEmailAddress, Void> 
{
    async func handle(
        command: SetEmailAddress, 
        context: CommandContext
    ) throws {
        
        // Validate command
        const emailAddress = EmailAddress.of(command.emailAddress)
            or match {
                case (message) => return CommandResult.badRequest(message)
            }
        
        // Load entities
        mut availability = EmailAddressAvailability.get(context.entityStore)?
        mut user = context.entityStore.load<User>(
            context.entityId,
            "User"
        ) or match {
            case entityNotFound(_) => 
                return CommandResult.notFound("User not found")
        }
        
        // Execute domain operations - events tracked automatically!
        availability.claim(emailAddress)
            or match {
                case emailAlreadyClaimed(email) => 
                    return CommandResult.forbidden("Email \(email.value()) already claimed")
            }
        
        user.setEmailAddress(emailAddress)
            or match {
                case invalidOperation(msg) => 
                    return CommandResult.badRequest(msg)
            }
        
        // Publish all changes atomically
        await context.entityStore.publishChanges(
            [availability, user],
            context.actor
        )?
    }
}
```
