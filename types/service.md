# Service Types

A `service` is an `object` with special privileges. A simple `object` is an encapsulation of data. A `service` has access to system resources. It can produce side effects outside its allocated data. For example:

- File I/O operations
- Network requests
- Database connections
- System clock access
- Random number generation
- Logging/console output

Unlike an `object` or exposed `data` structure that exists to aggregate and manipulate specific information, the purpose of a `service` is to provide functionality such as persistence, networking and infrastructure.

To reinforce the conceptual difference, contractual types for services are segregated from contract types for `object`/`data` types. They use different terminology (even if they are implemented exactly the same way in the runtime).

A data-oriented structure conforms to `traits`, inherent characteristics that define how its fields can be read, modified and converted. A `service` takes on a `role`, a competence guarantee defining a set of tasks it is capable of performing.

| **Type Class**                    | **Conformance** | **Conceptual Semantics**  |
| --------------------------------- | --------------- | ------------------------- |
| `object`, `data`, `enum`, `union` | `trait`         | Inherent Characteristics  |
| `service`                         | `role`          | Functional Responsibility |

There is no significant runtime difference between an `object` and a `service` (nor a `data` structure for that matter). Nor is there any runtime difference between a `trait` and a `role`. Their differences are entirely conceptual (apart from privileges—which are enforced at compile-time).

## Restrictions

An `object` can be assigned to `let`, `mut` or `ref` variables as needed. It excels at maintaining isolation constraints using copy-on-write. A `service`, on the other hand, can only ever be *referenced*.

A `service` is an *entity*, not a *variable*. It is an *agent*, not a *data container.* It represents a system resource, not its own identity, and certainly not a “value.” Therefore, it is meaningless to copy-on-write a `service`. It is incoherent to refer to a `service` as immutable. A `service` variable can only be defined as `ref`. Its *configuration* might be immutable; it might reference copy-on-write *fields*. But the `service` itself must always apply reference semantics.

Additionally:

- `object` and `data` types cannot (or at least should not) contain `service` fields,
- `service` types can reference other services via `ref` fields.

```clawr
// Compiler error examples:
object Student {
data:
    ref logger: Logger  // ❌ Error: objects cannot reference services
}

service DatabaseService {
data:
    ref logger: Logger  // ✓ OK: services can reference other services
}
```

This ensures clear separation: domain objects remain pure data, while services handle infrastructure concerns.

## Dispose Method

Services will often need cleanup, e.g. closing a file handle. When a `service` is descoped (its last variable reference is released) it will call a `destruct()` or `deinit()` method to dispose of resources it alone has depended upon.
