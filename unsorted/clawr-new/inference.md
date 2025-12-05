`12.3` (decimal med punkt) => `real`
`123` (decimal utan punkt) => `integer`, men kan implicit konverteras till `real`
`0t`, `0h` => `tritfield`, men kan implicit konverteras till `integer`, `real`
`0x`, `0b` => `bitfield`, men kan implicit konverteras till `integer`, `real`, `tritfield`

Så typen är en lista till den kollapsar:

```swift
struct UnresolvedExpression {
  var inferredType: [ClawrType]
}
```

Eller så kan man se det som en slags informell arvskedja: `bitfield: tritfield: integer: real`. Men det gäller bara för literaler, inte för resolverade värden.
