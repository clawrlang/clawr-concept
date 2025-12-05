#

```azlan
// No headers
object Customer {
  mut name: string

  name() => self.name

mutating:
  setName(name: string) { self.name = name }
}
```
