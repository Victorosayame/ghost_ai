# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 05 (Prisma Schema And Data Layer)

## Current Goal

- Add project/collaborator Prisma models, create the Prisma client singleton, run the first migration, and verify the build.

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

## In Progress

- None currently.

## Next Up

- Feature 06.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Prisma CLI config loads `.env.local` after `.env` for local development because the app's active `DATABASE_URL` is stored in `.env.local`.

## Session Notes

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
