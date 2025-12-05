# Strings

## Interpolation

Optimisation: String interpolation of simple values should be inlined as if they were not interpolated.

```azlan
enum Result { success, failureType1, failureType2 }

// Whatever the syntax is...
let sql = $"""
  SELECT
      CASE
          WHEN EXISTS (SELECT 1 FROM Users WHERE id = @id) THEN {Result.failureType1}
          WHEN @partnerId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM PartnerCheck WHERE @partnerId IS NOT NULL) THEN {Result.failureType2}
          ELSE {Result.success}
      END AS result_code;
  """
```

Should be eulvalent:

```azlan
enum Result { success = 0, failureType1 = 1, failureType2 = 2 }

// No interpolation
let sql = """
  SELECT
      CASE
          WHEN EXISTS (SELECT 1 FROM Users WHERE id = @id) THEN 1
          WHEN @partnerId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM PartnerCheck WHERE @partnerId IS NOT NULL) THEN 2
          ELSE 0
      END AS result_code;
  """
```
