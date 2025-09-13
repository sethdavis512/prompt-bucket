import { Outlet, Link } from 'react-router';

import { useState, useRef, useEffect } from 'react';
import type { Route } from './+types/layout';

import { auth } from '~/lib/auth';
import { getUserById } from '~/models/user.server';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        // For public routes, return null user
        return { user: null };
    }

    // Fetch user data for authenticated routes
    const user = await getUserById(session.user.id);

    return { user };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
    const { user } = loaderData;
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // For authenticated users, pass through to auth-layout which handles full layout
    // For public routes, render simple top nav + content
    if (user) {
        return <Outlet context={{ user }} />;
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <nav className="bg-white shadow-sm border-b border-b-zinc-200">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center">
                                <span className="h-8 w-8 text-2xl text-primary-600">
                                    🪣
                                </span>
                                <span className="text-xl font-bold text-zinc-900">
                                    PromptBucket
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link
                                to="/pricing"
                                className="text-zinc-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Pricing
                            </Link>
                            <Link
                                to="/auth/sign-in"
                                className="text-zinc-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/auth/sign-up"
                                className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-6 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
}
