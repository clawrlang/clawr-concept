```azlan
let x : real[,]  // 2D matrix
let y : real[,,] // 3D matrix
```
Is a 3D matrix meaningful?

We could define matrices by their size. If the second size parameter is 1 it is a column vector, if the first is one it is a row vector. (Are row vectors meaningful?)

An nxm matrix time an nx1 column vector creates an mx1 column vector.

Same-size column vectors can be dot multiplied (with a scalar result) and cross multiplied (yielding a new vector).
