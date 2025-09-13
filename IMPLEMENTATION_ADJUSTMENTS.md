# Implementation Adjustments - Prompt Library App

This document tracks the major adjustments made during the implementation of the Prompt Library App, from initial conception to final deployment.

## Initial Requirements vs. Final Implementation

### Database Changes

**Original Plan**: Use Prisma dev database  
**Adjustment**: Switched to local PostgreSQL database (`prompt_lab`)

- **Reason**: User preference for local PostgreSQL over managed Prisma dev environment
- **Impact**: Required manual database creation and connection string updates

**Database Schema Evolution**:

- **Original**: Custom auth schema design
- **Adjustment 1**: Updated schema for BetterAuth compatibility with Prisma adapter
- **Adjustment 2**: Used BetterAuth CLI to generate proper schema (`npx @better-auth/cli@latest generate --yes`)
- **Final Schema**: BetterAuth-generated schema with Account model including password field and Verification model
- **Reason**: BetterAuth has very specific database requirements that must be met exactly

### Authentication Architecture - Major Evolution

**Phase 1: Client-Side Attempt**

- **Original Plan**: Server-side authentication with BetterAuth using database adapter
- **First Adjustment**: Client-side authentication with mock data
- **Issue**: User rejected client-side patterns - "This code is horribly wrong. Go back to the rules and fix it"

**Phase 2: Brooks Rules RR7 Compliance**

- **Critical Discovery**: Must follow "Brooks Rules RR7" for React Router 7 patterns
- **Key Insight**: No `useLoaderData` or `useActionData` hooks - "Those are old hat"
- **Pattern**: Use `Route.ComponentProps` with loaders and actions for server-side data

**Phase 3: Auth Layout Pattern (FINAL)**

- **Major Breakthrough**: Implemented auth layout route to wrap protected routes
- **Architecture**: Single authentication point with outlet context pattern
- **Solution**: `layout("routes/auth-layout.tsx", [protected routes])` in routing config

### React Router 7 Pattern Evolution

**Wrong Pattern (Initially Implemented)**:

```typescript
export default function MyComponent() {
  const data = useLoaderData<typeof loader>() // WRONG
  const actionData = useActionData<typeof action>() // WRONG
}
```

**Correct Pattern (Brooks Rules RR7)**:

```typescript
export default function MyComponent({ loaderData }: Route.ComponentProps) {
  // Direct access to props from loader
}

export async function loader({ request }: Route.LoaderArgs) {
  // Server-side data loading and authentication
  return data
}
```

**Auth Layout Pattern (FINAL)**:

```typescript
// routes/auth-layout.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw redirect("/auth/sign-in")
  
  // Load route-specific data based on pathname
  const url = new URL(request.url)
  const pathname = url.pathname
  
  if (pathname === '/dashboard') {
    // Load dashboard data
  }
  if (pathname === '/prompts') {
    // Load prompts data with search/filter
  }
  
  return { user: session.user, ...routeData }
}

export default function AuthLayout({ loaderData }: Route.ComponentProps) {
  return <Outlet context={loaderData} />
}

// Child routes
export default function Dashboard() {
  const { user, prompts, categories } = useOutletContext<{...}>()
}
```

### BetterAuth Integration - Trial and Error Process

**Phase 1**: Manual schema design - **FAILED**

- Custom Account/Session models caused 500 errors
- Schema conflicts between custom design and BetterAuth expectations

**Phase 2**: BetterAuth CLI generation - **SUCCESS**

- Command: `npx @better-auth/cli@latest generate --yes`
- Auto-generated proper schema with all required fields
- Fixed database compatibility issues

**Phase 3**: Server-side API integration - **SUCCESS**

- Proper usage: `auth.api.signInEmail({ body: { email, password }, headers: request.headers })`
- Correct session checking: `auth.api.getSession({ headers: request.headers })`
- Follow BetterAuth server-side patterns exactly

### Routing Architecture - Final Solution

**Problem**: Navigation between protected routes failed

- Routes existed but had authentication/data loading issues
- User reported: "I'm not able to navigate anywhere once inside the dashboard"

**Solution**: Auth Layout Wrapper Pattern

```typescript
// routes.ts
export default [
  // Public routes
  index("routes/home.tsx"),
  route("/auth/sign-in", "routes/auth/sign-in.tsx"),
  route("/auth/sign-up", "routes/auth/sign-up.tsx"),
  
  // Protected routes wrapped in auth layout
  layout("routes/auth-layout.tsx", [
    route("/dashboard", "routes/dashboard.tsx"),
    route("/prompts", "routes/prompts/index.tsx"),
    route("/prompts/new", "routes/prompts/new.tsx"),
    route("/prompts/:id", "routes/prompts/detail.tsx"),
    route("/prompts/:id/edit", "routes/prompts/edit.tsx"),
    route("/categories", "routes/categories.tsx"),
    route("/profile", "routes/profile.tsx"),
  ])
] satisfies RouteConfig;
```

**Benefits**:

- Single authentication point
- No duplicate auth logic in each route
- Centralized data loading based on route
- Clean outlet context pattern for child routes

### Form Handling - Server Actions

**Final Pattern**: React Router `Form` with server actions

```typescript
// Signin form
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: request.headers
    })
    return redirect("/dashboard")
  } catch (error) {
    return { error: "Invalid email or password" }
  }
}

export default function SignIn({ actionData }: Route.ComponentProps) {
  return (
    <Form method="post">
      {/* form fields */}
      {actionData?.error && <div>{actionData.error}</div>}
    </Form>
  )
}
```

## Critical Pattern Violations Corrected

### 1. "Brooks Rules RR7" Compliance

- **Violation**: Using `useLoaderData`/`useActionData` hooks
- **Correction**: Use `Route.ComponentProps` pattern exclusively
- **Impact**: Complete refactor of all route components

### 2. Authentication Patterns

- **Violation**: Client-side authentication with useEffect
- **Correction**: Server-side authentication in loaders with BetterAuth
- **Impact**: Proper server-side rendering and security

### 3. Data Loading Strategy

- **Violation**: Mock data and client-side fetching
- **Correction**: Server-side data loading in auth layout based on route
- **Impact**: Real database integration with proper authentication

## Key Technical Decisions - Final

### 1. BetterAuth Configuration

- **Decision**: Use BetterAuth CLI to generate schema
- **Configuration**: `prismaAdapter` with PostgreSQL provider
- **Server API**: Use `auth.api.*` methods with proper body/headers structure

### 2. Environment Configuration

- **Required**: `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- **Database**: Local PostgreSQL connection string
- **Commands**: `psql -c "CREATE DATABASE prompt_lab;"`

### 3. Route Data Loading

- **Pattern**: Auth layout handles all data loading
- **Logic**: Route-specific data loading based on `url.pathname`
- **Context**: Pass data through `useOutletContext` to child routes

## Development Workflow - Lessons

### 1. Authentication First

- Get BetterAuth working properly before building features
- Use BetterAuth CLI for schema generation
- Test signin/signup flow before proceeding

### 2. Follow Framework Patterns

- React Router 7 has specific patterns that must be followed
- Don't mix React Router 6 patterns with v7
- Use loaders/actions for server-side logic

### 3. Incremental Implementation

- Build auth layout first
- Add routes one by one
- Test navigation between routes

## Next Steps for Better Initial Prompts

### 1. Auth Setup Instructions

```bash
# Database setup
psql -c "CREATE DATABASE prompt_lab;"

# Schema generation
npx @better-auth/cli@latest generate --yes

# Environment variables
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:5173
DATABASE_URL=postgresql://username:password@localhost:5432/prompt_lab
```

### 2. Required Pattern Examples

- Auth layout with outlet context
- Route.ComponentProps usage
- BetterAuth server-side API calls
- Form actions with server-side validation

### 3. File Structure Template

```
app/
  routes/
    auth-layout.tsx           # Auth wrapper with data loading
    dashboard.tsx            # Uses useOutletContext
    prompts/
      index.tsx             # Uses useOutletContext
      new.tsx              # Uses useOutletContext
    auth/
      signin.tsx           # Form with action
      signup.tsx           # Form with action
  lib/
    auth.ts                 # BetterAuth config
```

## Authentication Flow Fix - Session Cookie Handling

### Problem Discovery

**Issue**: Authentication forms were failing with 500 errors and "Failed to reload" messages

- User could see signin form but authentication wasn't working
- Server was receiving auth requests but session cookies weren't being set properly
- Error: `[vite] Failed to reload /app/routes/auth/sign-in.tsx`

### Root Cause Analysis

**Initial Implementation**: Using `auth.api.*` methods directly in server actions

```typescript
// BROKEN - Direct API usage without proper cookie handling
const response = await auth.api.signInEmail({
  body: { email, password },
  headers: request.headers
});
```

**Problem**: While BetterAuth was processing authentication, the session cookies from the auth response weren't being properly captured and forwarded to the client.

### Solution Implementation

**Fixed Approach**: Make HTTP requests to BetterAuth API endpoints and capture/forward cookies

```typescript
// WORKING - Proper cookie handling pattern
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // Make HTTP request to actual BetterAuth endpoint
    const authResponse = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (authResponse.ok) {
      // CRITICAL: Capture Set-Cookie headers from BetterAuth
      const setCookieHeaders = authResponse.headers.getSetCookie?.() || authResponse.headers.get('set-cookie');
      
      // Create redirect response
      const redirectResponse = redirect('/dashboard');
      
      // CRITICAL: Forward session cookies to client
      if (setCookieHeaders) {
        if (Array.isArray(setCookieHeaders)) {
          setCookieHeaders.forEach(cookie => {
            redirectResponse.headers.append('Set-Cookie', cookie);
          });
        } else {
          redirectResponse.headers.set('Set-Cookie', setCookieHeaders);
        }
      }
      
      return redirectResponse;
    }

    const errorData = await authResponse.json().catch(() => ({}));
    return { error: errorData.message || 'Invalid email or password' };
  } catch (error) {
    console.error('Auth error:', error);
    return { error: 'Invalid email or password' };
  }
}
```

### Key Technical Insights

**Cookie Handling Pattern**:

1. **Fetch to BetterAuth endpoints**: `/api/auth/sign-in/email` and `/api/auth/sign-up/email`
2. **Capture cookies**: Use `getSetCookie()` or `get('set-cookie')` from response headers
3. **Forward cookies**: Attach to redirect response so browser receives session cookies
4. **Session persistence**: Cookies enable auth layout to verify sessions on subsequent requests

**BetterAuth API Endpoint Structure**:

- Signin: `POST /api/auth/sign-in/email`
- Signup: `POST /api/auth/sign-up/email`
- Session check: `auth.api.getSession({ headers: request.headers })` (this works correctly)

### Authentication Flow - Complete Picture

**User Journey**:

1. User submits signin/signup form
2. Server action makes HTTP request to BetterAuth API
3. BetterAuth returns session cookies in `Set-Cookie` headers
4. Server action captures cookies and attaches to redirect response
5. Browser receives redirect + session cookies
6. Auth layout loader can now verify session with `auth.api.getSession()`
7. User successfully accesses protected routes

**Files Updated**:

- `/app/routes/auth/sign-in.tsx` - Fixed cookie handling in action
- `/app/routes/auth/sign-up.tsx` - Fixed cookie handling in action
- Removed unused `auth` imports since we're using direct HTTP requests

### Impact

- ✅ **Authentication now works**: Users can sign in and stay authenticated
- ✅ **Session persistence**: Cookies properly set and maintained
- ✅ **Proper redirects**: Auth flow redirects to dashboard after success
- ✅ **Error handling**: Actual API errors displayed to users

This fix was critical for the entire application functionality, as authentication is the foundation for all protected routes and features.

## Prisma Client Singleton Pattern Fix

### Problem Discovery

**Issue**: Improper PrismaClient instantiation throughout the application

- Multiple `new PrismaClient()` instances created across route files
- Potential connection leaks and performance issues
- Violation of Prisma React Router 7 best practices

### Root Cause Analysis

**Initial Implementation**: Direct PrismaClient instantiation in route files

```typescript
// WRONG - Multiple client instances
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function loader() {
  // Using local prisma instance
  return await prisma.user.findMany()
}
```

**Problem**: Creating multiple PrismaClient instances can lead to:

- Connection pool exhaustion
- Memory leaks in development with hot reloading
- Performance degradation
- Database connection limits being exceeded

### Solution Implementation

**Fixed Approach**: Singleton pattern with global instance management

```typescript
// ~/lib/prisma.ts - CORRECT singleton pattern
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Usage in routes**:

```typescript
// Route files - Import singleton instance
import { prisma } from '~/lib/prisma'

export async function loader() {
  // Use shared prisma instance
  return await prisma.user.findMany()
}
```

### Key Technical Insights

**Singleton Pattern Benefits**:

1. **Single Connection Pool**: One PrismaClient = one connection pool
2. **Development Hot Reload**: Global instance persists across reloads
3. **Memory Efficiency**: No duplicate client instances
4. **Production Optimization**: Clean single instance in production

**Global Instance Management**:

- Uses `globalThis` to store instance across module reloads
- Only stores global reference in development (NODE_ENV !== 'production')
- Production creates fresh instance each time (as intended)

**Reference**: [Prisma React Router 7 Documentation](https://www.prisma.io/docs/guides/react-router-7)

### Files Updated

- **Created**: `/app/lib/prisma.ts` - Singleton PrismaClient instance
- **Updated**: `/app/lib/auth.ts` - Uses shared prisma instance
- **Updated**: `/app/routes/auth-layout.tsx` - Import from singleton
- **Updated**: `/app/routes/prompts/detail.tsx` - Import from singleton  
- **Updated**: `/app/routes/prompts/new.tsx` - Import from singleton
- **Updated**: `/app/routes/share/prompt.tsx` - Import from singleton

### Impact

- ✅ **Single Connection Pool**: All database operations use one shared connection pool
- ✅ **Development Performance**: No connection pool exhaustion during hot reloads
- ✅ **Memory Efficiency**: Eliminated duplicate PrismaClient instances
- ✅ **Best Practice Compliance**: Follows official Prisma React Router 7 patterns
- ✅ **Production Optimization**: Clean singleton pattern for production deployments

This pattern is critical for scalable applications and prevents common database connection issues in development and production environments.

## Auth Layout Simplification - Separation of Concerns

### Problem Discovery

**Issue**: Auth layout was handling too much responsibility

- Centralized data loading for all routes in auth-layout.tsx
- Complex pathname-based logic to determine what data to load
- Mixing authentication concerns with business logic
- Difficult to maintain and debug route-specific data loading

### Root Cause Analysis

**Initial Implementation**: Monolithic auth layout handling all data loading

```typescript
// PROBLEMATIC - Auth layout doing too much
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect('/auth/sign-in');
  
  const pathname = url.pathname;
  let routeData = {};
  
  if (pathname === '/dashboard') {
    // Load dashboard data
  }
  if (pathname === '/prompts') {
    // Load prompts data  
  }
  if (pathname === '/prompts/new') {
    // Load categories for new prompt
  }
  // ... complex route-specific logic
  
  return { user: session.user, ...routeData };
}
```

**Problems**:

- **Single Responsibility Violation**: Auth layout handling both auth and business data
- **Tight Coupling**: Route data logic tied to auth layout
- **Difficult Testing**: Hard to test individual route data loading
- **Poor Performance**: Loading unnecessary data for some routes
- **Complex Maintenance**: One file handling all route logic

### Solution Implementation

**Fixed Approach**: Separated auth concerns from business data loading

```typescript
// CLEAN - Auth layout only handles authentication
// ~/routes/auth-layout.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    throw redirect('/auth/sign-in');
  }

  // Only return user session data - let individual routes handle their own data
  return { user: session.user };
}

// Individual routes handle their own data
// ~/routes/prompts/index.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const categoryId = url.searchParams.get('category') || '';

  const [prompts, categories] = await Promise.all([
    prisma.prompt.findMany({
      where: { userId: session!.user.id, /* search logic */ },
      include: { categories: { include: { category: true } } },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.category.findMany({ /* category logic */ })
  ]);

  return { prompts, categories, search, categoryId };
}
```

### Key Technical Insights

**Separation of Concerns Benefits**:

1. **Auth Layout**: Only handles authentication and user session
2. **Individual Routes**: Handle their own data requirements
3. **Clear Boundaries**: Auth vs business logic separation
4. **Better Performance**: Only load data needed for specific route

**Route Data Loading Pattern**:

- Each route exports its own `loader` function
- Routes access user session via `useOutletContext<{ user: any }>()`
- Routes receive their data via `loaderData` prop
- Clean, predictable data flow per route

**Component Pattern Evolution**:

```typescript
// BEFORE - Mixed outlet context
export default function MyRoute() {
  const { user, prompts, categories } = useOutletContext<{
    user: any; prompts: any[]; categories: any[];
  }>();
}

// AFTER - Separated concerns
export default function MyRoute({ loaderData }: Route.ComponentProps) {
  const { user } = useOutletContext<{ user: any }>();
  const { prompts, categories } = loaderData;
}
```

### Files Updated

- **Simplified**: `/app/routes/auth-layout.tsx` - Only auth and user session
- **Added loaders**: `/app/routes/dashboard.tsx` - Dashboard-specific data
- **Added loaders**: `/app/routes/prompts/index.tsx` - Prompts list with search/filter
- **Added loaders**: `/app/routes/prompts/new.tsx` - Categories for form
- **Added loaders**: `/app/routes/prompts/detail.tsx` - Individual prompt data

### Impact

- ✅ **Better Separation of Concerns**: Auth layout only handles authentication
- ✅ **Improved Maintainability**: Each route manages its own data requirements  
- ✅ **Better Performance**: No unnecessary data loading
- ✅ **Easier Testing**: Route data loading can be tested independently
- ✅ **Cleaner Architecture**: Clear boundaries between auth and business logic
- ✅ **More Scalable**: Easy to add new routes without modifying auth layout

This architectural improvement follows React Router 7 best practices and creates a more maintainable, scalable application structure.

## Final Architecture Summary

The final implementation uses a **separated auth and data pattern** where:

### 1. Authentication Layer

- **Auth layout** (`routes/auth-layout.tsx`) only handles authentication and user session
- Protects all routes with session verification and redirects to signin when needed
- Provides user session data via outlet context: `useOutletContext<{ user: any }>()`

### 2. Data Loading Layer  

- **Individual routes** handle their own data requirements with dedicated loaders
- Each route exports `loader` function for server-side data fetching
- Routes receive data via `loaderData` prop from `Route.ComponentProps`

### 3. Technical Patterns

- **Server-side authentication** with BetterAuth following their exact patterns
- **React Router 7** `Route.ComponentProps` pattern throughout
- **Form submissions** use server actions with proper error handling
- **Authentication cookies** properly captured and forwarded for session persistence
- **Prisma singleton** pattern for efficient database connections

### 4. Architecture Benefits

- ✅ **Clear separation of concerns**: Auth vs business logic
- ✅ **Better performance**: Only load data needed per route
- ✅ **Improved maintainability**: Route-specific data logic
- ✅ **Easier testing**: Independent route data loading
- ✅ **More scalable**: Add routes without modifying auth layout

This pattern eliminates code duplication, provides proper security, follows React Router 7 best practices, and creates a maintainable, scalable application structure.

## Pro Feature Gating and Navigation Pattern Fixes

### Problem Discovery

**Issue**: Inconsistent Pro feature gating and improper navigation patterns

- Free users could set prompts to "Public" in detail edit view (Pro-only feature)
- Multiple routes calculating `isProUser` independently causing inconsistency
- Improper use of `window.location` for navigation instead of React Router 7 patterns
- Missing server-side validation for Pro features

### Root Cause Analysis

**Initial Implementation Issues**:

1. **Inconsistent Feature Gating**: `detail.tsx` missing `isProUser` checks that existed in `new.tsx`
2. **Duplicate Logic**: Each route calculating `isProUser = user?.subscriptionStatus === 'active'` separately
3. **Navigation Anti-patterns**: Using `window.location.href` manipulation instead of React Router hooks
4. **Security Gap**: No server-side validation to prevent free users from bypassing UI restrictions

### Solution Implementation - Centralized Pro Status

**Brooks Rules RR7 Compliant Approach**: Centralize `isProUser` in auth layout following outlet context pattern

```typescript
// BEFORE - Duplicate calculations in each route
export default function MyRoute() {
  const { user } = useOutletContext<{ user: any }>();
  const isProUser = user?.subscriptionStatus === 'active'; // DUPLICATED
}

// AFTER - Centralized in auth layout
// ~/routes/auth-layout.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true, /* other fields */ }
  });
  
  const isProUser = user.subscriptionStatus === 'active';
  return { user, isProUser }; // Single source of truth
}

// Child routes get isProUser from context
export default function MyRoute() {
  const { user, isProUser } = useOutletContext<{ user: any, isProUser: boolean }>();
  // No duplicate calculation needed
}
```

### Fixed Pro Feature Gating Patterns

**detail.tsx Visibility Section**: Added proper Pro gating matching `new.tsx` pattern

```typescript
// BEFORE - No Pro gating (SECURITY ISSUE)
<div>
  <label>Visibility</label>
  <input type="radio" checked={!editedPrompt.public} /> Private
  <input type="radio" checked={editedPrompt.public} /> Public
</div>

// AFTER - Proper Pro gating with upgrade prompt
{isProUser ? (
  <div>
    <label>Visibility</label>
    <input type="radio" checked={!editedPrompt.public} /> Private
    <input type="radio" checked={editedPrompt.public} /> Public
  </div>
) : (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
    <input type="radio" checked={true} disabled /> Private (Free users)
    <p>Public sharing is available with Pro. 
      <a href="/pricing">Upgrade to share prompts →</a>
    </p>
  </div>
)}
```

**Server-Side Pro Validation**: Added action validation to prevent bypassing UI restrictions

```typescript
// Enhanced detail.tsx action with Pro validation
export async function action({ request, params }: Route.ActionArgs) {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true }
  });

  const isProUser = user?.subscriptionStatus === 'active';
  const requestedPublic = formData.get('public') === 'true';

  // CRITICAL: Server-side Pro feature validation
  if (requestedPublic && !isProUser) {
    return {
      error: 'Public sharing is a Pro feature. Upgrade your subscription to share prompts publicly.'
    };
  }

  const data = {
    public: isProUser ? requestedPublic : false, // Force false for free users
    // ... other fields
  };
}
```

### Navigation Pattern Fixes - React Router 7 Compliance

**Problem**: Multiple `window.location` usages violating React Router 7 patterns

**Dashboard Search Functionality**:

```typescript
// BEFORE - window.location anti-pattern
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    const url = new URL(window.location.href);
    url.searchParams.set('search', searchTerm);
    window.location.href = url.toString(); // BAD
  }
}}

// AFTER - Proper React Router 7 navigation
import { useNavigate } from 'react-router';

const navigate = useNavigate();

onKeyDown={(e) => {
  if (e.key === 'Enter') {
    const searchParams = new URLSearchParams();
    if (searchTerm) searchParams.set('search', searchTerm);
    if (loaderData.categoryId) searchParams.set('category', loaderData.categoryId);
    const queryString = searchParams.toString();
    navigate(queryString ? `/dashboard?${queryString}` : '/dashboard');
  }
}}
```

**Dashboard Category Filter**:

```typescript
// BEFORE - window.location manipulation
onChange={(e) => {
  const url = new URL(window.location.href);
  if (e.target.value) {
    url.searchParams.set('category', e.target.value);
  } else {
    url.searchParams.delete('category');
  }
  window.location.href = url.toString(); // BAD
}}

// AFTER - React Router navigation with state preservation
onChange={(e) => {
  const searchParams = new URLSearchParams();
  if (loaderData.search) searchParams.set('search', loaderData.search);
  if (e.target.value) searchParams.set('category', e.target.value);
  const queryString = searchParams.toString();
  navigate(queryString ? `/dashboard?${queryString}` : '/dashboard');
}}
```

**Detail Page URL Cleanup**:

```typescript
// BEFORE - Manual history manipulation
const url = new URL(window.location.href);
if (url.searchParams.has('edit')) {
  url.searchParams.delete('edit');
  window.history.replaceState({}, '', url.toString()); // BAD
}

// AFTER - React Router navigation
import { useNavigate } from 'react-router';
const navigate = useNavigate();

// Clean up URL by removing edit parameter
navigate(`/prompts/${prompt.id}`, { replace: true });
```

### Enhanced Security Patterns

**Share Button Gating**: Enhanced to require both public status AND Pro subscription

```typescript
// BEFORE - Only checked if prompt was public
{prompt.public && (
  <button onClick={() => sharePrompt()}>Share</button>
)}

// AFTER - Requires both public AND Pro status
{prompt.public && isProUser && (
  <button onClick={() => sharePrompt()}>Share</button>
)}
```

### Files Updated

- **Enhanced**: `/app/routes/auth-layout.tsx` - Centralized `isProUser` calculation
- **Fixed**: `/app/routes/prompts/detail.tsx` - Pro feature gating, server validation, navigation
- **Fixed**: `/app/routes/dashboard.tsx` - React Router navigation patterns
- **Updated**: `/app/routes/prompts/new.tsx` - Uses centralized `isProUser`
- **Updated**: `/app/routes/profile.tsx` - Uses centralized `isProUser`

### Impact

- ✅ **Consistent Pro Feature Gating**: All routes use centralized `isProUser` logic
- ✅ **Enhanced Security**: Server-side validation prevents Pro feature bypass
- ✅ **React Router 7 Compliance**: All navigation uses proper `useNavigate()` patterns
- ✅ **Single Source of Truth**: Pro status calculated once in auth layout
- ✅ **Better UX**: Smooth navigation without page reloads
- ✅ **Type Safety**: All navigation properly typed through React Router

### Key Technical Lessons

**Brooks Rules RR7 Navigation Patterns**:

1. **Never use `window.location`** for navigation - use `useNavigate()` hook
2. **URL parameter handling** with `URLSearchParams` for clean query building
3. **State preservation** during navigation with proper parameter management
4. **Replace vs push** - use `{ replace: true }` for URL cleanup operations

**Pro Feature Security Pattern**:

1. **UI Layer**: Conditional rendering based on `isProUser` with upgrade prompts
2. **Server Layer**: Validate subscription status before allowing Pro features
3. **Double Protection**: Force safe defaults for free users regardless of form input
4. **Consistent Gating**: All Pro features follow same pattern across routes

This implementation ensures both proper security and excellent user experience while following React Router 7 best practices throughout the application.
