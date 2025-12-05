## Encapsulate `data`

```clawr
data User {
  name: string
  roles: [Role]
}

func hasRole(user: User, role: Role) -> boolean {
  return user.roles.contains(role)
}
```

Step 1: Create an `object`:

```clawr
object UserObject {
  func hasRole(role: Role) => hasRole(user: self.userData, role: role)
data:
  ref userData: User
factory:
  func wrap(user: User) => { userData: user }
}
```

Step 2: Create a wrapping `UserObject` instance wherever you create a `User` data structure. Then you can start migrating users to using the `UserObject` instance and its methods instead of accessing `data` directly. You do not have to finish all of them at once though. Take your time.

Step 3: Reverse the order of initialisation. Create the data structure internally to the `object` and call a method to retrieve the `data` structure and assign it to a `ref` variable for existing users that have not yet been migrated.

Step 4: Migrate remaining users to reference the `UserObject` instance instead of the `data` structure. When you no longer use the old `data` structure variables you can remove them. The `UserObject` type still uses the `data` type, so you cannot remove that yet.

Step 5: Move the fields of the `data` structures to  the `UserObject`’s `data:` section. When done, you can remove the now fully obsolete `data` structure.

Step 6: Rename the `object` type to `User`. You can consult Martin Fowler’s book *Refactoring: Improving the Design of Existing Code* (ISBN: 9780134757599) for details.

```clawr
object User {
  func hasRole(role: Role) => hasRole(user: self.userData, role: role)
data:
  name: string
  roles: [Role]
factory:
  func new(name: string, roles: [Role]) => { name, roles }
}
```
