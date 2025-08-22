import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { auth } from '~/lib/auth';
import { prisma } from '~/lib/prisma';

export async function loader({ request }: LoaderFunctionArgs) {
    // Get the current session
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
        return data({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (currentUser?.role !== 'ADMIN') {
        return data({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all users for the dropdown
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            subscriptionStatus: true,
        },
        orderBy: [
            { role: 'desc' }, // Admins first
            { name: 'asc' }
        ]
    });

    return data({ users });
}

export async function action({ request }: ActionFunctionArgs) {
    // Get the current session
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
        return data({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (currentUser?.role !== 'ADMIN') {
        return data({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const intent = formData.get('intent') as string;
        const userId = formData.get('userId') as string;
        const subscriptionStatus = formData.get('subscriptionStatus') as
            | 'free'
            | 'active';

        if (!['toggle_subscription', 'manage_user_subscription'].includes(intent)) {
            return data({ error: 'Invalid intent' }, { status: 400 });
        }

        if (!userId || !subscriptionStatus) {
            return data({ error: 'Missing required fields' }, { status: 400 });
        }

        // Update user subscription status in database
        await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus }
        });

        return data({ success: true, message: 'User subscription updated successfully' });
    } catch (error) {
        console.error('Error updating user subscription:', error);
        return data(
            { error: 'Failed to update subscription' },
            { status: 500 }
        );
    }
}
