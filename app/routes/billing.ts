import { redirect } from 'react-router';
import { auth } from '~/lib/auth';
import { getUserById } from '~/models/user.server';
import { polar } from '~/polar';
import type { Route } from './+types/billing';

export async function loader({ request }: Route.LoaderArgs) {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
        throw redirect('/auth/signin');
    }

    // Get user with subscription info
    const user = await getUserById(session.user.id);

    if (!user) {
        throw redirect('/auth/signin');
    }

    // Check if user has an active subscription
    if (user.subscriptionStatus !== 'active') {
        throw redirect('/profile?error=no-subscription');
    }

    // Check if user has a Polar customer ID
    if (!user.customerId) {
        throw redirect('/profile?error=no-customer-id');
    }

    try {
        // Create authenticated customer portal session
        const result = await polar.customerSessions.create({
            customerId: user.customerId
        });

        // Redirect to the customer portal
        return redirect(result.customerPortalUrl);
    } catch (error) {
        console.error('Error creating customer portal session:', error);
        throw redirect('/profile?error=portal-unavailable');
    }
}
