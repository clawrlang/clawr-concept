# Generated C code

From this Azlan code:
```azlan
struct Struct { value: integer }

ref x: Struct = { value: 42 }
ref y = x
x.value = 2
print y.value
print x.value
```

…we write the following C code:

```c
#include "az_stdlib.h"
#include "az_runtime.h"

struct __Struct_data { int64_t value; };
typedef struct Struct {
    struct AZ_Header header;
    struct __Struct_data Struct;
 } Struct;

AZ_TypeInfo __Struct_info = {.size = sizeof(Struct)};

int main() {
//        ref x: Struct = { value: 42 }
    Struct* x = az_alloc(AZ_REFERENCE, &__Struct_info);
    x->Struct.value = 42;

//        ref y = x
    Struct* y = az_retain(&x->header);

//        x.value = 2
    x = az_preModify(&x->header);
    x->Struct.value = 2;

//        print y.value
    printInteger(y->Struct.value);
//        print x.value
    printInteger(x->Struct.value);

    x = az_release(&x->header);
    y = az_release(&y->header);
    return 0;
}
```

What does this do?

First of all, the `struct Struct` is directly translated to a C `struct __Struct_data`. This is not the type that the variable will have. Instead it will use a wrapping `struct Struct` that *contains* the data, but only after an `AZ_Header`.

The header tracks how many variables reference the `Struct` as well as dsome other metadata. When a new variable is assigned to the same memory, the reference count is incremented. When one is reassigned, the value is decremented. When the value reaches `0`, the memory is freed to the operating system.

The header also contains a flag that declares the *semantics* of the entity. It can use `SHARED` or `ISOLATED` semantics. `ISOLATED` means that each variable makes changes to its own data in isolation. No changes to `x` is allowed to propagate to `y`. This is powerful for local reasoning as well as threading. But it means that the memory must be copied to a new location before modifications can take place. That is why the assignment is done in the statement `x = az_preModify(&x->header)`.

The `SHARED` semantic choice means that there is one single entity referenced by multiple variables. In this case, changes made to one variable *is* propagated to all other variables.
