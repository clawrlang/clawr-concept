# Clawr Documentation

> [!note] Programmer Documentation
> This is a sketch of the Clawr documentation. The repository in general targets linguists and compiler designers. This section envisions how future Clawr programmers might be introduced to the language.

> [!note] Obsidian Notation
> This paragraph is a *callout*. It is written using [Obsidian notation](https://help.obsidian.md/callouts) and looks best when read in the Obsidian editor. Unfortunately there is no standard for callouts—sometimes similar notations coincide and sometimes not.
>
> Obsidian is “[free without limits](https://obsidian.md/pricing)” so I can with good conscience ask you to [download and install it](https://obsidian.md/download) if you are interested in contributing to this documentation.

---

# Clawr: Coding with Roaring Clarity

[![Rawry](../images/rawry.png)](./rawry.md)

Clawr is a programming language designed to help you express your domain knowledge clearly so others (including your future self) can understand it, and learn it.

## Why Clawr?

Code should read like your intent, not like a set of instructions for the compiler. Clawr's goal is not just to help you tell computers what to do—it's to help you communicate what you want clearly.

> [!quote]
> Programming is the art of telling another human being what one wants the computer to do.
> — Donald Knuth

### About the Name

It started as the “Azeea Language,” or Azlan for short. Aslan, of course, is “the Lion” in the title of C.S. Lewis' famous book *The Lion, the Witch, and the Wardrobe*. The name was at the same time not very unique, and too tied to the company name. I tried discarding the lion concept entirely, instead going with Oolang (for mild tea — oolong — and OO language) for a while. But that name was maybe too cute, and the lion kept roaring at me from the background. So I decided to bring it back, but with a new name.

The name Clawr is a portmanteau of the word “clarity” and a lion’s “rawr.” The alternative spelling was chosen in part because the resulting name spells out the word “claw,” another stereotypical element of felinity.

## Core Principles

Clarity is the fundamental goal of the Clawr language. Everything else follows from this:

- **Clarity first**: Code that reads like your intent
- **Model your domain**: Focus on what you're building, not technical plumbing
- **Refactor fearlessly**: Easy refactoring, even without automated tools
- **Embrace isolation**: Predictable behaviour and local reasoning through value semantics
- **Consistent encapsulation**: Fully encapsulated when modelling behaviour, exposed data when working with computational analysis
- **No tech-bro features**: Security, safety and performance are good qualities, but they should emerge from good programming principles and intelligent tools; they should not obscure intent or distract from the model

## Getting Started

Start from the place that makes the most sense to you:

- [Hello World tutorial](./tutorial/hello-world.md)
- [Language Reference](./ref/index.md)
