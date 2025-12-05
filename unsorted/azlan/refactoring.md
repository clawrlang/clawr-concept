# Refactoring

Refactoring is an important part of TDD. There is a known book of refactorings written by Martin fowler around 2006, with a second edition maybe a decade later.

Fowler defines refactoring as a noun and as a verb.

- A refactoring (noun) is a small change to the system’s design that does not alter behaviour (and certainly does not leave the code base uncompiled for days).
- Refactoring (verb) is the disciplined action of applying a series of small refactorings (noun) to incrementally and systematically make the code more extensible and more readable.

How well does Azlan allow refactoring.

Here's a few question marks:

- *Encapsulate struct* — converting a `struct` into an `object`.
- *Extract object* — moving some fields from and existing (too large?) `object` to a new location.

Both are probably solved by temporarily adding getter and setter methods (which should be removed when done).
