# GUI Should not Drive Design

(But it might be an *understandable proxy* for purpose.)

GUI-first is not top-down. The GUI is not the top. REST APIs are higher up (if using a client / server architecture —  and REST). But even they are not truly “the top.” Above the REST API are business rules, domain needs. Above them… The purpose for the business itself. Why does it exist?

The true top is our values. What do we care about? What world do we want to live in? But I don’t want to discuss the Hierarchy of Purpose here. I want to discuss why GUI is not the top *technical* motivation.

Since we are human beings, we like to anthropomorphise, and we like to focus on the human element. We easily default to thinking of the GUI as the thing that motivates the technology underneath. But the GUI is an *implementation detail*. It exists to provide an interaction point for the user. The true purpose of a system is not to interact, it is to process the resulting information in specific ways.

The processes can be modelled using a REST API, an MVC controller, a system of commands etc. This is the top layer in the architecture if we think of it as an hierarchy (or the core if we see it as an onion).

But isn’t the domain model the core?

Yes. When looking at the dependency structure, the model is the element that is referenced, not referencing. It is the core of the system. The part that can be reused in any technical application.

But the processes are what give the model its external shape. They define what the model needs to *be*. I said that they “can be modelled using a REST API.” That doesn’t mean that they *are* the REST API. The REST API too is an implementation detail. But it is the interface between API and model that should guide implementation and design.

When the processes are known, interactions can be determined. The interactions give rise to a GUI. We need this input field, not because we designed the GUI this way, but because the data entered into the field is needed by the processes. The processes are needed to solve the problems of the domain. To satisfy the needs of the business.

This is *Teleological Purpose*.
