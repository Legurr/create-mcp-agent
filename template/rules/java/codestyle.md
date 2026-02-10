## ☕ Java Codestyle (`java/codestyle.md`)

This guide outlines the standard conventions for Java development to ensure consistency and maintainability.

### 1. Naming Conventions

* **Classes & Interfaces:** `PascalCase` (e.g., `OrderService`).
* **Methods & Variables:** `camelCase` (e.g., `getUserData`).
* **Constants:** `UPPER_SNAKE_CASE` (e.g., `DEFAULT_TIMEOUT`).
* **Packages:** All lowercase, period-separated (e.g., `com.project.api.util`).

### 2. Formatting

* **Indentation:** 4 spaces (no tabs).
* **Line Length:** Maximum **120 characters**.
* **Braces:** Use Egyptian style (open brace at the end of the line).
```java
public void process() {
    if (isReady) {
        execute();
    }
}

```



### 3. Best Practices

* **Avoid Wildcard Imports:** Import specific classes (no `import java.util.*`).
* **Null Safety:** Prefer `Optional<T>` over returning `null`.
* **Immutability:** Use `final` for variables and fields that should not change after initialization.
* **Comments:** Use Javadoc (`/** ... */`) for public APIs and clean, self-documenting code for internal logic.
