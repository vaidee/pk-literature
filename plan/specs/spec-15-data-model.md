# SPEC-15 --- Data Model

Schemas: catalog, staging, commerce, identity. Core entities: Book,
Author, Publisher, Theme, Genre, Collection, Inventory, ImportRun,
Order, OrderItem, Customer, Address. Relationships: Book-\>Author(M:N),
Book-\>Theme(M:N), Book-\>Publisher(1:N), OrderItem-\>Book(reference).
Acceptance: migrations version-controlled.
