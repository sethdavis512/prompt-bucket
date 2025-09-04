import type { Route } from './+types/accept';
import { Form, Link } from 'react-router';
import { requireAuth } from '~/lib/session';
import { getInvitationByToken } from '~/models/team.server';

export async function loader({ request, params }: Route.LoaderArgs) {
    const { user } = await requireAuth(request);
    const token = params.token as string;

    if (!token) {
        return {
            error: 'Invalid invitation link',
            invitation: null,
            user
        };
    }

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
        return {
            error: 'Invitation not found or has expired',
            invitation: null,
            user
        };
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
        return {
            error: 'This invitation has expired',
            invitation: null,
            user
        };
    }

    // Check if invitation has already been accepted
    if (invitation.acceptedAt) {
        return {
            error: 'This invitation has already been accepted',
            invitation: null,
            user
        };
    }

    return {
        error: null,
        invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            team: {
                name: invitation.team.name,
                slug: invitation.team.slug
            },
            inviter: invitation.inviter
        },
        user
    };
}

export async function action({ request, params }: Route.ActionArgs) {
    // Forward to API endpoint
    const apiUrl = `/api/invitations/${params.token}/accept`;
    const response = await fetch(new URL(apiUrl, request.url), {
        method: 'POST',
        headers: request.headers
    });

    if (response.redirected) {
        throw new Response(null, {
            status: 302,
            headers: { Location: response.url }
        });
    }

    return response.json();
}

export default function AcceptInvitation({
    loaderData,
    actionData
}: Route.ComponentProps) {
    const { error, invitation, user } = loaderData;

    if (error || !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold text-zinc-900">
                            Invitation Error
                        </h2>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="w-5 h-5 text-red-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    {error}
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>
                                        This invitation link may have expired or
                                        been used already.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/dashboard"
                            className="text-primary-600 hover:text-primary-500 text-sm"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Check if email matches current user
    const emailMismatch = invitation.email !== user.email;

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-zinc-900">
                        Team Invitation
                    </h2>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                                className="w-8 h-8 text-primary-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.196-2.196M17 20H7m10 0v-2c0-5.523-4.477-10-10-10S7 6.477 7 12v2m10 0H7m0 0H2v-2a3 3 0 015.196-2.196M7 20v-2m0 0V9a2 2 0 012-2h6a2 2 0 012 2v11"
                                />
                            </svg>
                        </div>

                        <h3 className="text-lg font-medium text-zinc-900 mb-2">
                            You've been invited to join
                        </h3>
                        <h2 className="text-2xl font-bold text-primary-600">
                            {invitation.team.name}
                        </h2>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="bg-zinc-50 rounded-lg p-4">
                            <dl className="space-y-2 text-sm">
                                <div>
                                    <dt className="font-medium text-zinc-500">
                                        Invited by:
                                    </dt>
                                    <dd className="text-zinc-900">
                                        {invitation.inviter.name ||
                                            invitation.inviter.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-zinc-500">
                                        Role:
                                    </dt>
                                    <dd className="text-zinc-900">
                                        {invitation.role === 'ADMIN'
                                            ? 'Administrator'
                                            : 'Member'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-zinc-500">
                                        Invited email:
                                    </dt>
                                    <dd className="text-zinc-900">
                                        {invitation.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-zinc-500">
                                        Your email:
                                    </dt>
                                    <dd className="text-zinc-900">
                                        {user.email}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {invitation.role === 'ADMIN' && (
                            <div className="bg-primary-100 border border-primary-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="w-5 h-5 text-primary-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-primary-800">
                                            Administrator Access
                                        </h3>
                                        <div className="mt-1 text-sm text-primary-700">
                                            <p>
                                                As an admin, you'll be able to
                                                manage team settings, invite
                                                members, and control team
                                                content.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {emailMismatch ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="w-5 h-5 text-amber-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-amber-800">
                                        Email Address Mismatch
                                    </h3>
                                    <div className="mt-1 text-sm text-amber-700">
                                        <p>
                                            This invitation was sent to{' '}
                                            {invitation.email}, but you're
                                            signed in as {user.email}. Please
                                            sign in with the invited email
                                            address to accept this invitation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {actionData?.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="w-5 h-5 text-red-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {actionData.error}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <Link
                            to="/dashboard"
                            className="flex-1 py-2 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                        >
                            Cancel
                        </Link>

                        {emailMismatch ? (
                            <Link
                                to="/auth/signin"
                                className="flex-1 py-2 px-4 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                            >
                                Sign in as {invitation.email}
                            </Link>
                        ) : (
                            <Form method="post" className="flex-1">
                                <button
                                    type="submit"
                                    className="w-full py-2 px-4 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    Accept Invitation
                                </button>
                            </Form>
                        )}
                    </div>
                </div>

                <div className="text-center text-sm text-zinc-600">
                    <p>
                        By accepting this invitation, you agree to collaborate
                        with the team and follow the team's guidelines.
                    </p>
                </div>
            </div>
        </div>
    );
}
