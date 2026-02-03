# Special Characters Naming Strategy

C does not support namespaces or object methods. Everything is a “free function.” We can use a naming strategy to indicate their categorisation.

Key strategy: Use special characters that are unlikely to be used in identifiers, but still legal for C names. We should probably also make them illegal in Clawr identifiers.

### Suggestion:

For methods and namespaced members:

`c_name := type_or_namespace , separator , member name`

- ˇ (⇧⌥X on Swedish Mac keyboard): Runtime structures such as `type_info`, `vtable`, …
- ¸ (⌥G): Namespace (“static”) members
- ˛ (⌥H): Inheritance initialiser
- · (⇧⌥.): Instance method

### Sample code:

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
extern const __type_info Prismˇtype;

// Initializer for inheriting types
void Prism˛new_height(Prism* self, double height);

// Instance method
double Prism·volume(Prism* self);

// Inheritance subtype
typedef struct RectBlock {
    __rc_header header;
    Prism super; // Layout the super-type data
    double width;
    double depth;
} RectBlock;

// Runtime type info
static __type_info RectBlockˇtype;

// Instance method (vtable implementation)
double RectBlock·area(void* self);

// Factory method in RectBlock namespace
RectBlock* RectBlock¸new_width_depth_height
        (double width, double depth, double height);
```

```c
// Abstract object type
typedef struct Prism {
    __rc_header header;
    int height;
} Prism;

// Runtime vtable
typedef struct Prismˇvtable {
    int (*area)(void* self);
} Prismˇvtable;

// Tuntime type info
static const __type_info Prismˇtype = {
    .polymorphic_type = {
        .data = { .size = sizeof(Prism) },
        .super = NULL,
    }
};

// Initializer for inheriting types
void Prism˛new_height(Prism* self, int height);

// Instance method
int Prism·volume(Prism* self);

// Inheritance subtype
typedef struct RectBlock {
    __rc_header header;
    Prism super;
    int width;
    int depth;
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
int RectBlock·area(void* self) {
    RectBlock* rect = (RectBlock*) self;
    return rect->width * rect->depth;
}

// Factory method in RectBlock namespace
RectBlock* RectBlock¸new_width_depth_height(int width, int depth, int height) {
    // const self = RectBlock { Prism.new(height: height), width, depth }
    RectBlock* self = allocRC(RectBlock, __rc_ISOLATED);
    self->width = width;
    self->depth = depth;
    Prism˛new_height((Prism*)self, height);
    return self;
}
```
