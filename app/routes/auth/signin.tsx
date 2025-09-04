import { Form, useNavigate, Link } from 'react-router';
import { useState } from 'react';
import { authClient } from '~/lib/auth-client';
import TextField from '~/components/TextField';
import Button from '~/components/Button';
import { ArrowLeft } from 'lucide-react';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const signIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        await authClient.signIn.email(
            {
                email,
                password
            },
            {
                onRequest: (ctx) => {
                    setIsLoading(true);
                },
                onSuccess: (ctx) => {
                    navigate('/dashboard');
                },
                onError: (ctx) => {
                    setError(
                        ctx.error.message || 'An error occurred during sign in'
                    );
                    setIsLoading(false);
                }
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center mb-8 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to home
                    </Link>

                    <div className="flex justify-center mb-6">
                        <span className="h-12 w-12 text-4xl">🪣</span>
                    </div>

                    <h2 className="text-3xl font-bold text-zinc-900">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                        Sign in to your PromptBucket account
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-zinc-200">
                    <Form onSubmit={signIn} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <TextField
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="Enter your email"
                            disabled={isLoading}
                        />

                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={isLoading}
                            disabled={isLoading || !email || !password}
                            className="w-full"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </Form>

                    {/* Footer links */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-600">
                            Don't have an account?{' '}
                            <Link
                                to="/auth/sign-up"
                                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                            >
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Additional footer */}
                <div className="text-center">
                    <p className="text-xs text-zinc-500">
                        By signing in, you agree to our{' '}
                        <a
                            href="#"
                            className="text-primary-600 hover:text-primary-500"
                        >
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                            href="#"
                            className="text-primary-600 hover:text-primary-500"
                        >
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
