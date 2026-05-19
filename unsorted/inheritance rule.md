An initializer function does not allocate its own memory. Instead that allocation is performed implicitly by the caller. This means that the calling function must “know” — directly or indirectly — the size of the allocation to create.

> [!note]
> This is sort-of similar to Objective C's `[[Class alloc] init]` pattern, except Clawr does not make the `alloc` call explicit.

The AST should describe the allocation in some form and then call functions using that allocation as the first `self` parameter.

I was going to write this as a rule for the backend, but I think the frontend could emit an AST that specifies these actions explicitly (even if they are implicit in the source-code).

```json
[
	{
		"kind": "call",
		"arguments": [
		    {
				"kind": "allocate",
				"type": "ObjectSubtype",
			}
		]
	}
]
```
