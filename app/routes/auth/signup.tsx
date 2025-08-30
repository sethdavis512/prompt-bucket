import { Link, Form, redirect } from 'react-router';
import TextField from '~/components/TextField';
import type { Route } from './+types/signup';

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
        // Make a request to our own auth API endpoint
        const authResponse = await fetch(
            `${process.env.BETTER_AUTH_URL}/api/auth/sign-up/email`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    name
                })
            }
        );

        if (authResponse.ok) {
            // Get the set-cookie headers from the response
            const setCookieHeaders =
                authResponse.headers.getSetCookie?.() ||
                authResponse.headers.get('set-cookie');

            // Create a redirect response with the cookies
            const redirectResponse = redirect('/dashboard');

            // Copy authentication cookies from BetterAuth response
            if (setCookieHeaders) {
                if (Array.isArray(setCookieHeaders)) {
                    setCookieHeaders.forEach((cookie) => {
                        redirectResponse.headers.append('Set-Cookie', cookie);
                    });
                } else {
                    redirectResponse.headers.set(
                        'Set-Cookie',
                        setCookieHeaders
                    );
                }
            }

            return redirectResponse;
        }

        const errorData = await authResponse.json().catch(() => ({}));
        return {
            error:
                errorData.message ||
                'Failed to create account. Email may already exist.'
        };
    } catch (error) {
        console.error('Signup error:', error);
        return { error: 'Failed to create account. Email may already exist.' };
    }
}

export default function SignUp({ actionData }: Route.ComponentProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-zinc-600">
                        Or{' '}
                        <Link
                            to="/auth/signin"
                            className="font-medium text-primary-600 hover:text-primary-500"
                        >
                            sign in to your existing account
                        </Link>
                    </p>
                </div>
                {actionData?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {actionData.error}
                    </div>
                )}
                <Form method="post" className="mt-8 space-y-6">
                    <TextField
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Full name"
                        labelClassName="sr-only"
                        label="Full name"
                        data-cy="name-input"
                    />
                    <TextField
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="Email address"
                        labelClassName="sr-only"
                        label="Email address"
                        data-cy="email-input"
                    />
                    <TextField
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        placeholder="Password (min 8 characters)"
                        labelClassName="sr-only"
                        label="Password"
                        data-cy="password-input"
                    />

                    <div>
                        <button
                            type="submit"
                            data-cy="signup-button"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Create account
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
