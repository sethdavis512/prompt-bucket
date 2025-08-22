# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with HMR at http://localhost:5173
- `npm run typecheck` - Generate React Router types and run TypeScript checking

### Build and Production
- `npm run build` - Build for production (creates client and server builds)
- `npm run start` - Start production server from build output

### Database Management
- `npm run db:reset` - Reset database and run seeds (use after schema changes)
- `npm run db:seed` - Seed database only

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
- `User` - Authentication and subscription status
- `Prompt` - Rich prompt structure with 10+ optional fields for prompt engineering
- `Category` - User-owned categorization system  
- `PromptCategory` - Many-to-many relationship for prompt tagging

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

**Public Routes**: `/`, `/pricing`, `/auth/*`, `/share/:id`
**Protected Routes**: `/dashboard`, `/prompts/*`, `/profile`, `/billing`

**Layout Pattern**:
```typescript
layout('routes/auth-layout.tsx', [
    route('dashboard', 'routes/dashboard.tsx'),
    // other protected routes
])
```

### Subscription & Feature Gating

- **Free Users**: 5 prompt limit, private prompts only, visual scoring hints
- **Pro Users**: Unlimited prompts, public sharing, AI scoring, content generation
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