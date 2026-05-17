# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 09: Share dialog

## Current Goal

- Share dialog implementation is complete; ready for the next feature spec.

## Completed

- Design system and UI primitive setup:
  - Installed and configured `shadcn/ui`.
  - Added Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea primitives.
  - Installed `lucide-react`.
  - Added shared `cn()` helper in `lib/utils.ts`.
  - Added dark-only Ghost AI theme tokens and Tailwind mappings in `app/globals.css`.
  - Verified lint and production build.
- Editor chrome:
  - Added reusable editor navbar in `components/editor/editor-navbar.tsx`.
  - Added floating project sidebar shell in `components/editor/project-sidebar.tsx`.
  - Confirmed existing shadcn Dialog primitives support title, description, and footer actions using theme tokens.
  - Verified lint and production build.
- Authentication:
  - Installed `@clerk/ui`.
  - Wrapped the root layout with `ClerkProvider` using Clerk's dark theme and app CSS variables.
  - Added sign-in and sign-up routes with minimal two-panel desktop auth layouts and form-only mobile layouts.
  - Added standard Clerk auth page URL env entries for `/sign-in` and `/sign-up`.
  - Added root `proxy.ts` route protection with public auth routes and protected-by-default behavior.
  - Updated `/` to redirect authenticated users to `/editor` and unauthenticated users to `/sign-in`.
  - Added a minimal protected `/editor` page using the editor layout.
  - Added Clerk's built-in `UserButton` to the editor navbar.
  - Verified lint and production build.
- Project dialogs and editor home:
  - Added the `/editor` empty-home content with the specified heading, description, and `New Project` button.
  - Added a dedicated `useProjectDialogs()` hook for mock project data, dialog state, form state, slug preview, and loading state.
  - Added create, rename, and delete project dialogs wired to mock project mutations only.
  - Added owned-project rename/delete sidebar actions and hid actions for shared collaborator projects.
  - Added mobile sidebar backdrop scrim that closes the sidebar when tapped.
  - Verified lint and production build.
- Prisma schema and data layer:
  - Added `ProjectStatus`, `Project`, and `ProjectCollaborator` schema definitions with required relations, cascade delete, unique constraints, timestamps, and indexes.
  - Added the initial `init_projects` Prisma migration.
  - Generated the Prisma Client output under `app/generated/prisma`.
  - Added `lib/prisma.ts` with a cached Prisma singleton that uses Accelerate for `prisma+postgres://` URLs and `@prisma/adapter-pg` for direct PostgreSQL URLs.
  - Updated Prisma config to load `.env.local` after `.env` so local migration commands can use the app's configured database URL.
  - Applied the migration to the configured database.
  - Verified Prisma validate, Prisma generate, migration status, lint, and production build.
- Project API routes:
  - Added `GET /api/projects` for listing the authenticated user's owned projects.
  - Added `POST /api/projects` for creating projects with the Clerk user ID as `ownerId` and `Untitled Project` as the missing/blank-name fallback.
  - Added `PATCH /api/projects/[projectId]` for owner-only project renames.
  - Added `DELETE /api/projects/[projectId]` for owner-only project deletion.
  - Added shared project route input parsing and response helpers.
  - Allowed `/api/projects` requests through Clerk proxy protection so route handlers can return explicit `401` and `403` JSON responses.
  - Verified lint and production build.
- Editor home API wiring:
  - Updated `/editor` to fetch owned and shared projects server-side and pass serialized project summaries into the editor shell.
  - Added `hooks/use-project-actions.ts` for create, rename, and delete dialog state plus project API mutations.
  - Replaced mock project dialog/sidebar state with real server-provided project lists.
  - Added slug-and-suffix room ID preview for project creation and submitted that ID to `POST /api/projects`.
  - Updated project creation so the database project ID can align with the future Liveblocks room ID.
  - Added sidebar project navigation to `/editor/[projectId]`.
  - Added a minimal protected `/editor/[projectId]` workspace route for created/opened projects.
  - Verified `npm.cmd run lint` and `npm.cmd run build`.
- Editor workspace shell:
  - Added reusable project access helpers for Clerk identity lookup and owner/collaborator access checks.
  - Added the `AccessDenied` editor state for missing or unauthorized projects.
  - Added workspace shell UI with project-aware navbar, share action placeholder, AI sidebar toggle, canvas placeholder, and right AI sidebar placeholder.
  - Added current project highlighting in the project sidebar.
  - Renamed the dynamic workspace route segment to `/editor/[roomId]` while preserving the same `/editor/:id` URL shape.
  - Verified `npm.cmd run lint` and `npm.cmd run build`.
- Prisma PostgreSQL SSL warning fix:
  - Added shared database URL normalization for direct PostgreSQL connections.
  - Rewrites deprecated strict SSL modes (`prefer`, `require`, `verify-ca`) to explicit `sslmode=verify-full`.
  - Applied the normalization to both runtime Prisma adapter setup and Prisma CLI config.
  - Verified `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd exec prisma validate`.
- Share dialog:
  - Added collaborator listing, inviting, and removal API routes under the project API boundary.
  - Added server-side owner enforcement for invite and remove actions.
  - Added Clerk Backend API enrichment for collaborator display names and avatar images with email-only fallback.
  - Wired the workspace Share button to an owner-capable/read-only share dialog.
  - Added owner-only project link copying with temporary `Copied!` feedback.
  - Verified `npm.cmd run lint` and `npm.cmd run build`.

## In Progress

- None currently.

## Next Up

- Next feature spec.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Prisma CLI config loads `.env.local` after `.env` for local development because the app's active `DATABASE_URL` is stored in `.env.local`.
- Feature 07 extends project creation to accept a validated slug-style project ID from the client so project IDs and future Liveblocks room IDs can remain the same identifier.

## Session Notes

- 2026-05-16: Started PostgreSQL SSL warning fix from `current-issues/current-issue.md`. Added `normalizeDatabaseUrl()` to preserve the current strict TLS behavior by rewriting deprecated strict direct Postgres SSL modes to `sslmode=verify-full` for app and Prisma CLI connections.
- 2026-05-16: Completed PostgreSQL SSL warning fix. `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd exec prisma validate` passed.
- 2026-05-17: Started `09-share-dialog.md` implementation. Added project collaborator APIs, Clerk user enrichment, and workspace share dialog wiring.
- 2026-05-17: Completed `09-share-dialog.md` implementation. `npm.cmd run lint` and `npm.cmd run build` passed.
- 2026-05-16: Started `07-wire-editor-home.md` implementation.
- 2026-05-16: Completed `07-wire-editor-home.md` implementation. `npm.cmd run lint` and `npm.cmd run build` passed.
- 2026-05-16: Started `08-editor-workspace-shell.md` implementation. Added server-side access helpers, AccessDenied UI, active project sidebar highlighting, and placeholder workspace shell.
- 2026-05-16: Completed `08-editor-workspace-shell.md` implementation. `npm.cmd run lint` and `npm.cmd run build` passed.
- 2026-05-16: Started `06-project-apis.md` implementation. Added explicit project API route auth checks so unauthenticated project API requests can return `401` from the handlers.
- 2026-05-16: Completed `06-project-apis.md` implementation. `npm.cmd run lint` and `npm.cmd run build` passed.
- 2026-05-16: Started `05-prisma.md` implementation.
- 2026-05-16: Completed `05-prisma.md` implementation. Prisma migration `20260516104100_init_projects` applied successfully. `prisma validate`, `prisma generate`, `prisma migrate status`, `npm.cmd run lint`, and `npm.cmd run build` passed.
- 2026-05-14: Started `04-project-dialogs.md` implementation.
- 2026-05-14: Completed `04-project-dialogs.md` implementation. `npm.cmd run lint` passed. `npm.cmd run build` passed.
- 2026-05-12: Started `01-design-system.md` implementation.
- 2026-05-12: shadcn initialized with Radix/Lucide setup; requested primitives generated under `components/ui/`.
- 2026-05-12: `npm.cmd run lint` passed. `npm.cmd run build` passed after allowing network access for `next/font` to fetch Geist metadata. Existing dev server is running at `http://localhost:3000`.
- 2026-05-12: Started `02-editor-chrome.md` implementation.
- 2026-05-12: Added editor navbar and floating project sidebar shell. `npm.cmd run lint` passed. `npm.cmd run build` passed after allowing Google Fonts access for `next/font`.
- 2026-05-13: Started `03-auth.md` implementation.
- 2026-05-13: Completed `03-auth.md` implementation. `npm.cmd run lint` passed. `npm.cmd run build` passed.
- 2026-05-13: Fixed invalid Tailwind color token usage in the auth shell and project sidebar so theme colors resolve from `globals.css`.
- 2026-05-13: Fixed Clerk post-auth redirects by forcing sign-in/sign-up success to `/editor` and redirecting already-authenticated auth page requests away from the auth shell.
- 2026-05-13: Added provider-level Clerk redirect settings and a client auth-page redirect guard so signed-in clients cannot remain on blank auth forms.
- 2026-05-13: Added proxy-level redirect from public auth routes to `/editor` for already-authenticated requests.
