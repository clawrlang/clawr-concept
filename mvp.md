# Earliest Usable Product

Back in 2016, [Henrik Kniberg](https://blog.crisp.se/2016/01/25/henrikkniberg/making-sense-of-mvp) introduced what has come to be called the “skateboard” to the community/industry. It was a new way to imagine what an MVP should be. He also proposed [terminology](#knibergs-earliest--product-terminology) to emphasise the incremental approach to learning, construction and delivery. 

This document will try to specify what functionality is needed before Clawr can deliver an *[Earliest Usable Product](#knibergs-earliest--product-terminology)*.

To be at all usable, the language must define a complete pipeline from source code to runtime for the most pressing features. It must implement lexing and parsing, IR- and codegen, and finally output an executable file that can be deployed to a device such as a computer server or a wearable.

> [!note]
> This document lists the features that have been identified so far. It does not judge which features are more important or which can be deferred. And it doesn’t provide detail beyond what has already been explored in existing Clawr repositories.
> 
> Maybe a top-down analysis should be performed? In other words, what program (or programs) do we want to build using Clawr? What syntax do we need to specify, and what runtime features do we need to implement, to bring them all into reality?

## Documentation

This repository is the Clawr documentation, both for linguists and compiler designers who want to help, and for developers who want to learn and use Clawr to write code. This documentation should be reorganised and maybe rewritten in places. But that might be okay to do at a later stage — when the syntax and semantics have solidified, and more features have been implemented.

The [documentation](./documentation/index.md) folder contains introductions to the language for “normal” developers.

The [unsorted](./unsorted/) folder contains old documentation from previous attempts (including Azlan). That documentation is probably mostly obsolete, but it might contain some gems that should be refined and organised into the main documentation structure.

The rest of the repository targets developers of the language itself. It includes suggestions and aspirations as much as (if not more than) thought out features and decisions. It should be improved accordingly.

Some of the linguistics/compiler design documentation is in the unsorted/ folder. It just hasn’t been integrated with the main documentation structure and should be relocated/organised.

- [ ] ○ Review the [unsorted](./unsorted/) folder and remove obsolete documentation
- [ ] ○ Move meaningful documentation and ideas out of the [unsorted](./unsorted/) folder
- [ ] ○ Reorganise the documentation so that decided/implemented features are separated from aspirational/speculative ideas

## Frontend — Parsing, Type Inference and Validation

Tasks and features marked #poc have been implemented in [the frontend PoC repository](https://github.com/clawrlang/clawr-swift-parsing), either in full or just enough to prove plausibility/feasibility. It is possible that this repository can be relabelled and evolve into Clawr’s official/reusable frontend implementation. But it is also possible that it would be better to start fresh.

Tasks and features not marked #poc might still be implemented in the [e2e PoC](https://github.com/clawrlang/clawr-poc).

★ = Probably needed for *Earliest Usable Product*
○ = Probably not needed for *Earliest Usable Product*

- [ ] ★ Variable declarations #poc
	- [ ] ★ `const`, `mut` and `ref` semantics #poc
	- [ ] ★ Initial value #poc
	- [ ] ○ Delayed initialisation
- [ ] ★ Assignment #poc
	- [ ] ○ `a [op]= b` $\to$ `a = a [op] b`
	- [ ] ○ `+=`
	- [ ] ○ `-=`
	- [ ] ○ `*=`
	- [ ] ○ `/=`
	- [ ] ○ `&=`
	- [ ] ○ `|=`
	- [ ] ○ `&&=`
	- [ ] ○ `||=`
- [ ] ★ Unary (monadic) operands #poc
	- [ ] ★ `! ternary` #poc
	- [ ] ○ `optional !` #poc
- [ ] ★ Binary (dyadic) operators
	- [ ] ★ `ternary && ternary` (min) #poc
	- [ ] ★ `ternary || ternary` (max) #poc
	- [ ] ○ `bitfield & bitfield`/`tritfield & tritfield`
	- [ ] ○ `bitfield | bitfield`/`tritfield | tritfield`
	- [ ] ★ Comparisons #poc
	- [ ] ★ Arithmetics #poc
	- [ ] ○ Exponentiation
- [ ] ○ Optional values
- [ ] ★ Type Declarations
	- [ ] ★ `object` #poc
		- [ ] ○ Inheritance #poc
		- [ ] ○ Generics
	- [ ] ★ `data` #poc
		- [ ] ○ Automatic encoding/decoding
		- [ ] ○ Generics
		- [ ] ○ Anonymous `data` structures
			- [ ] ○ `const x: { a: integer, b: boolean } = { a: 1, b: true }`
			- [ ] ○ Deconstruction: `const { a: myA } = x`
	- [ ] ○ `enum` #poc
	- [ ] ○ `union` types
		- [ ] ○ `x.casename` is optional (`value | null`)
		- [ ] ○ `type | null`
		- [ ] ○ `type1 | type2` — or just `subset | subset`?
	- [ ] ★ `service` #poc
	- [ ] ★ `trait`/`role`
	- [ ] ○ type extensions and retroactive modelling
	- [ ] ○ Generics
		- [ ] ○ `data D<T>`, `object O<T>`
		- [ ] ○ `func f<T>()`
- [ ] ★ Literals
	- [ ] ★ `ternary`/`boolean` #poc
	- [ ] ★ `integer` #poc
		- [ ] ○ Allow massive integer values (bigger than 64 bits)
	- [ ] ★ `real`
	- [ ] ★ `string`
	- [ ] ○ `regex`
	- [ ] ○ `bitfield` (maybe not literal?)
	- [ ] ○ `tritfield`
	- [ ] ★ `data` #poc
	- [ ] ★ `object` #poc
- [ ] ★ Functions, methods and currying
	- [ ] ★ Function declaration
	- [ ] ★ Function call
	- [ ] ○ Currying on parameter labels
	- [ ] ○ Explicit `copy(object or data)` for semantics switching (`ISOLATED` $\leftrightarrow$ `SHARED` – `const`/`mut` $\leftrightarrow$ `ref`).
	- [ ] ○ Lambdas and closures
- [ ]  ○ List comprehensions and ZIP generators?
- [ ] ★ Control-flow
	- [ ] ★ `if` `else` `elsif`
	- [ ] ○ Pattern matching (`match` or `when` or `given`)
	- [ ] ○ `if const { prop: var } = x.casename { ... }`
	- [ ] ○ `guard`, `guard const`
	- [ ] `do while`
	- [ ] ★ `for in`
	- [ ] ★  `try throw catch`
- [ ] ○ Lattice syntax
	- [ ] ○ `subset & subset` #poc
	- [ ] ○ `subset | subset` #poc
	- [ ] ○ `subset - subset` #poc
	- [ ] ○ `discrete_type {value}`,  `{value, value, …}` #poc
	- [ ] ○ `integer [min...max]`, `integer [min..<max]` #poc
	- [ ] ○ `real [min...max]`
- [ ] ★ Type inference #poc
- [ ] ★ Validation
	- [ ] ★ Enforce maintained semantics
		- [ ] ★ Disallow assigning `const`/`mut` to `ref`
		- [ ] ★ Disallow assigning `ref` to `const`/`mut`
		- [ ] ★ Allow assigning *uniquely referenced return value* to any variable (possible semantics switch)
	- [ ] ★ Hide `helper` code from external access
	- [ ] ○ Require factory of subtype `object` to call supertype initialiser.
	- [ ] ○ *Retroactive modelling* is not allowed unless either the extended type or the conformed `trait`/`role` is defined in the current package/target.
	- [ ] ○ Should “private” retroactive conformance be allowed? Is it even possible?
- [ ] To Be Determined
	- [ ] ★ `real @precision(decimals: 12)`
	- [ ] ★ What is an arbitrary precision `real` actually?

## Backend — Codegen & Runtime

Tasks and features marked #poc have been implemented in [the runtime PoC repository](https://github.com/clawrlang/clawr-runtime). It is possible that this repository can be relabelled and evolve into an official compiler implementation that reuses the [common frontend](https://github.com/clawrlang/clawr-swift-parsing). But it is also possible that it would be better to start fresh.

Tasks and features not marked #poc might still be implemented in the [e2e PoC](https://github.com/clawrlang/clawr-poc).

★ = Probably needed for *Earliest Usable Product*
○ = Probably not needed for *Earliest Usable Product*

The PoCs generate C code and use the clang compiler to generate (binary) executables. An “earliest” usable product will not need to replace C or clang (unless it absolutely needs ternary support, in which case C might or might not even be an option).

- [ ] ○ Define an intermediate representation (IR)
- [ ] ★ Reference-Counting #poc
	- [ ] ★ Copy-on-write variables #poc
	- [ ] ★ Entity references #poc
	- [ ] ○ Weak references (to avoid cycles) #poc
	- [ ] ★ Update semantics flag for uniquely referenced structures
- [ ] ○ `trait`/`role` v-tables
- [ ] ○ Inheritance v-table
- [ ] ○ big integer #poc
	- [ ] ○ Parse literals
	- [ ] ○ Print value #poc
	- [ ] ○ Addition/subtraction #poc
	- [ ] ○ Multiplication
	- [ ] ○ Division
		- [ ] ○ with small divisor #poc
		- [ ] ○ with big integer divisor
		- [ ] ○ with balanced digits #poc
		- [ ] ○ with positive digits
	- [ ] ○ Might exist as C library?
- [ ] ○ “big real” (arbitrary size and precision)
	- [ ] ○ Might exist as C library?
- [ ] ○ Implement `bitfield` bitwise operators (easy on binary, hard-ish on ternary)
- [ ] ○ Implement `tritfield` tritwise operators (expected easy on ternary, complex — inefficient? — on binary)
- [ ] ★ Implement `ternary` versions of all `boolean` operators and use them when the input might be `ambiguous`.
- [ ] ○ Use `boolean` operators in C code when sub-lattice is persistent — `a && b`.
	- [ ] Or would that require `false` to be 0 for `boolean` but -1 for `ternary`?
	- [ ] Maybe we cannot use `&&`/`||`/`!` at all (in runtime), but will have to use `min()`/`max()` for AND/OR, and `-` for NOT? 

## Optimisations

Optimisations are probably not necessary for utility, though they might be an important part of demonstrating Clawr’s virtues.

### Frontend

- [ ] ○ Reduce AST based on lattice analysis
	- [ ] ○ `ternary`/`boolean` #poc
	- [ ] ○ `integer` ranges
	- [ ] ○ `real` ranges
- [ ] ○ Include subset information in AST #poc

### Backend

- [ ] ○ Use small integer types (e.g. `int32`, `uint64`) instead of `BigInteger` when possible.
- [ ] ○ Use small floating-point types (e.g. `duoble`, `float`) instead of `BigDecimal` when possible.

## Libraries

Building libraries is a major challenge. Some functionality (or maybe most) in the standard library are feasible, but I will need help to create UI and networking libraries.

The runtime is written in C, and the e2e PoC generates C that is fed to the clang compiler.It might be possible to link to existing C libraries for the necessary functionality instead of implementing it all ourselves. In the future, Clawr should ideally not depend on C libraries — they are probably not compatible with ternary for one thing — but it could be useful for early stages.

- [ ] ★ Standard Library
	- [ ] ★ `rotate(ternary by: ternary)` #poc
	- [ ] ★ `adjust(ternary towards: ternary)` #poc
	- [ ] ○ `rotate(tritfield by: tritfield)` #poc
	- [ ] ○ `adjust(tritfield towards: tritfield)` #poc
	- [ ] ○ `consensus` and `gullibility` (a.k.a. `CONS`/`ANY`)
	- [ ] ○ `max<T>(T...) -> T`, `min<T>(T...) -> T`
	- [ ] ○ `curry rotate(by: true) as rotateUp`, `rotate(by: false) as rotateDown`
	- [ ] ○ `curry adjust(towards: true) as strengthen`, …`(towards: false) as weaken`
	- [ ] ○ `JSONEncoder`,`JSONDecoder` for automatic `data` serialisation
	- [ ] ○ `trait` for custom encoding/decoding
	- [ ] ★ `trait StringRepresentable`
	- [ ] ○ `gcd(integer, integer) -> integer`
	- [ ] ○ `lcm(integer, integer) -> integer`
	- [ ] ○ `Sequence<T>.map<U>(conversion: T -> U) -> Sequence<U>`
	- [ ] ○ `Sequence<T: Sequence<U>>.flatMap<V>(conversion: U -> V) -> Sequence<V>`
	- [ ] ○ `Sequence<Arithmetic>.sum()`
	- [ ] ○ `Sequence<T>.sum<U: Arithmetic>(conversion: (T) -> U)`
	- [ ] ○ `Sequence<Ordered>.max()`, `.min()`
	- [ ] ○ `Sequence<string>.joined(separator:)`
	- [ ] ○ `Sequence<T>.fold<U>(_: U, combine: (T, U) -> U) -> U`
	- [ ] ○ `Sequence<T>.fold<U>(_: ref U, apply: (T, ref U) -> void) -> ref U`
	- [ ] …
- [ ] ★ UI Library
- [ ] ★ Networking
- [ ] ★ AI Toolkit
- [ ] ○ Testing toolkit
- [ ] …

## Kniberg’s “*Earliest … Product*” Terminology

Below is my interpretation of Henrik Kniberg’s terminology. I recommend reading [the original blog post](https://blog.crisp.se/2016/01/25/henrikkniberg/making-sense-of-mvp) to form your own understanding.

The *Earliest Testable Product* (a.k.a. the “skateboard”) is a product meant to emphasise miscommunications, incorrect assumptions, and other holes in our understanding. It is created to help learn what the actual need is when we know essentially nothing other than grand claims and vain hopes.

The *Earliest Usable Product* is a more mature product that knows the basic need but not the best solutions. It is a device that can be given to a user and actually assist them in accomplishing their goals. But it might be awkward to use, or it might not reach all the way to the end.

The *Earliest Lovable Product* is a product that makes it easy for users to reach their goals. It is not perfect — it is not the final product — but it will have identified most of the need and it understands how the users think/feel.

Clawr’s PoCs can be considered **testable** products. They have helped demonstrate that the initial ideas were not entirely moronic. And it appears to be possible to create a language that focuses on domain modelling rather than memory management.

The next milestone is to create a **usable** product. This document should hopefully clarify what is necessary for its realisation.
