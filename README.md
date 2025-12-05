# Clawr Programming Language

![Rawr!|150](./images/rawr.png)
This repository exists to collect ideas and concepts for a new programming language, Clawr.

## the Philosophy of Clawr

- Clarity of intent is the first priority. Modelling and behaviours should be the main things on display. DRY is good, but DAMP is better.
- Performance optimisations should be handled automatically as much as possible.
- No tech-bro features. Security, safety and performance are all good qualities, but they should emerge from good programming; they should not obscure intent or distract from the model.

Clawr is a language with goals of clarity, a modelling focus and easy refactoring. The name is a portmanteau of the word ”clarity,” and a lion’s roar.

> [!quote]
> *“Let us change our traditional attitude to the construction of programs: Instead of imagining that our main task is to instruct a computer what to do, let us concentrate rather on explaining to human beings what we want a computer to do.”*
> — Donald Knuth

Here are some of the big ideas that Clawr is exploring:

- [Variable Scope and Semantics](./variable-scope.md): Enforcing clear variable semantics to avoid unintended shared state and side effects.

There is a [proof of concept repository](https://github.com/clawrlang/clawr-poc) that implements a compiler and runtime for Clawr, demonstrating the variable scope and semantics model described above.

Contributions and ideas are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.
