# Clawr Future: Annotations

Add keyword `annotation`. An annotation type might be a `data` type or an `object` type at runtime — `data` seems most reasonable at this time as the word “annotation” implies what is essentially just a tag supplying information.

Annotations are placeholders for automatically generated code. That code can generate a list of tests that are executed by the `Testing` framework. Or it can register REST API handlers executed by a server. Or just about anything that can be reasonably — or perhaps unreasonably — imagined.

The compiler should probably find all files in the directory tree to discover all annotations. The current (?) implementation imports modules on demand from a main .clawr file (or recursively). It does not know the full body of sources.