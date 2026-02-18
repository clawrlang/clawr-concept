# Earliest Usable Product

Back in 2016, [Henrik Kniberg](https://blog.crisp.se/2016/01/25/henrikkniberg/making-sense-of-mvp) suggested the “skateboard” approach to the MVP. He also proposed new terminology to emphasise the incremental approach to learning and construction. 

This document will try to specify what functionality is needed for Clawr’s *[Earliest Usable Product](#knibergs-earliest--product-terminology)*.

To be at all usable, the language must define syntax, IR, and runtime behaviour for the most pressing features. It must implement an entire pipeline, from lexing and parsing, to IR- and codegen, and finally generating executable machine code (a file) that can be deployed to a device.

> [!note]
> This document lists the features that have been identified so far. It does not judge which features are more important or which can be deferred.
> 
> Maybe a top-down analysis should be performed? In other words, what program (or programs) do we want to build using Clawr? What syntax do we need to specify, and what runtime features do we need to implement, to bring them all into reality?

## Syntax

Features marked #poc have been implemented in [the frontend PoC repository](https://github.com/clawrlang/clawr-swift-parsing), either in full or just enough to prove plausibility/feasibility. It is possible that this repository can be relabelled and evolve into Clawr’s official/reusable frontend implementation. But it is also possible that it would be better to start afresh.

Features not marked #poc might still be implemented in the [e2e repository](https://github.com/clawrlang/clawr-poc).

- [ ] Variable declarations #poc
	- [ ] `const`, `mut` and `ref` semantics #poc
	- [ ] Initial value #poc
	- [ ] Delayed initialisation
- [ ] Assignment #poc
- [ ] Unary (monadic) operands #poc
	- [ ] `! ternary` #poc
	- [ ] `optional !` #poc
- [ ] Binary (dyadic) operators
	- [ ] `ternary && ternary` #poc
	- [ ] `ternary || ternary` #poc
	- [ ] `bitfield & bitfield`/`tritfield & tritfield`
	- [ ] `bitfield | bitfield`/`tritfield | tritfield`
	- [ ] Comparisons #poc
	- [ ] Arithmetics #poc
	- [ ] Exponentiation
- [ ] Optional values
- [ ] Type Declarations
	- [ ] `object` #poc
		- [ ] Inheritance #poc
		- [ ] Generics
	- [ ] `data` #poc
		- [ ] Automatic encoding/decoding
		- [ ] Generics
	- [ ] `enum` #poc
	- [ ] `union`
	- [ ] `service` #poc
	- [ ] `trait`/`role`
- [ ] Literals
	- [ ] `ternary`/`boolean` #poc
	- [ ] `integer` #poc
		- [ ] Allow massive integer values (bigger than 64 bits)
	- [ ] `real`
	- [ ] `string`
	- [ ] `regex`
	- [ ] `bitfield` (maybe not literal?)
	- [ ] `tritfield`
	- [ ] `data` #poc
	- [ ] `object` #poc
- [ ] Functions, methods and currying
	- [ ] Function declaration
	- [ ] Function call
	- [ ] Currying on parameter labels
- [ ] Control-flow
	- [ ] `if` `else` `elsif`
	- [ ] Pattern matching (`match` or `when` or `given`)
	- [ ] `do while`
	- [ ] `for in`
	- [ ] `try catch`
- [ ] Lattice syntax
	- [ ] `subset & subset` #poc
	- [ ] `subset | subset` #poc
	- [ ] `subset - subset` #poc
	- [ ] `discrete_type {value}`,  `{value, value, …}` #poc
	- [ ] `integer [min...max]`, `integer [min..<max]` #poc
	- [ ] `real [min...max]`
- [ ] Type inference #poc
- [ ] To Be Determined
	- [ ] `real @precision(decimals: 12)`
	- [ ] What is an arbitrary precision `real` actually?

## Codegen & Runtime

Features marked #poc have been implemented in [the runtime PoC repository](https://github.com/clawrlang/clawr-runtime). It is possible that this repository can be relabelled and evolve into an official compiler implementation that reuses the [common frontend](https://github.com/clawrlang/clawr-swift-parsing). But it is also possible that it would be better to start afresh.

Features not marked #poc might still be implemented in the [e2e repository](https://github.com/clawrlang/clawr-poc).

The PoCs generate C code and use the clang compiler to generate (binary) executables. An “earliest” usable product will not need to replace C or clang (unless it absolutely needs ternary support, in which case C might or might not even be an option).

- [ ] Reference-Counting #poc
	- [ ] Copy-on-write variables #poc
	- [ ] Entity references #poc
	- [ ] Weak references (to avoid cycles) #poc
- [ ] `trait`/`role` v-tables
- [ ] Inheritance v-table
- [ ] big integer #poc
	- [ ] Parse literals
	- [ ] Print value #poc
	- [ ] Addition/subtraction #poc
	- [ ] Multiplication
	- [ ] Division
		- [ ] with small divisor #poc
		- [ ] with big integer divisor
		- [ ] with balanced digits #poc
		- [ ] with positive digits
	- [ ] Might exist as C library?
- [ ] “big real” (arbitrary size and precision)
	- [ ] Might exist as C library?

## Optimisations

Optimisations are probably not necessary for utility, though they might be an important part of demonstrating Clawr’s virtues.

### Frontend

- [ ] Reduce AST based on lattice analysis
	- [ ] `ternary`/`boolean` #poc
	- [ ] `integer` ranges
	- [ ] `real` ranges
- [ ] Include subset information in AST #poc

### Backend

- [ ] Use small integer types (e.g. `int32`, `uint64`) instead of `BigInteger` when possible.
- [ ] Use small floating-point types (e.g. `duoble`, `float`) instead of `BigDecimal` when possible.

## Libraries

Building libraries is a major challenge. Some functionality (or maybe most) in the standard library are feasible, but I will need help to create UI and networking libraries.

- [ ] Standard Library
	- [ ] `rotate(ternary by: ternary)` #poc
	- [ ] `adjust(ternary towards: ternary)` #poc
	- [ ] `rotate(tritfield by: tritfield)` #poc
	- [ ] `adjust(tritfield towards: tritfield)` #poc
	- [ ] …
- [ ] UI Library
- [ ] Networking
- [ ] AI Toolkit
- [ ] …

## Kniberg’s “*Earliest … Product*” Terminology

Below are my interpretations of the terms:

The *Earliest Testable Product* (a.k.a. the “skateboard”) is a product meant to emphasise miscommunications, incorrect assumptions, and other holes in our understanding. It is created to help learn what the actual need is when we know essentially nothing other than claimed needs and vain hopes.

The *Earliest Usable Product* is a more mature product that knows the basic need but not the best solutions. It is a device that can be given to a user and actually assist them in accomplishing their goals. But it might be awkward to use, or it might not reach all the way to the end.

The *Earliest Lovable Product* is a product that makes it easy for users to reach their goals. It is not perfect — it is not the final product — but it will have identified most of the need and it understands how the users think/feel.

Clawr’s PoCs can be considered **testable** products. They have helped demonstrate that the initial ideas were not entirely moronic. And it appears to be possible to create a language that focuses on domain modelling rather than memory management.

The next milestone is to create a **usable** product. This document should hopefully clarify what is necessary for its realisation.
