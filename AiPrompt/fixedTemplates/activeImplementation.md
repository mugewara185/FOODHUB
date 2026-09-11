Active Implementation Rule

When multiple versions, legacy implementations, mock implementations, or experimental components exist:

First identify which implementation is currently configured/active.
Audit the actual active application flow.
Fix the active implementation.
Do not spend time completing unused/legacy implementations.
Do not switch the application to an inactive version merely to make the task easier.

The goal is to make the currently running customer application correctly connected to its backend/database.

Unused implementations may be documented as technical debt if relevant, but should not expand the scope.