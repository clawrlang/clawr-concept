# Special Characters Naming Strategy

C does not support namespaces or object methods. Everything is a “free function.” We can use a naming strategy to indicate their categorisation.

Key strategy: Use special characters that are unlikely to be used in identifiers, but still legal for C names. We should probably also make them illegal in Clawr identifiers.

### Suggestion:

For methods and name-spaced members:

```ebnf
c_name := type_or_namespace , separator , member_name
separator := "ˇ" | "¸" | "˛" | "·"
```

- ˇ (⇧⌥X): Runtime structures such as `type_info`, `vtable`, …
- ¸ (⌥G): Namespace (“static”) members
- ˛ (⌥H): Inheritance initialiser
- · (⇧⌥.): Instance method

(This scheme is currently employed in the [runtime PoC](https://github.com/clawrlang/clawr-runtime).)

> [!note]
> The keyboard shortcuts listed above apply to Swedish-language Mac keyboards. Your setup might require other methods for replicating the corresponding characters. (If you at all need them.)

### Sample code:

In this context, a *prism* is defined as a 3D figure with an irregular base and straight, parallel sides. A horizontal cut (parallel to the base) at any altitude will yield the exact same 2D cross section.

```clawr
// Syntax pending

abstract object Prism {

    abstract func area() -> real
    func volume() => self.area() * self.height

inheritance: func new(height: real) => { height }
data: height: real
}

object RectBlock: Prism {
    func area() => self.width * self.depth
data:
    width: real
    depth: real
}

namespace RectBlock {
    new(width: real, depth: real, height: real) => {
        Prism.new(height: height)
        width, height
    }
}
```

### The corresponding C structures

```c
// Abstract object type
typedef struct Prism {
    __rc_header header;
    double height;
} Prism;

// Runtime vtable
typedef struct Prismˇvtable {
    double (*area)(void* self);
} Prismˇvtable;

// Runtime type info
static const __type_info Prismˇtype = {
    .polymorphic_type = {
        .data = { .size = sizeof(Prism) },
        .super = NULL,
    }
};

// Initializer for inheriting types
void Prism˛new_height(Prism* self, double height) {
    self->height = height;
}

// Instance method
double Prism·volume(Prism* self) {
    return area(self) * self->height;
}

// Inheritance subtype
typedef struct RectBlock {
    __rc_header header;
    Prism super;
    double width;
    double depth;
} RectBlock;

// Runtime type info
static __type_info RectBlockˇtype = {
    .polymorphic_type = {
        .data = { .size = sizeof(RectBlock) },
        .super = &Prismˇtype.polymorphic_type,
        .vtable = &(Prismˇvtable) {
            .area = RectBlock·area,
        },
    }
};

// Instance method (vtable implementation)
double RectBlock·area(void* self) {
    RectBlock* rect = (RectBlock*) self;
    return rect->width * rect->depth;
}

// Factory method in RectBlock namespace
RectBlock* RectBlock¸new_width_depth_height(double width, double depth, double height) {
    // const self = RectBlock { Prism.new(height: height), width, depth }
    RectBlock* self = allocRC(RectBlock, __rc_ISOLATED);
    self->width = width;
    self->depth = depth;
    Prism˛new_height((Prism*)self, height);
    return self;
}
```
