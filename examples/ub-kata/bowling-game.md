# the Bowling Game Kata

> [!warning]
> This code has not been tested. There may be bugs.

Here is a Clawr solution to the [Bowling Game kata](http://www.butunclebob.com/ArticleS.UncleBob.TheBowlingGameKata) by “Uncle Bob” Martin.

```clawr
func score(rolls: [integer [0..<10] ]) {
    return [> frameScore(at: frameIndex)
      :: frame <- 0..<10
      |> frameIndex := 0 ~> 2 * frame - strikes'
      |> strikes := 0 ~> isStrike(at: frameIndex) ? strikes' + 1 : strikes'
    ].sum()

    func frameScore(at index: integer [0..<10]) => when {
        isStrike(at: index) => rolls[index] + rolls[index + 1] + rolls[index + 2]
        isSpare(at: index) => rolls[index] + rolls[index + 1]
      _ -> rolls[index]
    }
    func isStrike(at frameIndex: integer [0..<10]) => rolls[frameIndex] == 10
    func isSpare(at frameIndex: integer [0..<10]) => rolls[frameIndex] + rolls[frameIndex + 1] == 10
}
```

This solution uses a zip-generator to avoid maintaining state.
