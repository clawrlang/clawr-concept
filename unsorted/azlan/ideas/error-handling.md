# Exceptions and Error Handling

Should we support checked exceptions like Java and Swift? Maybe not: checked exceptions cause a lot of noise in the code. Even C# exception-handling distract a lot from the main algoritm. Maybe we can invent a brand new approach?

Swift requires every throwing method to announce their incom. Java allows unchecked exceptions (through the `RuntimeException` type). And C# does not even have checked exceptions.

I don't think we should emulate Swift in this case, but I'm unsure.

## Complete Functions

Throwing an error means that there is a secondary way for it to terminate (not returning). This is called an “incomplete function” by functional programmers.

Can we require all functions to be complete? Would that be reasonable? Would it be equivalent to checked exceptions? It would probably require a `Result<T>` or a `Result<T, Error>` type. We could perhaps add some syntactic sugar to this type similar to the exclamation point of `Optional<T>`.
