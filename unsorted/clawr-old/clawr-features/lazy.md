Det är vanligt med någon form av `lazy`-struktur i existerande språk. C# har `Lazy<T>` som accessas genom en property `Lazy<T>.Value`. Swift har `lazy var`, men inte `lazy let`. Båda fallen känns fel.

1. C# exponerar implementationen. Användaren av `Lazy<T>` måste accessa värdet genom `.Value`.
2. De kräver `mutable`-variabler, men från min synvinkel är det mer troligt att man vill ha immutability.

Tänk om man kunde göra något i stil med det här:

```clawr
object LazyInitObject {
  func x() => x

data:
  let x = lazy () => 12 + 30 // Kan vara en mer komplex beräkning (som tar tid att utföra)

  // Kanske lambda kan vara implicit? Det måste alltid vara en tom parameter-lista.
  let y = lazy 12 + 30
}
```

Fälten `x`, `y` är inte initierade från start, men de är ändå `let`. Dvs man kan inte ändra värdet så fort det beräknats och det beräknas bara en gång.
`let` får betydelsen “det här är ett konstant värde (även om det kräver en beräkning för att ta reda på det)”.

---

Din observation är träffsäker! Både C# och Swift har designbegränsningar som gör lazy evaluation mer omständlig än nödvändigt.

## Problemet med nuvarande lösningar

**C#'s `Lazy<T>.Value`:**

- Läcker implementationsdetaljer genom API:et
- Skapar onödig syntaktisk overhead vid varje användning
- Bryter mot principen om transparent lazy evaluation

**Swift's `lazy var`:**

- Tvingar mutability trots att värdet aldrig ändras efter första beräkningen
- Semantiskt motsägelsefullt: "mutable" används för att beskriva något som faktiskt är write-once

## Din lösning är elegant

```clawr
let x = lazy () => expensiveComputation()
let y = lazy simpleExpression  // Med implicit lambda
```

Detta ger flera fördelar:

### 1. **Semantisk korrekthet**

`let` betyder "detta värde förändras aldrig från användarens perspektiv" - vilket är exakt vad lazy evaluation ger. Att implementationen kräver en intern write-once-operation är en detalj som inte bör påverka interface:et.

### 2. **Transparent access**

```clawr
func x() => x  // Samma syntax som vanliga fält
```

Ingen `.Value`, ingen special-syntax. Användaren behöver inte veta eller bry sig om att `x` är lazy.

### 3. **Immutability by default**

Detta följer moderna språkprinciper (Rust, Kotlin, etc.) där immutability är standard och mutability är opt-in.

## Implementationsdetaljer att överväga

**Thread-safety:**

```clawr
let x = lazy:synchronized () => computation()  // Garanterar atomär initiering
let y = lazy:unsafe () => fastComputation()    // För single-threaded contexts
```

**Evaluated-flag:**
Internt kan kompilatorn generera:

```
struct LazyField<T> {
  value: Option<T>
  initializer: () => T
}
```

**Potentiell syntax-variation:**

```clawr
let x: lazy Int = expensiveComputation()  // Type annotation style
let y = lazy { complexBlock() }           // Block syntax
```

Din idé löser ett verkligt problem på ett rent sätt. Det är en bra balans mellan användarvänlighet och språkets semantiska konsistens.
