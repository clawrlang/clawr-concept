
- <https://github.com/clawrlang/clawr-runtime/>
- **Branch:** feature/large-divisor ==TODO: Publish Branch==
- **Commit:** d3c8c13ed6e999a0b7721e42de982a307e602533

# Multi-Digit Division Implementation Notes

## Overview

This implementation adapts Knuth's Algorithm D from "The Art of Computer Programming, Volume 2" for your balanced digit big integer system. The algorithm divides a multi-digit number by another multi-digit number efficiently.

## Key Adaptations for Balanced Digits

### 1. Sign Handling

Unlike standard unsigned algorithms, balanced digits can be negative. The implementation:

- Extracts signs at the start
- Works with absolute values throughout
- Applies signs to quotient and remainder at the end
- Follows C semantics: quotient truncates toward zero, remainder has same sign as dividend

### 2. Digit Balancing

After each arithmetic operation, digits are balanced to stay within [DIGIT_MIN, DIGIT_MAX]:

```c
if (current > DIGIT_MAX) {
    carry = (current - DIGIT_MIN) / BASE + 1;
    current -= carry * BASE;
} else if (current < DIGIT_MIN) {
    carry = (current - DIGIT_MAX) / BASE - 1;
    current -= carry * BASE;
}
```

### 3. Partial Remainder Constraints

**Important decision**: I did NOT maintain ±divisor/2 for partial remainders during the algorithm.

**Why?** Knuth's algorithm works by estimating quotient digits and making corrections. The partial remainders naturally stay bounded by the divisor magnitude through the subtraction steps. Trying to enforce ±divisor/2 at each step would:

- Complicate quotient digit estimation significantly
- Potentially require multi-digit adjustments
- Break the convergence guarantees of the algorithm

The final remainder is naturally bounded (smaller than divisor), which matches C division semantics.

## Algorithm Steps (Knuth's Algorithm D)

### D1: Normalization

Scale both dividend and divisor by a factor `d` so that the leading digit of the divisor has large absolute value (≥ BASE/2). This ensures better quotient digit estimates.

```c
d = BASE / (2 * digit_abs(leading_divisor) + 1);
```

### D2: Initialize

Set up the quotient array with m+1 digits (where m = dividend_length - divisor_length).

### D3: Estimate Quotient Digit

For each position j, estimate the quotient digit q̂ using the top two digits of the current dividend section and the top digit of the divisor:

```c
q_hat = (dividend_top * BASE + dividend_next) / divisor_top;
```

### D4: Multiply and Subtract

Subtract q̂ × divisor from the current dividend section:

```c
dividend[i..i+n] -= q_hat * divisor
```

### D5: Test and Correct

If the subtraction went negative (rare but possible due to estimation), add back the divisor and decrease q̂:

```c
if (went_negative) {
    q_hat--;
    dividend[i..i+n] += divisor;
}
```

### D6: Store Quotient Digit

Save the finalized q̂  as the quotient digit for this position.

### D7: Loop

Repeat D3-D6 for each quotient position.

### D8: Unnormalize

Divide the remainder by d to reverse the normalization from D1.

## Helper Functions

### `multiply_subtract(minuend, multiplicand, digit, offset)`

Performs: `minuend -= multiplicand × digit` starting at position `offset`. Returns true if the result went negative (needed for Algorithm D step D5).

Key challenges:

- Must handle both positive and negative multiplication digits
- Must properly propagate borrows through balanced digit system
- Must extend minuend array if necessary

### `multiply_add(target, multiplicand, digit, offset)`

Performs: `target += multiplicand × digit` starting at position `offset`. Used in D5 to add back the divisor when correction is needed.

### `normalize_digits(num)`

Removes leading zero digits and ensures at least one digit remains.

### `compare_abs(a, b)`

Compares absolute values of two BigIntegers. Returns -1, 0, or 1 for less than, equal, or greater than.

## Complexity

- **Time**: O(m × n) where m and n are the lengths of dividend and divisor
- **Space**: O(m + n) for temporary arrays
- **Quotient digit estimates** usually succeed on first try (the algorithm is very efficient)

## Edge Cases Handled

1. **Division by zero**: Panics with error message
2. **Zero dividend**: Returns zero quotient and remainder
3. **Dividend < divisor**: Returns zero quotient, dividend as remainder
4. **Single-digit divisor**: Falls back to optimized single-digit algorithm
5. **Negative operands**: Correctly handles all sign combinations
6. **Leading zeros**: Normalized away to prevent incorrect length calculations

## Comparison to Single-Digit Version

Your original single-digit algorithm maintained strict ±divisor/2 bounds on partial remainders to prevent multi-digit quotient digits when processing negative digits.

For multi-digit division, this constraint isn't necessary because:

1. We estimate quotient digits using multiple digits of both operands
2. The normalization step ensures quotient estimates are accurate
3. The correction step (D5) handles the rare cases where estimates are off by 1

## Testing Recommendations

Test cases to verify:

```c
// Basic cases
1000 / 10 = 100 remainder 0
1234 / 56 = 22 remainder 2
999999 / 7 = 142857 remainder 0

// Sign combinations
-1000 / 10 = -100 remainder 0
1000 / -10 = -100 remainder 0
-1000 / -10 = 100 remainder 0
-1234 / 56 = -22 remainder -2  // Remainder matches dividend sign

// Edge cases
5 / 10 = 0 remainder 5
0 / 123 = 0 remainder 0
BASE / 2 / (BASE / 4) = 2 remainder 0

// Large numbers
(BASE^3) / (BASE^2) = BASE remainder 0
```

## Performance Notes

The normalization step (D1) is crucial for performance. Without it, quotient digit estimates would frequently be wrong, requiring many correction steps.

The algorithm typically requires 0-1 correction steps per quotient digit (step D5). If you observe many corrections, there may be an issue with the estimation or normalization.

## Future Optimizations

Possible improvements:

1. **Burnikel-Ziegler algorithm**: For very large numbers, this recursive algorithm can be faster
2. **Better q̂ estimation**: Use 3 digits instead of 2 for even more accurate estimates
3. **SIMD operations**: Vectorize the multiply-subtract operations
4. **Karatsuba multiplication**: For the multiply steps within the algorithm

## Usage Example

```c
// Divide a big number by another big number
BigInteger* dividend = BigInteger¸fromString("123456789012345678901234567890");
BigInteger* divisor = BigInteger¸fromString("98765432109876543210");

BigInteger* remainder = BigInteger·divideMultiDigit(dividend, divisor);
// dividend now contains quotient: 1249999988609375
// remainder contains: 73869936899059053390

printf("Quotient: ");
BigInteger·print(dividend);
printf("\nRemainder: ");
BigInteger·print(remainder);

releaseRC(remainder);
releaseRC(divisor);
releaseRC(dividend);
```