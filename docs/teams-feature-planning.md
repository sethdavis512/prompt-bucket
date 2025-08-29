# Teams Feature Planning

## Overview

Add team collaboration capabilities to Prompt Lab, allowing companies to create shared workspaces where team members can collaborate on prompts, chains, and categories.

## Core Requirements

### Team Management

- **Team Creation**: Company admin can create a team workspace
- **Member Invitations**: Send email invites to teammates
- **Role-Based Access**: Basic roles (Admin, Member)
- **Team Settings**: Manage team name, billing, and member permissions

### User Experience Flow

1. **Team Signup**: Company signs up and creates initial team
2. **Invite Members**: Admin invites teammates via email
3. **Accept Invitation**: Invited users accept and join team workspace
4. **Shared Workspace**: Team members see shared prompts, chains, categories
5. **Individual vs Team Content**: Users can toggle between personal and team workspaces

## Database Schema Changes (Prisma)

### New Models

```prisma
model Team {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique // for team URLs like /teams/acme-corp
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Subscription fields (team-level billing)
  subscriptionStatus String? @default("free") // free, active, canceled, etc.
  subscriptionId     String?
  customerId         String?

  // Relations
  members     TeamMember[]
  invitations TeamInvitation[]
  prompts     Prompt[]
  categories  Category[]
  chains      Chain[]

  @@map("teams")
}

model TeamMember {
  id       String   @id @default(cuid())
  teamId   String
  userId   String
  role     TeamRole @default(MEMBER)
  joinedAt DateTime @default(now())
  createdAt DateTime @default(now())

  // Relations
  team User @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@map("team_members")
}

model TeamInvitation {
  id        String   @id @default(cuid())
  teamId    String
  email     String
  role      TeamRole @default(MEMBER)
  token     String   @unique // for invitation links
  expiresAt DateTime
  acceptedAt DateTime?
  createdAt DateTime @default(now())
  invitedBy String

  // Relations
  team    Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  inviter User @relation(fields: [invitedBy], references: [id], onDelete: Cascade)

  @@unique([teamId, email])
  @@map("team_invitations")
}

enum TeamRole {
  ADMIN
  MEMBER
}
```

### Existing Model Updates

```prisma
// Add to User model
model User {
  // ... existing fields ...
  
  // Team relations
  teamMemberships TeamMember[]
  teamInvitations TeamInvitation[]
  
  // ... existing relations ...
}

// Add teamId to content models
model Prompt {
  // ... existing fields ...
  
  // Team relation (optional - null means personal prompt)
  teamId String?
  team   Team?   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  // ... rest of model ...
}

model Category {
  // ... existing fields ...
  
  // Team relation (optional - null means personal category)
  teamId String?
  team   Team?   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  // ... rest of model ...
}

model Chain {
  // ... existing fields ...
  
  // Team relation (optional - null means personal chain)
  teamId String?
  team   Team?   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  // ... rest of model ...
}
```

## Feature Gating & Subscription Tiers

### Free Teams

- Up to 3 team members
- Shared workspace with basic collaboration
- 10 shared prompts limit per team

### Pro Teams

- Unlimited team members
- Unlimited shared prompts, chains, categories
- Advanced permissions (coming later)
- Team analytics (coming later)

## Implementation Phases

### Phase 1: Core Team Infrastructure

- [ ] Prisma schema migration with new Team models
- [ ] Server model functions (`app/models/team.server.ts`)
- [ ] Team creation route (`/teams/new`) with form validation
- [ ] Basic team invitation system with email integration
- [ ] Enhanced `requireAuth()` for team context switching

### Phase 2: Team Workspaces & Content

- [ ] Team workspace routes (`/teams/:slug/*`) with slug-based routing
- [ ] Team-scoped prompts, chains, categories with `teamId` foreign keys
- [ ] Team member permission checking in route loaders
- [ ] UI components for team switcher and shared content indicators
- [ ] Update existing forms to support team vs personal content creation

### Phase 3: Advanced Team Management

- [ ] Team settings page with member management
- [ ] Role-based permissions refinement (beyond ADMIN/MEMBER)
- [ ] Team billing integration with Polar (team-level subscriptions)
- [ ] Email notifications for invitations and team activity
- [ ] Team analytics and usage metrics

## API Routes (React Router v7)

```typescript
// Add to app/routes.ts
...prefix('api', [
  // Existing API routes...
  
  // Team management
  route('teams', 'routes/api/teams.ts'),                    // GET, POST /api/teams
  route('teams/:id', 'routes/api/teams/$id.ts'),           // GET, PATCH, DELETE /api/teams/:id
  route('teams/:id/members', 'routes/api/teams/$id.members.ts'),     // GET, POST, DELETE
  route('teams/:id/invitations', 'routes/api/teams/$id.invitations.ts'), // GET, POST, DELETE
  route('invitations/:token/accept', 'routes/api/invitations/$token.accept.ts'), // POST
])
```

### API Route Handlers

```typescript
// routes/api/teams.ts
import { type Route } from './+types/teams';
import { requireAuth } from '~/lib/session';
import { createTeam, getUserTeams } from '~/models/team.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireAuth(request);
  const teams = await getUserTeams(user.id);
  return { teams };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  
  if (request.method === 'POST') {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    
    const team = await createTeam({ name, slug, ownerId: user.id });
    return { success: true, team };
  }
}
```

## UI/UX Considerations

### Team Switcher Component

```typescript
// app/components/TeamSwitcher.tsx
export function TeamSwitcher({ currentTeam, userTeams }: {
  currentTeam?: Team;
  userTeams: Team[];
}) {
  return (
    <div className="relative">
      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg">
        <Building2 className="w-4 h-4" />
        <span>{currentTeam?.name || 'Personal'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {/* Dropdown with personal + team options */}
      <div className="absolute mt-1 w-64 bg-white rounded-lg shadow-lg">
        <Link to="/dashboard" className="flex items-center px-4 py-2 hover:bg-gray-50">
          <User className="w-4 h-4 mr-2" />
          Personal Workspace
        </Link>
        {userTeams.map(team => (
          <Link key={team.id} to={`/teams/${team.slug}/dashboard`} className="flex items-center px-4 py-2 hover:bg-gray-50">
            <Building2 className="w-4 h-4 mr-2" />
            {team.name}
          </Link>
        ))}
        <div className="border-t border-gray-200 pt-2">
          <Link to="/teams/new" className="flex items-center px-4 py-2 text-blue-600 hover:bg-gray-50">
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Shared Content Indicators

- Badge system to show "Team" vs "Personal" content
- Creator attribution with user avatars
- Team branding/colors for visual distinction
- Context-aware breadcrumbs showing current workspace

## Technical Implementation Notes

### Authentication Changes (Better Auth Integration)

```typescript
// Update app/lib/session.ts
export interface SessionData {
  user: AuthenticatedUser;
  isProUser: boolean;
  isAdmin: boolean;
  currentTeamId?: string; // Add team context
  teamRole?: TeamRole;    // User's role in current team
}

// Enhanced auth helper
export async function requireTeamAuth(request: Request, teamId: string): Promise<SessionData & { team: Team }> {
  const { user } = await requireAuth(request);
  
  const teamMember = await prisma.teamMember.findFirst({
    where: { userId: user.id, teamId },
    include: { team: true }
  });
  
  if (!teamMember) {
    throw redirect('/access-denied');
  }
  
  return {
    user,
    isProUser: user.subscriptionStatus === 'active',
    isAdmin: user.role === 'ADMIN',
    currentTeamId: teamId,
    teamRole: teamMember.role,
    team: teamMember.team
  };
}
```

### Data Access Patterns (Server Models)

```typescript
// app/models/team.server.ts
export function getUserTeams(userId: string) {
  return prisma.team.findMany({
    where: {
      members: {
        some: { userId }
      }
    },
    include: {
      members: {
        include: { user: { select: { name: true, email: true } } }
      },
      _count: {
        select: {
          prompts: true,
          categories: true,
          chains: true
        }
      }
    }
  });
}

export function getTeamPrompts(teamId: string, userId: string) {
  return prisma.prompt.findMany({
    where: {
      teamId,
      team: {
        members: {
          some: { userId } // Ensure user is team member
        }
      }
    },
    include: {
      categories: { include: { category: true } },
      user: { select: { name: true, email: true } } // Show creator
    },
    orderBy: { updatedAt: 'desc' }
  });
}

// Combined personal + team content
export function getUserAndTeamPrompts(userId: string, teamId?: string) {
  return prisma.prompt.findMany({
    where: {
      OR: [
        { userId, teamId: null },     // Personal prompts
        ...(teamId ? [{ teamId }] : []) // Team prompts if team selected
      ]
    },
    include: {
      categories: { include: { category: true } },
      user: { select: { name: true, email: true } },
      team: { select: { name: true, slug: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
}
```

### URL Structure & Routes

```typescript
// Add to app/routes.ts
layout('routes/auth-layout.tsx', [
  // Existing protected routes...
  
  // Team routes
  route('teams', 'routes/teams/index.tsx'),              // List user's teams
  route('teams/new', 'routes/teams/new.tsx'),            // Create team
  
  // Team workspace routes
  ...prefix('teams/:slug', [
    route('dashboard', 'routes/teams/$slug.dashboard.tsx'),
    route('prompts', 'routes/teams/$slug.prompts/index.tsx'),
    route('prompts/:id', 'routes/teams/$slug.prompts/$id.tsx'),
    route('prompts/:id/edit', 'routes/teams/$slug.prompts/$id.edit.tsx'),
    route('prompts/new', 'routes/teams/$slug.prompts/new.tsx'),
    route('chains', 'routes/teams/$slug.chains/index.tsx'),
    route('categories', 'routes/teams/$slug.categories.tsx'),
    route('settings', 'routes/teams/$slug.settings.tsx'),
    route('settings/members', 'routes/teams/$slug.settings/members.tsx'),
  ]),
  
  // Team invitation acceptance (public)
  route('invitations/:token', 'routes/invitations/$token.tsx'),
])
```

**URL Examples:**

- `/dashboard` - Personal workspace (current)
- `/teams` - List of user's teams
- `/teams/acme-corp/dashboard` - Team workspace
- `/teams/acme-corp/prompts` - Team prompts
- `/teams/acme-corp/settings` - Team settings
- `/invitations/abc123` - Accept team invitation

### Route Loader Pattern

```typescript
// routes/teams/$slug.dashboard.tsx
export async function loader({ params, request }: Route.LoaderArgs) {
  const { user, team } = await requireTeamAuth(request, params.slug);
  
  const [prompts, chains, categories] = await Promise.all([
    getTeamPrompts(team.id, user.id),
    getTeamChains(team.id, user.id),
    getTeamCategories(team.id, user.id)
  ]);
  
  return { team, prompts, chains, categories };
}
```

## Technical Considerations & Migration

### Content Ownership Strategy
- **Team Content**: Remains with team when member leaves
- **Personal Content**: Stays with user, option to transfer to team
- **Migration Helper**: Bulk transfer tool for moving personal content to team

### Subscription Model Transition
- **Individual Pro → Team Pro**: Seamless upgrade path
- **Team Billing**: Via Polar with team-level customer IDs
- **Grandfathering**: Existing Pro users keep individual billing option

### Database Migration Strategy
```typescript
// Migration script approach
// 1. Add new tables (Team, TeamMember, TeamInvitation)
// 2. Add optional teamId columns to existing content tables
// 3. No data migration initially - all existing content remains personal
// 4. Users opt-in to move content to teams
```

### Performance Considerations
- Index `teamId` columns for fast team-scoped queries
- Implement team member caching for permission checks
- Use Prisma's `include` strategically to avoid N+1 queries

## Success Metrics

- Team signup conversion rate
- Team invitation acceptance rate
- Active team collaboration (shared content creation)
- Team subscription upgrades
- User retention within teams
