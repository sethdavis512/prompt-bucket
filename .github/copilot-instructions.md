# Copilot Instructions for Prompt Lab

## Project Overview

Prompt Lab is a React Router v7 application for managing and organizing AI prompts with authentication, categorization, and public sharing capabilities. Built with TypeScript, Prisma, Better Auth, and TailwindCSS.

## Architecture & Patterns

### Route Structure

- Uses programmatic routing in `app/routes.ts` with layout-based auth protection
- Protected routes wrapped in `auth-layout.tsx` which validates sessions and redirects unauthenticated users
- Public routes: `/`, `/auth/*`, `/share/:id`, `/access-denied`
- Protected routes: `/dashboard`, `/prompts/*`, `/categories`, `/profile`

### Authentication Flow

- **Better Auth** handles auth with Prisma adapter (`app/lib/auth.ts`)
- Session validation happens in layout loaders, not individual routes
- Auth layout pattern: `auth-layout.tsx` validates once, passes user context to children via `useOutletContext()`
- API routes under `/api/auth/*` handle Better Auth endpoints

### Database Patterns

- **Prisma** with PostgreSQL for data persistence
- Key models: `User`, `Prompt`, `Category`, `PromptCategory` (many-to-many)
- Prompts have rich structure with 10+ optional fields for prompt engineering (taskContext, toneContext, etc.)
- Global Prisma client singleton in `app/lib/prisma.ts` prevents connection exhaustion

### Component Architecture

- Shared `Layout` component handles navigation and user state display
- Route components follow React Router v7 patterns with typed loaders/actions
- Uses Lucide React icons consistently throughout UI

## Development Workflows

### Essential Commands

```bash
npm run dev          # Development server with HMR
npm run typecheck    # Generate React Router types + TypeScript check
npm run build        # Production build (client + server)
npm run db:reset     # Reset database and run seeds
npm run db:seed      # Seed database only
```

### Database Management

- Run `npm run db:reset` after schema changes for clean state
- Seed file at `prisma/seed.ts` creates sample data
- Always run `npm run typecheck` after route changes for type generation

### File Conventions

- Route files follow React Router v7 patterns with typed exports
- Use `~/` path alias for `app/` directory imports
- Loader functions handle server-side data fetching with session validation
- Component props typed via `Route.ComponentProps` from generated types

## Key Integration Points

### Session Management

```typescript
// In protected route loaders
const session = await auth.api.getSession({ headers: request.headers });
// Auth layout handles redirect, routes assume authenticated user
```

### Database Queries

```typescript
// Standard pattern for user-scoped queries
const prompts = await prisma.prompt.findMany({
    where: { userId: session!.user.id },
    include: { categories: { include: { category: true } } }
});
```

### Public Sharing

- Prompts have `public` boolean field for sharing
- Public prompts accessible via `/share/:id` without authentication
- Share URLs use prompt ID directly (consider security implications)

## Project-Specific Patterns

### Error Boundaries

- Root layout includes React Router error boundary
- Auth failures handled via redirects, not error boundaries

### Styling Approach

- TailwindCSS v4 with Vite plugin integration
- Consistent color scheme: indigo primary, gray neutrals
- Mobile-responsive design with `sm:`, `lg:` breakpoints

### Type Safety

- Strict TypeScript configuration
- React Router generates route-specific types automatically
- Better Auth provides typed session/user interfaces

## Common Gotchas

- Run `npm run typecheck` after adding/modifying routes for type generation
- Auth layout context typing requires `useOutletContext<typeof loaderData>()`
- Prisma queries in loaders need proper error handling for non-existent records
- Public sharing bypasses auth - validate prompt visibility in share routes
