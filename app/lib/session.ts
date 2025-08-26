import { auth } from '~/lib/auth';
import { prisma } from '~/lib/prisma';
import { redirect } from 'react-router';

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