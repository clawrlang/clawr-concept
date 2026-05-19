Why are Programming Languages so Technical?

Has anyone ever designed an OO language with DDD in mind? Has anyone ever tried to design a language that allows the programmer to think about the application rather than memory management?

I guess Haskell and other functional languages manage to remove memory management from the programmers mind, but they are not OO. They encourage coupling to structural details. instead of building interfaces to them. They also try to convince the programmer that mutation is not a thing, but if there truly was no mutation, there would be no program. All functional languages *must* perform mutation. They just make it awkward.

## the Sieve is not the Sieve

```haskell
primes = sieve [2..]
sieve (p : xs) = p : sieve [x | x <− xs, x ‘mod‘ p > 0]
```

https://www.cs.hmc.edu/~oneill/papers/Sieve-JFP.pdf

```haskell
sieve [] = []
sieve (x:xs) = x : sieve’ xs (insertprime x xs PQ.empty)
	where
		insertprime p xs table = PQ.insert (p*p) (map (* p) xs) table
		sieve’ [] table = []
		sieve’ (x:xs) table
		| nextComposite <= x | otherwise = sieve’ xs (adjust table)
		= x : sieve’ xs (insertprime x xs table)
			where
				nextComposite = PQ.minKey table
				adjust table
				| n <= x = adjust (PQ.deleteMinAndInsert n’ ns table)
				| otherwise = table
					where
						(n, n’:ns) = PQ.minKeyValue table
```

Java, JavaScript and other garbage-collected languages also manage to hide away memory management. I wonder if JavaScript might be the best language in existence actually!

Trying to write a compiler for my own language, Clawr, I first wrote a parser in Swift. Clawr's syntax is very much inspired by Swift. But I decided that Swift is too rigid. It is hard to perform refactorings and error feedback often fails because it cannot parse “complex” expressions in short enough time.

Then I tried writing in Python, Rust and Go. Python might not be too bad, but it still felt *wrong* somehow. Rust and Go are both super-technical and really awkward to code in. Go apparently dislikes optional parameters. I got this motivation when I asked why they are not supported:

> Clarity: Default parameters can introduce implicit behavior, making code harder to read and understand.
> Simplicity: Go aims to keep function signatures clear and straightforward, avoiding complexity.

I guess it is possible to misuse default parameters. But pretty much all syntax features can be used poorly. I don’t see why this is exceptional. But “clarity”? This is how casting is done in Go:

```go
if subvar, ok := var.(Subtype); ok {
    // Now subvar has access to the Subtype interface
}
```

Clarity is a priority? When casting information is extracted from a tuple with anonymised positions!? A tuple returned from the expression var.(Subtype) !?

It also thinks enums are bad apparently. To reproduce an enum-like type, you use an alias for int  and implement a bunch of methods and dictionaries  to convert that int to a string value. And then you have to remember to use the right format code ( %v ) when printing it.

```go
package lexer

import "fmt"

// TokenKind represents the type of a token.
type TokenKind int

// const .. iota is equivalent to C enum
// It just assigns consecutive integer values to the listed names
const (
	TokenEOF TokenKind = iota
	TokenData
	TokenObject
	TokenService
	TokenEnum
	…
)

// 
var tokenKindStrings = [...]string{
	TokenEOF:              "EOF",
	TokenData:      "data",
	TokenObject:    "object",
	TokenService:   "service",
	TokenEnum:      "enum",
	…
}

func (k TokenKind) String() string {
	if int(k) < len(tokenKindStrings) && tokenKindStrings[k] != "" {
		return tokenKindStrings[k]
	}
	return fmt.Sprintf("TokenKind(%d)", int(k))
}

var keywords = map[string]TokenKind{
	"data":      TokenData,
	"object":    TokenObject,
	"service":   TokenService,
	"enum":      TokenEnum,
	…
}

func keywordOrIdentifier(lexeme string) TokenKind {
	if kind, ok := keywords[lexeme]; ok {
		return kind
	}
	return TokenIdentifier
}
```

I almost want to go back to Swift.