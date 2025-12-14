# Segerfeldt.EventStore.Projection in Clawr

In an event-sourced system, the state is defined by the changes that have been performed. The smallest unit of change is called an `Event`. Each event applies to an `Entity` and the combined state of all entities is the current state of the system.

Event sourcing allows us to know the state of the system at any point in the past (and, of course, the current state right now). If we filter the events, we can choose to focus only on some entities or only on some aspects of their state.

We can use this state information for several things, including debugging and auditing. The most obvious use case, however, is to track the current state in a more searchable form—a  read model.

> [!note] Command/Query Responsibility Segregation (CQRS)
> CQRS separates the an application in two parts with little-or-no shared code. The command-side (write model) is the information gatherer. It enforces the rules of the business and ensures that only valid/allowed state changes are applied.
>
> The query-side (read model) is much simpler: it only has to read current-state data. If the read model uses a different database from the write model, it can be replicated in the thousands to serve millions (or billions even) of users on different continents without latency.

## Event — The Unit of State

In an event-sourced system, the state is defined by the changes that have been performed. The smallest unit of change is called an `Event`. Each event applies to an `Entity` and the combined state of all entities is the current state of the system.

```clawr
data Event {
    entityId: string
    entityType: string
    name: string
    details: string  // JSON
    ordinal: integer
    position: integer
}
```

> [!note]
> The write model includes an `Entity` `trait` that is implemented by `object` types to encapsulate state and enforce correct updates. The projection (read-model) side does not need to model the `Entity` as a first-order entity.

## Event Source — Emitter of Events

The `EventSource` service repeatedly polls an event-sourcing database (the “source of truth”) for new events. Those events are sent to *receptacles.* A `Receptacle` is a `service` that collects the event information and translates it to fit its purpose.

You can subscribe to multiple sources. Each source database would need its own `EventSource` instance. The instances can be configured independently.

```clawr
service EventSource {
    
    // Start continuous projection
    func beginProjecting() {
        self.pollEventsTable()
    }
    
    helper func pollEventsTable() {
        // Cancel any pending delay
        self.currentDelay?.cancel()

        // Poll once
        let numNotified = self.pollEventsTableOnce()

        // Schedule next poll based on whether events were found
        let nextDelay = self.pollingStrategy.nextDelay(numNotified)
        self.currentDelay = Timer.after(nextDelay) {
            self.pollEventsTable()
        }
    }

    func pollEventsTableOnce() -> integer {
        let lastPosition = self.tracker.getLastFinishedPosition() ?? -1
        let unsortedEvents = await self.repository.getEvents(
            since: lastPosition,
            maxCount: pollingStrategy.batchSize()
        )

        return self.emit(unsortedEvents)
    }

    // Emit events, handling incomplete batches
    func emit(unsortedEvents: [ProjectionEvent]) -> integer {
        mut eventGroups = self.groupByPosition(unsortedEvents)

        // CRITICAL: If batch is full, last position might be incomplete
        let totalCount = eventGroups.flatCount(g => g.events)
        if (totalCount >= pollingStrategy.batchSize())
            eventGroups.removeLast()

        for (position, events) in eventGroups {
            // Notify the start of a position
            // This could for example start a database transaction
            self.tracker.onProjectionStarting(position)

            try {
                // Emit this position
                for (event in events) self.emitEvent(event)
                // Notify that the emitted batch was successful
                // This should commit the transaction.
                self.tracker.onProjectionFinished(at: position)
            } catch error {
                // Notify that something went wrong in this batch
                // This should rollback the transaction.
                // And maybe trigger an alert.
                self.tracker.onProjectionError(position)
            }
        }

        return eventGroups.flatCount(g => g.events)
    }
    
    // Group events by position, sorted
    helper func groupByPosition(
        events: [ProjectionEvent]
    ) -> [(position: integer, events: [ProjectionEvent])] {
        
        // Group and sort by position
        let groups = events
           .group(by: event => event.position)
           .sorted(by: group => group.key)

        // Sort events within each group by ordinal
        return sortedGroups.map((position, events) =>
            let sortedEvents = events.sorted(by: event => event.ordinal)
            return (position: position, events: sortedEvents)
        })
    }
    
    helper func emitEvent(event: ProjectionEvent) {
        let receptacles = self.receptacles.getReceptacles(event.name)
        // SYNTAX: Can `ref` be implicit here?
        for (ref receptacle in receptacles) {
            receptacle.update(event)
        }
    }

factory: // TODO: SYNTAX: Rename? To `init:` or `factories:`?

    func prepare(
        repository: EventSourceRepository,
        receptacles: ReceptacleCollection,

        // SYNTAX: Optional parameters (default to `null`)
        [tracker]: ref ProjectionTracker?,
        // SYNTAX: This parameter creates a strategy if not specified
        [pollingStrategy]: ref PollingStrategy or DefaultPollingStrategy.new()
    ) => {
		repository: repository
		receptacles: receptacles
		tracker: tracker ?? NothingTracker()
		pollingStrategy: pollingStrategy
	}

    func startPolling(
        repository: EventSourceRepository,
        receptacles: ReceptacleCollection,
        [tracker]: ref ProjectionTracker?,
        [pollingStrategy]: ref PollingStrategy?
    ) {
        self = {
	        prepare(
                repository: repository
                receptacles: receptacles
                tracker: tracker
                pollingStrategy: pollingStrategy
            )
        }

        pollEventsTable()
    }

data:
    repository: ref EventSourceRepository
    receptacles: ReceptacleCollection
    tracker: ref ProjectionTracker?
    pollingStrategy: ref PollingStrategy
    currentDelay: Timer?
}
```

### Roles and Default Service Implementations

```clawr
// Implement to update your read model
role Receptacle {
    // Which events does this receptacle handle?
    func acceptedEvents() -> [string]
    
    // Update read model database based on event
    func update(event: ProjectionEvent) throws
}

// Implement to configure polling frequency
role PollingStrategy {
    // The maximum number of events to fetch in eacxh batch
    func batchSize() -> integer @range(1..65_535)

    // Delay to next poll
    /// @param numNotified: the number of notified events in the last poll
    func nextDelay(numNotified: integer) -> Duration
}

service DefaultPollingStrategy: PollingStrategy {
    func batchSize() => 100

    func nextDelay(eventCount: integer) -> Duration {
        // If no events found, wait longer
        return eventCount == 0 
            ? Duration.seconds(60)
            : Duration.seconds(1)
    }
}

// Implement to persist the current position so that projection
// can resume after a server restart
role ProjectionTracker {
    func getLastFinishedPosition() -> integer?
    func onProjection(starting position: integer)
    func onProjection(finished position: integer)
    func onProjectionError(at position: integer)
}
```

## ReceptacleCollection — a Routing Table

```clawr
object ReceptacleCollection {
    
    func getReceptacles(eventName: string) -> [ref Receptacle] {
        return self.receptacles[eventName] ?? []
    }

mutating:

    func add(_ receptacle: Receptacle) {
        for (eventName in receptacle.acceptedEvents()) {
			if (eventName in receptacles)
				receptacles[eventName].append(receptacle)
			else
				receptacles[eventName] = [receptacle]
        }
    }

    func remove(_ receptacle: Receptacle) {
        for (eventName in receptacle.acceptedEvents())
			receptacles[eventName].remove(receptacle)
    }

factory:

    func from(receptacles: [ref Receptacle]) -> ReceptacleCollection {
        self = { receptacles: Dictionary.empty() }        
        for (receptacle in receptacles) add(receptacle)
    }

data:
    receptacles: Dictionary<string, [ref Receptacle]>
}
```

## AtomicSQLiteProjectionTracker

Use database transactions to employ an all-or-nothing approach to each projected position.

```clawr
service AtomicSQLiteProjectionTracker embodies ProjectionTracker {
    func getLastFinishedPosition() -> integer? {
        let result = await self.database.queryOne(
            "SELECT position FROM Projections WHERE source = ?",
            self.sourceName
        )
        return result?.position
    }
    
    func onProjectionStarting(position: integer) {
        // Start a transaction shared with receptacles
        transaction = database.beginTransaction()
    }
    
    async func onProjectionFinished(position: integer) throws {
        await self.database.execute(
            """
            INSERT INTO Projections (source, position) 
            VALUES (?, ?)
            ON CONFLICT(source) DO UPDATE SET position = excluded.position
            """,
            self.sourceName, position
        )
        // Commit the transaction persisting all changes performed by
        // the receptacles
        database.commitTransaction()
    }
    
    func onProjectionError(position: integer) {
        // Rollback the transaction aborting all changes performed by
        // receptacles for this position
        database.rollbackTransaction()
        log.error("Failed to project position \(position)")
        // Maybe notify an alert system so that an engineer can fix the problem
    }

data:
    database: ref TargetDatabase
    sourceName: string
}
```
