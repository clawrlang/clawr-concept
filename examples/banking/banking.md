# Constrained Union Types - Official Feature

## Syntax Summary

```clawr
// Define base union with all possible variants
union ErrorType {
    case variantA(DataA)
    case variantB(DataB)
    case variantC(DataC)
}

// Constrain to single variant
typealias SpecificError = ErrorType @case(variantA)

// Constrain to multiple variants
typealias SubsetError = ErrorType @cases(variantA, variantB)

// Use full union (no constraint)
typealias AllErrors = ErrorType
```

## Matching Rules

```clawr
// Single case constraint: name optional
match result: T | SingleCaseError {
    case success(value) => ...
    case (data) => ...  // ✅ Unambiguous
}

// Multiple case constraint: names required
match result: T | MultiCaseError {
    case success(value) => ...
    case variantA(data) => ...  // ✅ Explicit
    case variantB(data) => ...
    case (data) => ...  // ❌ Compiler error: ambiguous
}

// Wildcard for any error
match result {
    case success(value) => ...
    case error => ...  // Matches any error variant
}
```

## Revised Banking Library

Let me rewrite the key parts with this new feature:

```clawr
// ============================================================================
// MONEY ERRORS - Base union
// ============================================================================

union MoneyError {
    case currencyMismatch(Currency, Currency)
    case divisionByZero
    case invalidProportions(string)
    case negativeAmount
}

// Constrained error types
typealias CurrencyMismatch = MoneyError @case(currencyMismatch)
typealias DivisionByZero = MoneyError @case(divisionByZero)
typealias InvalidProportions = MoneyError @case(invalidProportions)
typealias NegativeAmount = MoneyError @case(negativeAmount)

// Combined constraints for related operations
typealias ArithmeticError = MoneyError @cases(currencyMismatch, divisionByZero)

// ============================================================================
// MONEY - With precise error constraints
// ============================================================================

object Money {
    
    func amount() -> decimal => self.amountInMinorUnits / self.divisor()
    func currency() -> Currency => self.currency
    func minorUnits() -> integer => self.amountInMinorUnits
    
    func isZero() -> boolean => self.amountInMinorUnits == 0
    func isPositive() -> boolean => self.amountInMinorUnits > 0
    func isNegative() -> boolean => self.amountInMinorUnits < 0
    
    // Precise: can ONLY fail with currencyMismatch
    func add(_ other: Money) -> Money | CurrencyMismatch {
        guard self.currency == other.currency 
            or return currencyMismatch(self.currency, other.currency)
        
        return Money.minorUnits(
            self.amountInMinorUnits + other.amountInMinorUnits,
            currency: self.currency
        )
    }
    
    func subtract(_ other: Money) -> Money | CurrencyMismatch {
        guard self.currency == other.currency 
            or return currencyMismatch(self.currency, other.currency)
        
        return Money.minorUnits(
            self.amountInMinorUnits - other.amountInMinorUnits,
            currency: self.currency
        )
    }
    
    // Never fails - no error type
    func multiply(by factor: decimal) -> Money {
        let newAmount = decimal(self.amountInMinorUnits) * factor
        return Money.minorUnits(
            integer(Math.round(newAmount)),
            currency: self.currency
        )
    }
    
    // Precise: can ONLY fail with divisionByZero
    func divide(by divisor: decimal) -> Money | DivisionByZero {
        guard divisor != 0 or return divisionByZero
        
        let newAmount = decimal(self.amountInMinorUnits) / divisor
        return Money.minorUnits(
            integer(Math.round(newAmount)),
            currency: self.currency
        )
    }
    
    // Precise: can ONLY fail with invalidProportions
    func allocate(proportions: [decimal]) -> [Money] | InvalidProportions {
        guard proportions.sum() == 1.0 
            or return invalidProportions("Proportions must sum to 1.0")
        
        guard proportions.all { it > 0 } 
            or return invalidProportions("All proportions must be positive")
        
        // Implementation...
        mut allocated: [Money] = []
        mut remaining = self.amountInMinorUnits
        
        for proportion in proportions {
            let amount = integer(Math.round(decimal(self.amountInMinorUnits) * proportion))
            allocated.append(Money.minorUnits(amount, currency: self.currency))
            remaining -= amount
        }
        
        // Distribute remainder
        if remaining != 0 {
            let firstAmount = allocated[0].amountInMinorUnits + remaining
            allocated[0] = Money.minorUnits(firstAmount, currency: self.currency)
        }
        
        return allocated
    }

factory:
    func zero(currency: Currency) -> Money {
        return { amountInMinorUnits: 0, currency: currency }
    }
    
    func minorUnits(_ amount: integer, currency: Currency) -> Money {
        return { amountInMinorUnits: amount, currency: currency }
    }
    
    func amount(_ amount: decimal, currency: Currency) -> Money | NegativeAmount {
        guard amount >= 0 or return negativeAmount
        
        let divisor = 10 ^ currency.decimalPlaces()
        return { 
            amountInMinorUnits: integer(Math.round(amount * divisor)),
            currency: currency
        }
    }

data:
    amountInMinorUnits: integer
    currency: Currency
    
    func divisor() -> integer => 10 ^ self.currency.decimalPlaces()
}

// ============================================================================
// OPERATORS - Beautiful error handling
// ============================================================================

companion Money {
    operator a: Money + b: Money -> Money | CurrencyMismatch {
        return a.add(b)
    }
    
    operator a: Money - b: Money -> Money | CurrencyMismatch {
        return a.subtract(b)
    }
    
    operator a: Money * b: decimal -> Money {
        return a.multiply(by: b)
    }
    
    operator a: Money / b: decimal -> Money | DivisionByZero {
        return a.divide(by: b)
    }
    
    operator a: Money == b: Money -> boolean | CurrencyMismatch {
        guard a.currency == b.currency 
            or return currencyMismatch(a.currency, b.currency)
        return a.amountInMinorUnits == b.amountInMinorUnits
    }
}

// ============================================================================
// EXCHANGE RATE ERRORS
// ============================================================================

union ExchangeRateError {
    case unsupportedCurrency(Currency, Currency)
    case rateNotAvailable(Currency, Currency, Date)
    case rateLimitExceeded(integer)  // seconds until reset
    case invalidRate(string)
    case staleRate(Date)  // rate is too old
}

typealias UnsupportedCurrency = ExchangeRateError @case(unsupportedCurrency)
typealias RateNotAvailable = ExchangeRateError @case(rateNotAvailable)
typealias RateLimitExceeded = ExchangeRateError @case(rateLimitExceeded)
typealias InvalidRate = ExchangeRateError @case(invalidRate)
typealias StaleRate = ExchangeRateError @case(staleRate)

// User-facing errors (exclude technical ones)
typealias UserFacingRateError = ExchangeRateError 
    @cases(unsupportedCurrency, rateLimitExceeded)

// All retrieval errors
typealias RateRetrievalError = ExchangeRateError
    @cases(rateNotAvailable, rateLimitExceeded, staleRate)

// ============================================================================
// EXCHANGE RATE
// ============================================================================

object ExchangeRate {
    func from() -> Currency => self.fromCurrency
    func to() -> Currency => self.toCurrency
    func rate() -> decimal => self.rate
    func timestamp() -> DateTime => self.timestamp
    
    func isValid(maxAge: Duration) -> boolean {
        return DateTime.now() - self.timestamp < maxAge
    }
    
    func convert(amount: Money) -> Money | CurrencyMismatch {
        guard amount.currency == self.fromCurrency 
            or return currencyMismatch(amount.currency, self.fromCurrency)
        
        let convertedMinorUnits = decimal(amount.minorUnits()) * self.rate
        return Money.minorUnits(
            integer(Math.round(convertedMinorUnits)),
            currency: self.toCurrency
        )
    }
    
    func invert() -> ExchangeRate {
        return ExchangeRate.rate(
            1.0 / self.rate,
            from: self.toCurrency,
            to: self.fromCurrency,
            timestamp: self.timestamp
        )
    }

factory:
    func rate(
        _ rate: decimal, 
        from: Currency, 
        to: Currency,
        timestamp: DateTime = DateTime.now()
    ) -> ExchangeRate | InvalidRate {
        guard rate > 0 or return invalidRate("Rate must be positive")
        return {
            fromCurrency: from,
            toCurrency: to,
            rate: rate,
            timestamp: timestamp
        }
    }

data:
    fromCurrency: Currency
    toCurrency: Currency
    rate: decimal @min(0.0)
    timestamp: DateTime
}

// ============================================================================
// EXCHANGE RATE PROVIDER SERVICE
// ============================================================================

service ExchangeRateProvider {
    
    // Only one way to fail: unsupported currency pair
    async func getCurrentRate(from: Currency, to: Currency) 
        throws NetworkError, TimeoutError
        -> ExchangeRate | UnsupportedCurrency
    {
        guard currencyPairSupported(from, to) 
            or return unsupportedCurrency(from, to)
        
        let response = await httpClient.get("/rates/current/\(from)/\(to)")
        return ExchangeRate.rate(response.rate, from: from, to: to)?
    }
    
    // Multiple domain failures possible
    async func getHistoricalRate(
        from: Currency, 
        to: Currency, 
        date: Date,
        maxAge: Duration = hours(24)
    ) throws NetworkError, TimeoutError 
        -> ExchangeRate | RateRetrievalError
    {
        guard currencyPairSupported(from, to) 
            or return unsupportedCurrency(from, to)
        
        guard withinRateLimit() 
            or return rateLimitExceeded(getRateLimitReset())
        
        let response = await httpClient.get("/rates/historical/\(from)/\(to)/\(date)")
        
        guard response.exists 
            or return rateNotAvailable(from, to, date)
        
        let rate = ExchangeRate.rate(
            response.rate, 
            from: from, 
            to: to,
            timestamp: response.timestamp
        )?
        
        guard rate.isValid(maxAge) 
            or return staleRate(response.timestamp)
        
        return rate
    }
    
    // User-facing API - only returns errors users can act on
    async func getRateForUser(from: Currency, to: Currency)
        throws NetworkError, TimeoutError
        -> ExchangeRate | UserFacingRateError
    {
        // Implementation can only return constrained error cases
        guard currencyPairSupported(from, to) 
            or return unsupportedCurrency(from, to)
        
        guard withinRateLimit() 
            or return rateLimitExceeded(getRateLimitReset())
        
        // Other errors are caught and handled internally
        let response = await httpClient.get("/rates/current/\(from)/\(to)")
        return ExchangeRate.rate(response.rate, from: from, to: to)
            or return unsupportedCurrency(from, to)  // Fallback
    }
}

// ============================================================================
// BEAUTIFUL USAGE EXAMPLES
// ============================================================================

// Example 1: Single error case - clean tuple matching
func displayCurrentRate(from: Currency, to: Currency) {
    try {
        match getCurrentRate(from, to) {
            case success(rate) => 
                print("1 \(from) = \(rate.rate()) \(to)")
            case (from, to) =>  // ✨ No case name needed!
                print("Sorry, \(from) to \(to) conversion not available")
        }
    } catch NetworkError {
        print("Network unavailable")
    }
}

// Example 2: Multiple errors - explicit names required
func displayHistoricalRate(from: Currency, to: Currency, date: Date) {
    try {
        match getHistoricalRate(from, to, date) {
            case success(rate) => 
                print("Rate on \(date): \(rate.rate())")
            case rateNotAvailable(from, to, date) => 
                print("No data available for \(date)")
            case rateLimitExceeded(seconds) => 
                print("Please wait \(seconds) seconds")
            case staleRate(timestamp) =>
                print("Data from \(timestamp) is too old")
        }
    } catch error {
        print("System error: \(error)")
    }
}

// Example 3: Propagation with ?
func convertMoney(amount: Money, to: Currency) 
    throws NetworkError
    -> Money | UnsupportedCurrency | CurrencyMismatch
{
    let rate = getCurrentRate(from: amount.currency, to: to)?
    return rate.convert(amount)?
}

// Example 4: Composition - errors combine naturally
func calculateTotalInTargetCurrency(
    amounts: [Money],
    targetCurrency: Currency
) throws NetworkError -> Money | UnsupportedCurrency | CurrencyMismatch {
    
    mut total = Money.zero(currency: targetCurrency)
    
    for amount in amounts {
        if amount.currency != targetCurrency {
            let rate = getCurrentRate(from: amount.currency, to: targetCurrency)?
            let converted = rate.convert(amount)?
            total = (total + converted)?
        } else {
            total = (total + amount)?
        }
    }
    
    return total
}

// Example 5: Generic error handling when you don't care about specifics
func tryConvert(amount: Money, to: Currency) -> Money {
    try {
        match convertMoney(amount, to) {
            case success(converted) => return converted
            case error => {
                log("Conversion failed: \(error)")
                return amount  // Fallback to original
            }
        }
    } catch error {
        log("System error: \(error)")
        return amount
    }
}
```

## The Power This Unlocks

### 1. Type Safety Increases

```clawr
// Compiler KNOWS this can only fail one way
func getCurrentRate(...) -> ExchangeRate | UnsupportedCurrency {
    // ❌ Compiler error: rateLimitExceeded not in constraint
    return rateLimitExceeded(60)
}
```

### 2. Exhaustiveness Checking Improves

```clawr
// Compiler knows exactly what cases exist
match getCurrentRate(...) {
    case success(rate) => use(rate)
    case (from, to) => handleError(from, to)
    // ✅ Exhaustive! Only one error case possible
}
```

### 3. Refactoring Becomes Safer

```clawr
// Change signature:
func getCurrentRate(...) 
    -> ExchangeRate | UnsupportedCurrency | RateLimitExceeded  // Added new error!

// Compiler now catches incomplete matches:
match getCurrentRate(...) {
    case success(rate) => use(rate)
    case (from, to) => ...  // ❌ Error: ambiguous, multiple cases now
}

// Forces you to handle both:
match getCurrentRate(...) {
    case success(rate) => use(rate)
    case unsupportedCurrency(from, to) => ...
    case rateLimitExceeded(seconds) => ...
    // ✅ Now exhaustive
}
```

### 4. API Design Becomes More Expressive

```clawr
// Clear contract: this API only surfaces user-actionable errors
service PublicAPI {
    func getRate(from: Currency, to: Currency) 
        -> ExchangeRate | UserFacingRateError
    {
        // Internal errors handled, only user-relevant ones exposed
    }
}

// Internal API can have more detailed errors
service InternalRateService {
    func getRate(from: Currency, to: Currency)
        -> ExchangeRate | ExchangeRateError  // All possible errors
    {
        // Full error detail for debugging
    }
}
```

## Next Steps

This feature is now solid! Should we:

1. **Move on to Account and Transaction types** (domain entities with more complex behavior)?
2. **Define pattern matching syntax more rigorously** (nested patterns, guards, etc.)?
3. **Explore `enum` definitions** (we've used Currency as enum but not defined the syntax)?
4. **Design collection operations** (map, filter, fold over Results)?

What excites you most?
