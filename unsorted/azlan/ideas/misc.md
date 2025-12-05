# Miscellaneous Ideas

- Pipe functions: `f3 = f1 | f2` or `return getX() | useX`
- Annotations with implicit strings

    ```azlan
    @REST GET /user/{partnerId}/atom
    get(partnerId: string) -> [Atom]
    ```

- Error handling
  - `defer {}`
  - `Result<ok, error>`
  - Precondition
