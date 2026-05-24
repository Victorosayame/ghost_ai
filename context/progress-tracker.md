# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 12: Shape panel

## Current Goal

- Feature 12 has been implemented and verified.

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
- Liveblocks setup:
  - Updated `liveblocks.config.ts` with typed `Presence` (cursor position, isThinking) and `UserMeta` (id, name, avatar, color).
  - Created `lib/liveblocks.ts` with cached Liveblocks node client and deterministic `getUserCursorColor()` helper.
  - Created `POST /api/liveblocks-auth/[projectId]` route that requires Clerk authentication, verifies project access, ensures Liveblocks room exists, and returns session token with user metadata.
  - Verified `npm.cmd run lint` and `npm.cmd run build`.
- Base canvas:
  - Expanded `types/canvas.ts` to define shared `NODE_COLORS` and `NODE_SHAPES` constants plus typed `NodeData`, `CanvasNode`, and `CanvasEdge`.
  - Updated `liveblocks.config.ts` storage typing to use `LiveblocksFlow<CanvasNode, CanvasEdge>` instead of `any`.
  - Updated `EditorCanvasWrapper` to accept the server-provided room ID, keep the workspace page server-side, seed the required Liveblocks flow storage, and use themed Liveblocks loading/error fallbacks through a local error boundary.
  - Updated `ReactFlowCanvas` to use typed `useLiveblocksFlow` initial nodes/edges, `ConnectionMode.Loose`, `MiniMap`, and a dot-pattern React Flow background without controls.
  - Replaced workspace canvas placeholder with `EditorCanvasWrapper`.
  - Tightened canvas node and edge data typing so the shared React Flow types satisfy the current Liveblocks and React Flow constraints.
  - Verified `npm.cmd run lint` and `npm.cmd run build` (with network access for `next/font` Google Fonts fetches).
  - Removed the obsolete `components/editor/editor-layout.tsx` after confirming it was no longer used outside a stale workspace shell import.
  - Simplified `EditorWorkspaceShell` to render the verified base-canvas flow through `EditorCanvasWrapper` instead of the incomplete alternate room/template wiring.
  - Removed the unused `components/canvas/canvas-room.tsx` stub after it surfaced as the remaining production type-check blocker.
  - Cleaned related editor token drift so sidebar, home, and AI shell styling matches the documented theme utilities.
  - Re-verified `npm.cmd run lint` and `npm.cmd run build`.
  - Updated the workspace shell so project rooms start with the left project sidebar closed instead of reopening the overlay after navigation.
  - Added an explicit empty-canvas overlay in `ReactFlowCanvas` so a successfully connected but still-empty Liveblocks room no longer looks blank.
  - Repositioned the base-canvas `MiniMap` to the bottom-left so it remains visible alongside the right AI sidebar overlay, and clarified in the empty state that `fitView` only has an effect once nodes exist.
  - Hardened the React Flow mount by wrapping the canvas in `ReactFlowProvider`, giving the viewport explicit full-size dimensions, and raising the empty-state overlay above internal canvas layers so empty rooms render visibly.
  - Rebuilt the Feature 11 implementation from the spec by simplifying `EditorCanvasWrapper` back to the required Liveblocks room setup and simplifying `ReactFlowCanvas` to the requested `useLiveblocksFlow` + `ReactFlow` foundation.
  - Kept the workspace page server-side while preserving typed Liveblocks storage and React Flow synchronization.
  - Updated the AI sidebar shell so it consistently renders as a visible right-side slide-over panel when toggled open.
  - Converted the AI sidebar from a viewport-fixed overlay into a true right-side workspace panel so it now occupies the right edge of the editor layout beside the canvas.
  - Verified `npm.cmd run lint` and `npm.cmd run build`.
  - Fixed React Flow full-height sizing by restoring an unbroken `h-full`/flex/min-height chain from the root layout through the workspace shell into the canvas wrapper, and removed the temporary fixed `800x800` canvas sizing from `ReactFlowCanvas`.
- Shape panel:
  - Added shared shape drag payload typing and a dedicated drag MIME type in `types/canvas.ts`.
  - Added a floating bottom-center shape toolbar with draggable buttons for rectangle, diamond, circle, pill, cylinder, and hexagon.
  - Added React Flow drag-over and drop handling that parses the dragged shape payload, converts screen coordinates into flow coordinates, and creates new `canvasNode` entries in Liveblocks storage using default size, empty label, default color, and generated IDs.
  - Added a temporary custom `canvasNode` renderer so dropped nodes are visible immediately as centered bordered blocks regardless of shape-specific visuals.
  - Fixed the drag-and-drop pipeline by writing the shape payload to both the custom Ghost MIME type and `text/plain`, then loosening the canvas `dragover` gate to recognize dragged shape types before the browser exposes payload data.
  - Kept node placement aligned with the cursor by continuing to use React Flow's `screenToFlowPosition()` conversion and centering the dropped shape around the pointer.
  - Removed the AI sidebar from the main workspace flex row and converted both sidebars into viewport overlays so the canvas no longer shrinks when panels open.
  - Refined the workspace chrome so the canvas stays flush with the page background while the sidebars float above it with translucent surfaces and subtle shadows.
  - Tuned the base canvas presentation by preserving a full-viewport dot grid, removing the heavier minimap shadow treatment, and keeping the drop-state overlay flat instead of card-like.
  - Verified `npm.cmd run lint` and `npm.cmd run build`.
  - Verified `npm.cmd run lint` and `npm.cmd run build` (with network access for `next/font` Google Fonts fetches).

## In Progress

- None currently.

## Next Up

- Next feature spec.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Prisma CLI config loads `.env.local` after `.env` for local development because the app's active `DATABASE_URL` is stored in `.env.local`.
- Feature 07 extends project creation to accept a validated slug-style project ID from the client so project IDs and future Liveblocks room IDs can remain the same identifier.

## Session 8: Started `10-liveblocks-setup.md` implementation. Updated `liveblocks.config.ts` with Presence (cursor, isThinking) and UserMeta (id, name, avatar, color). Created `lib/liveblocks.ts` with cached node client and deterministic cursor color mapping. Created `POST /api/liveblocks-auth/[projectId]` with Clerk auth check, project access verification, room creation, and session token gener
- 2026-05-16: Started PostgreSQL SSL warning fix from `current-issues/current-issue.md`. Added `normalizeDatabaseUrl()` to preserve the current strict TLS behavior by rewriting deprecated strict direct Postgres SSL modes to `sslmode=verify-full` for app and Prisma CLI connections.
- 2026-05-16: Completed PostgreSQL SSL warning fix. `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd exec prisma validate` passed.
- 2026-05-17: Started `09-share-dialog.md` implementation. Added project collaborator APIs, Clerk user enrichment, and workspace share dialog wiring.
- 2026-05-17: Completed `09-share-dialog.md` implementation. `npm.cmd run lint` and `npm.cmd run build` passed.
- 2026-05-19: Completed `11-base-canvas.md` verification and implementation. Added required Liveblocks initial storage, replaced unsupported `ClientSideSuspense` error handling with a local error boundary fallback, tightened shared canvas node/edge typing, and verified `npm.cmd run lint` plus `npm.cmd run build` with network access for `next/font`.
- 2026-05-19: Started Liveblocks auth error fix. Confirmed the canvas auth route was throwing because no Liveblocks server secret was configured in the environment.
- 2026-05-19: Completed Liveblocks auth error handling fix. Added strict Liveblocks secret resolution with `LIVEBLOCKS_SECRET_KEY` and `LIVEBLOCKS_SECRET` support, returned actionable JSON for configuration failures, and surfaced server error messages in the canvas auth client.
- 2026-05-19: Fixed Liveblocks token response shape. Updated the auth route to return the raw `identifyUser()` JSON body instead of nesting the SDK auth response wrapper inside a `token` property.
- 2026-05-19: Fixed Liveblocks room authorization. Replaced identity-only token generation with a prepared session that grants the current project room `FULL_ACCESS` before authorizing the client.
- 2026-05-19: Fixed base canvas wrapper initialization. Added required Liveblocks `initialStorage.flow` seeding in `EditorCanvasWrapper`, removed unsupported `ClientSideSuspense` `onError` usage, and replaced it with a local client error boundary. Verified with `npm.cmd exec tsc --noEmit`.
- 2026-05-20: Re-verified `11-base-canvas.md` after recent workspace changes. Removed unused `editor-layout`, restored `EditorWorkspaceShell` to the shipped `EditorCanvasWrapper` path, deleted the dead `components/canvas/canvas-room.tsx` stub, and verified `npm.cmd run lint` plus `npm.cmd run build`.
- 2026-05-20: Fixed workspace room UX regressions after base-canvas setup. Rooms now load with the project sidebar closed, and empty Liveblocks rooms show a visible ready-state overlay instead of appearing blank. Verified `npm.cmd run lint` and `npm.cmd run build`.
- 2026-05-21: Adjusted base-canvas viewport UX. Moved the `MiniMap` away from the right overlay so it is visible during empty-room states, and documented in the canvas empty state that `fitView` remains inactive until nodes are present. Verified `npm.cmd run lint`.
- 2026-05-21: Strengthened the base-canvas mount. Added `ReactFlowProvider`, explicit full-size React Flow sizing, and a higher-priority empty overlay so empty connected rooms render visible canvas UI instead of appearing blank. Verified `npm.cmd run lint`.
- 2026-05-21: Reimplemented `11-base-canvas.md` cleanly from the spec. Reset the canvas wrapper and React Flow surface to the required Liveblocks-backed base foundation, retained typed room storage, and fixed the AI sidebar to display as a right-side panel when open. Verified `npm.cmd run lint` and `npm.cmd run build`.
- 2026-05-21: Updated the editor workspace layout so the AI sidebar is a real right-side panel within the main workspace flex layout instead of a fixed overlay. Verified `npm.cmd run lint` and `npm.cmd run build`.
- 2026-05-24: Completed `12-shape-panel.md` implementation. Added the bottom drag-to-create shape toolbar, Liveblocks-backed drop node creation, and a temporary custom `canvasNode` renderer. Verified `npm.cmd run lint` and `npm.cmd run build`.
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
