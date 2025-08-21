import { Link, Form, redirect } from 'react-router';
import TextField from '~/components/TextField';
import type { Route } from './+types/signin';

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        // Make a request to our own auth API endpoint
        const authResponse = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (authResponse.ok) {
            // Get the set-cookie headers from the response
            const setCookieHeaders = authResponse.headers.getSetCookie?.() || authResponse.headers.get('set-cookie');
            
            // Create a redirect response with the cookies
            const redirectResponse = redirect('/dashboard');
            
            // Copy authentication cookies from BetterAuth response
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

export default function SignIn({ actionData }: Route.ComponentProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link
                            to="/auth/signup"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            create a new account
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
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="Email address"
                        labelClassName="sr-only"
                        label="Email address"
                    />
                    <TextField
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="Password"
                        labelClassName="sr-only"
                        label="Password"
                    />

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign in
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
