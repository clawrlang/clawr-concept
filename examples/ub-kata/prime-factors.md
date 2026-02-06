# the Prime Factors Kata

> [!warning]
> This code has not been tested. There may be bugs.

Here is a Clawr solution to the [Prime Factors kata](http://www.butunclebob.com/ArticleS.UncleBob.ThePrimeFactorsKata) by “Uncle Bob” Martin.

```clawr
func primeFactors(of n: integer) -> Generator<integer> =>
  [> candidate
  |> candidate := 2 ~> rem % candidate' == 0 ? candidate' : candidate' + 1
  |> rem := n ~> rem' % candidate == 0 ? rem' / candidate : rem'
  :: rem > 1 && rem % candidate == 0
  ]
}
```
