# Completion Checkpoint

A feature is COMPLETE only when:

1. Implementation exists.
2. Existing architecture is respected.
3. Frontend/backend contracts work.
4. Loading/error/empty states are handled.
5. Refresh/deep-link scenarios are considered.
6. Relevant runtime flows are verified where possible.
7. TypeScript checks pass.
8. Dead/obsolete code introduced by the work is removed.
9. Relevant context.md is updated with actual final state.
10. No explicitly requested functionality remains unfinished.
11. For data-backed features, persistence is verified across refresh/re-login, and server-side ownership/authorization is verified.

Never declare a feature complete based solely on static inspection when
runtime verification is possible.

If runtime verification is unavailable:

⚠️ VERIFICATION REMAINS