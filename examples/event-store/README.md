# CQRS / Event Sourcing Library

`Segerfeldt.EventStore` is a family of NuGet packages designed for CQRS systems with event sourcing. This is an exploration of how the same libraries could be implemented in Clawr.

## Generic Architecture

CQRS systems segregate state manipulation (commands, write model) from state examination (queries, read model). The read model is typically a very simple model of database queries and data structures. The write model should be a rich model with encapsulated objects that ensure always valid state and fail-fasts invalid actions.

Event sourcing means that the state of the system (the “truth”) is defined by lists of state *changes* that have occurred to the *entities* in the system.

The `EventStore` library is made up of two essential parts:

1. **Source**: the command/write model is the “source of truth.” This is where the events are generated and *published*.
2. **Projection**: a single-direction syncing service that polls for new changes in the write model and updates a read-model database.

The actual read model is defined by the developer. The projection library could be used to update multiple models with different foci and different structures.

The events can also be used for debugging and auditing. And maybe other use cases I have not thought of.

## The Common Protocol

The system is based on two SQL tables: `entities` and `events`. The tables can be maintained by any database provider. [^providers] Here is their definition in SQLite syntax:

[^providers]: Built in support exists for SQL Server, MySQL, PostgreSQL and SQLite, but custom adapters are also allowed.
```sqlite
CREATE TABLE IF NOT EXISTS Entities (
    id TEXT NOT NULL,
    type TEXT NOT NULL,
    version INT NOT NULL,

    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS Events (
    entity_id TEXT NOT NULL,
    name TEXT NOT NULL,
    details TEXT NOT NULL,
    actor TEXT NOT NULL,
    timestamp DECIMAL(12,7) DEFAULT (JulianDay(CURRENT_TIMESTAMP) - 2440587.5),
    ordinal INT NOT NULL,
    position BIGINT NOT NULL
);
```

The `Entities` table contains two properties: a `type` that can be used to runtime type checking, and an incrementing `version` number that is used for optimistic concurrency.

When the write model wants to modify an entity, it reads the current version number, and when the new state is persisted, the operation fails if the stored version number has changed (due to concurrent updates).

The `Events` table contains the application state. Each event applies to a specific entity. It has a `name` that identifies the type of change that occurred (`NameChanged`, `InviteAccepted`…) and a `details` JSON structure that identifies the specifics of the change. Each `name` identifies a particular `details` structure.

The `ordinal` specifies the order (low to high) to apply the events to the entity, and the `position` is a global position identifying which events (maybe spanning multiple entities) that were published together (e.g. by the same HTTP request). Positions are ordered so that a client can consistently request the events that have been published after the last handled position.

The `actor` is persisted for auditing purposes. The `timestamp` is based on the Unix Epoch (number of days since midnight on Jan 1 1970).

### Projections Table

There is also an optional table for the projection side:

```sqlite
CREATE TABLE IF NOT EXISTS Projections (
    source TEXT PRIMARY KEY,
    position BIGINT
)
```

This persists the current state of the sync so that the projection service can be restarted for updates—or after crashes—without having to repopulate the database from scratch.

This might or might not be considered part of the protocol. The C# implementation contains functionality that creates this table and populates it automatically with the latest handled position of each write model. [^multiple]

[^multiple]: Projections may subscribe to multiple sources to generate a combined read model. It is only recommended if it can segregate the two truths in separate systems of tables, though.
