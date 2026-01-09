A *module* is a source file. A type is defined in a single module. C# has a concept of `partial` classes. Clawr will not copy that. Instead a module defines e.g. an `object` structure completely. No code outside the module will be able to access the `data` or `helper` methods of the `object`.

In order to be able to instantiate an `object`, there must be an accessible factory. That factory can be a static factory method defined on a `companion`, or a free function. Either way, the factory must be defined in the same module as the `object` structure it instantiates.

