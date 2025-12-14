# Visibility Modifiers in Clawr

There are no visibility modifiers. There. Done. That was easy.

Well, okay there is one thing: `helper`.

## Sane Visibility by Default

All types are public by default. All `data` fields are public as the purpose of a data structure is to expose data. Enum cases must be public if the `enum` itself is; there cannot be private values that are only known to a few. The same is true for `union` types: if you can reference a `union`, you must be able to access all its variants.

Encapsulated types (`object` and `service`) hide their data. Their fields are always hidden from code that isn't the type itself (or its `companion` object). All methods, on the other hand, are publicly visible by default.

## Hide Code by Marking it as `helper`

There is no way to make a hidden member visible other than indirectly. You can always define a new method that returns the value of a private field. But that is just what encapsulation does already.

You cannot increase visibility, but you can hide what would otherwise be visible. When tagged as a `helper`…

- A method is visible only to its parent `object` or `service`.
- A type is visible to the entire package/library it is defined in, but not to users of the library.
- A free function (not a method) is visible to the package/library, but not where it is imported.
