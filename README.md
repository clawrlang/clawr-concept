# Clawr: Coding with Roaring Clarity

![Clawr's unnamed mascot–a roaring lion with an eye-patch](./images/clawr-lion.png)

This repository exists to collect ideas and concepts for Clawr, a programming language designed to help you express your ideas clearly so others (and your future self) can understand them.

## Why Clawr?

Code should read like your intent, not like a puzzle for the compiler. Clawr's goal is not just to help you tell computers what to do—it's to help you communicate what you want clearly.

> [!quote]
> Programming is the art of telling another human being what one wants the computer to do.
> — Donald Knuth

### About the Name

It started as the “Azeea Language,” or Azlan for short. Aslan, of course, is “the Lion” in the title of C.S. Lewis' famous book *The Lion, the Witch, and the Wardrobe*. The name was at the same time not very unique, and too tied to the company name. I tried discarding the lion concept entirely, instead going with Oolang (mild tea) for a while. But that name was too cute, and the lion kept roaring in the background. So I decided to bring it back.

The name Clawr is a portmanteau of the word “clarity” and a lion’s “rawr.” The alternative spelling was chosen in part because the resulting name spells out the word “claw,” another stereotypical element of felinity.

## Core Principles

Clarity is the fundamental goal of the Clawr language. Everything else follows from this:

- **Clarity first**: Code that reads like your intent
- **Model your domain**: Focus on what you're building, not technical plumbing
- **Refactor fearlessly**: Easy refactoring, even without automated tools
- **Embrace isolation**: Predictable behavior through value semantics
- **Consistent encapsulation**: Fully encapsulated when modelling behaviour, exposed data when working with computational analysis
- **No tech-bro features**: Security, safety and performance are good qualities, but they should emerge from good programming principles and intelligent tools; they should not obscure intent or distract from the model

> [!quote]
> “It occurred to me that where they went down a dead end was because the method's contents did not match its name. These people were basically looking for a sign in the browser that would say, 'Type in here, buddy!'
>
> That's when I recognized that they needed ScreechinglyObviousCode.”
> —Alistair Cockburn <https://kidneybone.com/c2/wiki/ScreechinglyObviousCode>

A roaring lion may not be as obvious as a screeching monkey, but it might be more dignified.

## Key Concepts

Here are some of the big ideas that Clawr is exploring:

- [Variable Scope and Semantics](./variable-scope.md): Enforcing clear variable semantics to avoid unintended shared state and side effects.
- [Object vs Data Segregation](./object-data.md): Enforcing encapsulation for objects in business applications, while allowing pure, exposed data structures for big-data analysis.

## Get Started

Let's start with something simple — [your first Clawr program](./unsorted/clawr-old/tutorial/hello-world.md).

There is a [proof of concept repository](https://github.com/clawrlang/clawr-poc) that implements a compiler and runtime for Clawr, demonstrating the variable scope and semantics model described above.

## Contributing

Contributions and ideas are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.