## 🅰️ Angular Styleguide (`angular/styleguide.md`)

Aligned with the official Angular "Style Guide" and industry best practices.

### 1. File Structure & Organization

* **Rule of One:** One component/service per file.
* **Naming:** Use `kebab-case` with the type suffix:
* `user-profile.component.ts`
* `auth.service.ts`


* **Folder Structure:** Group by feature (e.g., `features/login/`, `shared/components/`).

### 2. Components & Templates

* **Selectors:** Use `kebab-case` with a custom prefix (e.g., `app-header`).
* **Logic Separation:** Keep components "lean." Delegate complex business logic to **Services**.
* **Change Detection:** Use `ChangeDetectionStrategy.OnPush` to improve performance.

### 3. RxJS & State Management

* **Memory Leaks:** Always unsubscribe from Observables. Use the `async` pipe in templates or `takeUntilDestroyed()` (in Angular 16+).
* **Strict Typing:** Avoid `any`. Define interfaces for all data structures.
```typescript
public data$: Observable<User[]>;

```



### 4. Styles

* **Encapsulation:** Keep styles scoped to the component (default).
* **SCSS:** Use variables and mixins for consistent theming across the app.