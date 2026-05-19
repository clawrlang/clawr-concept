
- Invent better tests?
	- Possible to test lowering without runtime? Probably not.
	- Test release/retain more directly through runtime?
	- Verify that leaks do not occur?
- Detect recursion that cannot exit?
- Are function declarations complete? (with and without labels?)
	- Allow `=> expression` instead of body
	- `=>` Allows inferring returned lattice/value-set
- Optimisation of `mutateRC()`calls
- `data` serialisation
- modules and packages
- namespaces and companions
- linking to C APIs?
- `helper` keyword
- Testing Framework/Library
- Other frameworks (link with existing C libs in v1?)
	- GUI
	- Networking/Internet
	- Database support (SQLite)
	- others?
- Allow `ref` parameters to be sent any `ref` value (that is known to be `ref`)
	- We chose a hybrid approach that “rejects”
		- member access
		- more complex expressions
		- … but the language should be aware of what is `ref`.
		- … except if cannot if a variable was passed as `in` parameter.

---

