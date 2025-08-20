import { Outlet, redirect } from 'react-router';
import { auth } from '~/lib/auth';
import type { Route } from './+types/auth-layout';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        throw redirect('/auth/signin');
    }

    // Only return user session data - let individual routes handle their own data
    return { user: session.user };
}

export default function AuthLayout({ loaderData }: Route.ComponentProps) {
    return <Outlet context={loaderData} />;
}
