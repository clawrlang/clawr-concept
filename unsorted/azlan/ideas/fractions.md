Here’s a crazy idea: Maybe we could construct a native `rational` type. A `rational` value would consist of two parts, a `numerator` and a `denominator`.  It would allow representing any rational number exactly (as long as its parts do not overflow).

A good reason *to* add it as a built-in type is that we might then construct a processor that has this datatype into its hardware ALU, which can run very fast computations.

A good reason *not to* add this as a built-in type is if requirements might vary. Should 2/4 be considered equal to 1/2? Should it be equal to -1/-2? Should the fraction always be reduced? It is an interesting academic exercise, but it might not be relevant for a standard library. ^[Another good reason to skip it might be that it is hard to design its notation.]

If we fit this into a single register we could either split that register in two even parts, or use a few bits to denote where exactly the split occurs. For a 32 bit register—if we want single-bit resolution—that would require 4 bits, leaving 28 bits for the two integers. In a ternary register of 27 trits, we would need 3 trits to denote the separation point and could have a total of 24 trits for our integers.

We could choose to divide the registers into nibbles of 4 bits (or tribbles or 3 trits) and have the separator refer to them. It might not cause much difference to how many bits are used though, so let’s assume single-bit resolution for now.

The layout of a 32 bit register would then be A number of bits denoting the numerator, followed by a number of bits denoting the denominator, and finally, 4 bits denoting the size of the denominator field.

This could be illustrated using a `bitstruct` declaration:

```azlan
bitstruct rational {
  let sep: integer%4u
  let denominator: integer%{sep}u
  let numerator: integer%{32-sep}s
}
```

It could not actually be implemented as a `bitstruct` due to its variable layout, but it’s runtime layout would be similar.

If a developer wanted to define a their own type it might look something like this:

```azlan
bitstruct rational {
  let numerator: integer%32s
  let denominator: integer%32u
  
static:

  op (divisor: rational / dividend: rational): rational {
    return reduce({
	  numerator: numerator * dividend,
	  denominator: denominator * numerator
	})
  }
}

pure reduce(r: rational): rational {
	let gcd_val = gcd(r.numerator, r.denominator)

	// Built-in function or macro that reuses a memory block (&r)
	// if the refs counter is 1 (i.e. only referenced by this function).
	// In this case the memory allocated by `operator /` would be
	// immediately deallocated, and another equivalent structure
	// allocated for the return value. This is unnecessary.
	return reusing(&r, { // The & symbol might not be needed. Added here
	                     // to indicate that it is *meant* to use the
	                     // memory block, not a new reference-counted
	                     // variable. Other syntax might be preferred.
		numerator: r.numerator / gcd_val
		denominator: r.denominator / gcd_val
	})
}
```
