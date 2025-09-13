import { Form, useNavigate, Link } from 'react-router';
import { useState } from 'react';
import { authClient } from '~/lib/auth-client';
import TextField from '~/components/TextField';
import Button from '~/components/Button';
import { ArrowLeft, Check } from 'lucide-react';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const signUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        await authClient.signUp.email(
            {
                email,
                password,
                name
            },
            {
                onRequest: (ctx) => {
                    setIsLoading(true);
                },
                onSuccess: (ctx) => {
                    navigate('/auth/sign-in');
                },
                onError: (ctx) => {
                    setError(
                        ctx.error.message || 'An error occurred during sign up'
                    );
                    setIsLoading(false);
                }
            }
        );
    };

    const benefits = [
        'Create unlimited prompts',
        'Organize with categories',
        'Export your templates',
        'Professional prompt structure'
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-lime-50 px-4 sm:px-6 lg:px-8">
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
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                        Start building better AI prompts today
                    </p>
                </div>

                {/* Benefits */}
                <div className="bg-white py-4 px-6 rounded-lg border border-zinc-200">
                    <h3 className="text-sm font-medium text-zinc-900 mb-3">
                        What you'll get:
                    </h3>
                    <ul className="space-y-2">
                        {benefits.map((benefit) => (
                            <li
                                key={benefit}
                                className="flex items-center text-sm text-zinc-600"
                            >
                                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Form */}
                <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-zinc-200">
                    <Form onSubmit={signUp} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <TextField
                            label="Full name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                            placeholder="Enter your full name"
                            disabled={isLoading}
                        />

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
                            autoComplete="new-password"
                            placeholder="Create a password"
                            disabled={isLoading}
                            helpText="Must be at least 8 characters long"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={isLoading}
                            disabled={isLoading || !email || !password || !name}
                            className="w-full"
                        >
                            {isLoading
                                ? 'Creating account...'
                                : 'Create account'}
                        </Button>
                    </Form>

                    {/* Footer links */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-600">
                            Already have an account?{' '}
                            <Link
                                to="/auth/sign-in"
                                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Additional footer */}
                <div className="text-center">
                    <p className="text-xs text-zinc-500">
                        By creating an account, you agree to our{' '}
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
