import { Outlet, redirect } from 'react-router';
import { auth } from '~/lib/auth';
import { prisma } from '~/lib/prisma';
import type { Route } from './+types/auth-layout';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        throw redirect('/auth/signin');
    }

    // Fetch full user data including subscription status
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            subscriptionStatus: true,
            customerId: true,
            createdAt: true
        }
    });

    if (!user) {
        throw redirect('/auth/signin');
    }

    // Calculate Pro status once for all child routes
    const isProUser = user.subscriptionStatus === 'active';

    return { user, isProUser };
}

export default function AuthLayout({ loaderData }: Route.ComponentProps) {
    return <Outlet context={loaderData} />;
}
