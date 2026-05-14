# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation implementation

## Current Goal

- Select the next feature spec for implementation.

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

## In Progress

- None currently.

## Next Up

- Select the next feature spec for implementation.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

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
