# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run dev` - Start development server with HMR at <http://localhost:5173>
- `npm run typecheck` - Generate React Router types and run TypeScript checking

### Build and Production

- `npm run build` - Build for production (creates client and server builds)
- `npm run start` - Start production server from build output

### Database Management

- `npm run db:reset` - Reset database and run seeds (use after schema changes)
- `npm run db:seed` - Seed database only

### Testing

- `npm run test:e2e` - Run end-to-end tests with Cypress
- `npm run test:e2e:open` - Open Cypress test runner for development
- `npm run cypress:open` - Open Cypress for test development
- `npm run cypress:run` - Run Cypress tests in headless mode

### Docker

- `docker build -t my-app .` - Build Docker image
- `docker run -p 3000:3000 my-app` - Run containerized app

## Architecture

Prompt Lab is a React Router v7 application for managing and organizing AI prompts with authentication, categorization, AI scoring, and public sharing capabilities.

### Core Technology Stack

- **Framework**: React Router v7 with SSR
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with Prisma adapter
- **Styling**: TailwindCSS v4 with Vite plugin
- **AI Integration**: Vercel AI SDK with OpenAI for prompt scoring and generation
- **Payments**: Polar for subscription management

### Project Structure

- `app/` - Main application code
  - `root.tsx` - Root layout with HTML structure and error boundary
  - `routes.ts` - Programmatic route configuration
  - `routes/` - Route components with typed loaders/actions
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks for scoring and API management
  - `lib/` - Shared utilities (auth, prisma, etc.)

### Authentication Architecture

Uses Better Auth with layout-based protection pattern:

- **Auth Layout Pattern**: `auth-layout.tsx` validates sessions once, passes user context to children via `useOutletContext()`
- **Session Management**: Auth validation happens in layout loaders, not individual routes
- **API Endpoints**: Auth routes under `/api/auth/*` handle Better Auth endpoints
- **Route Protection**: Protected routes wrapped in auth layout, public routes standalone

```typescript
// Standard session validation in protected route loaders
const session = await auth.api.getSession({ headers: request.headers });
// Auth layout handles redirect, routes assume authenticated user
```

### Database Schema & Patterns

**Core Models**:

- `User` - Authentication and subscription status with role-based access (USER/ADMIN)
- `Prompt` - Rich prompt structure with 10+ optional fields for prompt engineering, includes scoring fields for AI evaluation
- `Category` - User-owned categorization system with color coding
- `PromptCategory` - Many-to-many relationship for prompt tagging
- `Chain` - Pro feature for linking prompts in sequences with AI evaluation
- `ChainPrompt` - Ordered relationship between chains and prompts

**Key Patterns**:

- User-scoped queries: `where: { userId: session!.user.id }`
- Global Prisma client singleton in `app/lib/prisma.ts` prevents connection exhaustion
- Cascade deletes for user data cleanup

### AI Scoring System

**Architecture**:

- Pro-only feature with contextual hints for all users
- Real-time scoring via `/api/score-prompt` using OpenAI GPT-3.5-turbo
- Field-specific scoring criteria (1-10 scale) with improvement suggestions
- Content generation for Pro users based on existing prompt context

**Key Components**:

- `FieldScoring` - Displays scores and contextual hints
- `usePromptScoring` - Manages scoring state
- `usePromptAPI` - Handles API calls for scoring and generation
- Contextual hints adapt based on task context (marketing, software, writing, etc.)

### Route Configuration

Uses React Router v7 programmatic routing in `app/routes.ts`:

**Public Routes**: `/`, `/pricing`, `/auth/*`, `/share/:id`, `/access-denied`, `/checkout`
**Protected Routes**: `/dashboard`, `/prompts/*`, `/chains/*`, `/categories`, `/profile`, `/billing`

**Layout Pattern**:

```typescript
layout('routes/auth-layout.tsx', [
    route('dashboard', 'routes/dashboard.tsx'),
    // other protected routes
])
```

### Subscription & Feature Gating

- **Free Users**: 5 prompt limit, private prompts only, visual scoring hints, no chains/categories
- **Pro Users**: Unlimited prompts, public sharing, AI scoring, content generation, chains, categories  
- **Admin Users**: Additional admin tools drawer with user management capabilities
- **Subscription Status**: Stored in User model, validated in loaders/actions
- **Payment Integration**: Polar webhooks for subscription management

### Component Patterns

**Typed Route Components**:

```typescript
export default function Component({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: User }>();
    // Component logic
}
```

**Shared Layout**: Consistent navigation and user state across protected routes
**Icon System**: Lucide React icons used throughout
**Form Handling**: React Router's Form component with useFetcher for API calls

## Important Development Notes

### TypeScript Integration

- **Type Generation**: Run `npm run typecheck` after route changes for auto-generated types
- **Route Typing**: Components get typed props via `Route.ComponentProps`
- **Auth Context**: Use `useOutletContext<{ user: User }>()` in protected routes

### Database Workflows

- Run `npm run db:reset` after Prisma schema changes for clean state
- Seed file creates sample prompts and categories for development
- Always validate user ownership in database queries

### AI Integration Guidelines

- Scoring requires Pro subscription validation
- Use streaming responses for real-time feedback
- Content generation has character limits for token efficiency
- Field-specific prompts optimize for quality and consistency

### Common Patterns

- User data scoping: Always filter by `userId` in queries
- Error handling: Use React Router error boundaries and proper HTTP status codes
- Public sharing: Validate prompt visibility in share routes (bypasses auth)
- Session validation: Auth layout handles redirects, routes assume authenticated user

### File Conventions

- Route files follow React Router v7 patterns with typed exports
- Use `~/` path alias for `app/` directory imports
- Loader functions handle server-side data fetching with session validation
- Component imports use absolute paths from `app/`

### Testing Architecture

- **Cypress E2E Testing**: Comprehensive test coverage across user flows
- **Test Environment**: Uses seeded test data with known credentials
- **Test Structure**: 11 test suites covering authentication, prompt management, subscription flows, chain management
- **Test Users**: Pre-seeded with both free and pro users for testing feature gates
- **Configuration**: Base URL <http://localhost:5173>, 2 retries in CI mode

### Server Function Architecture

- **Model Functions**: Database operations abstracted into server models (`app/models/`)
  - `getUserById()` - Safe user data retrieval with subscription status
  - `updateUserSubscriptionByCustomerId()` - Webhook-driven subscription updates
  - Model functions prevent direct Prisma calls in routes and ensure consistent data access patterns

### Session Management Utilities

- **requireAuth()**: Centralized session validation utility (`app/lib/session.ts`)
  - Returns typed `SessionData` with user info, Pro status, and Admin role
  - Handles redirects for unauthenticated requests
  - Used in protected route loaders for consistent auth checking
  - Pro user detection: `subscriptionStatus === 'active'`
  - Admin role detection: `role === 'ADMIN'`
