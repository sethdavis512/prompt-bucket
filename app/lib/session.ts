import { auth } from '~/lib/auth';
import { prisma } from '~/lib/prisma';
import { redirect } from 'react-router';
import type { Team, TeamRole } from '@prisma/client';
import { getTeamBySlug, getTeamMember } from '~/models/team.server';

export interface AuthenticatedUser {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    subscriptionStatus?: string | null;
    customerId?: string | null;
    createdAt: Date;
}

export interface SessionData {
    user: AuthenticatedUser;
    isProUser: boolean;
    isAdmin: boolean;
    currentTeamId?: string; // Add team context
    teamRole?: TeamRole;    // User's role in current team
}

export interface TeamSessionData extends SessionData {
    team: Team;
    currentTeamId: string;
    teamRole: TeamRole;
}

/**
 * Validates session and returns authenticated user data.
 * Use this in any protected route loader that needs user data.
 */
export async function requireAuth(request: Request): Promise<SessionData> {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        throw redirect('/auth/signin');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            subscriptionStatus: true,
            customerId: true,
            createdAt: true
        }
    });

    if (!user) {
        throw redirect('/auth/signin');
    }

    const isProUser = user.subscriptionStatus === 'active';
    const isAdmin = user.role === 'ADMIN';

    return { user, isProUser, isAdmin };
}

/**
 * Enhanced auth helper for team routes that validates team access.
 * Use this in team-scoped routes that need both user and team context.
 */
export async function requireTeamAuth(request: Request, teamSlug: string): Promise<TeamSessionData> {
    const { user, isProUser, isAdmin } = await requireAuth(request);
    
    const team = await getTeamBySlug(teamSlug);
    
    if (!team) {
        throw redirect('/access-denied');
    }
    
    const teamMember = await getTeamMember(team.id, user.id);
    
    if (!teamMember) {
        throw redirect('/access-denied');
    }
    
    return {
        user,
        isProUser,
        isAdmin,
        currentTeamId: team.id,
        teamRole: teamMember.role,
        team: teamMember.team
    };
}

/**
 * Validates team admin access.
 * Use this for team management routes that require admin permissions.
 */
export async function requireTeamAdmin(request: Request, teamSlug: string): Promise<TeamSessionData> {
    const sessionData = await requireTeamAuth(request, teamSlug);
    
    if (sessionData.teamRole !== 'ADMIN') {
        throw redirect('/access-denied');
    }
    
    return sessionData;
}

/**
 * Gets user session with optional team context.
 * Use this when team context is optional but helpful.
 */
export async function getSessionWithOptionalTeam(request: Request, teamSlug?: string): Promise<SessionData> {
    const baseSession = await requireAuth(request);
    
    if (!teamSlug) {
        return baseSession;
    }
    
    const team = await getTeamBySlug(teamSlug);
    if (!team) {
        return baseSession;
    }
    
    const teamMember = await getTeamMember(team.id, baseSession.user.id);
    if (!teamMember) {
        return baseSession;
    }
    
    return {
        ...baseSession,
        currentTeamId: team.id,
        teamRole: teamMember.role
    };
}