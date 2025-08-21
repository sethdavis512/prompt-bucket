import { Link, Form, NavLink } from 'react-router';
import { Home, User, LogOut, Plus, CreditCard, Star, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface LayoutProps {
    children: React.ReactNode;
    user?: {
        name?: string | null;
        email: string;
        subscriptionStatus?: string | null;
    } | null;
}

export default function Layout({ children, user }: LayoutProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-b-zinc-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/dashboard" className="flex items-center">
                                <span className="h-8 w-8 text-2xl text-indigo-600">
                                    🪣
                                </span>
                                <span className="text-xl font-bold text-gray-900">
                                    PromptBucket
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <NavLink
                                        to="/dashboard"
                                        className={({ isActive }) =>
                                            isActive
                                                ? 'text-indigo-600 bg-indigo-50 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1'
                                                : 'text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1'
                                        }
                                    >
                                        <Home className="h-4 w-4" />
                                        <span>Dashboard</span>
                                    </NavLink>
                                    {user.subscriptionStatus !== 'active' && (
                                        <Link
                                            to="/pricing"
                                            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                                        >
                                            <Star className="h-4 w-4" />
                                            <span>Upgrade</span>
                                        </Link>
                                    )}
                                    <div className="relative" ref={dropdownRef}>
                                        <button 
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                                        >
                                            <User className="h-4 w-4" />
                                            <span>
                                                {user.name || user.email}
                                            </span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                            <Link
                                                to="/profile"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Profile Settings
                                            </Link>
                                            {user.subscriptionStatus === 'active' ? (
                                                <Link
                                                    to="/billing"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <CreditCard className="h-4 w-4" />
                                                    <span>Manage Billing</span>
                                                </Link>
                                            ) : (
                                                <Link
                                                    to="/pricing"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    <Star className="h-4 w-4" />
                                                    <span>Upgrade to Pro</span>
                                                </Link>
                                            )}
                                            <Form
                                                method="post"
                                                action="/api/auth/sign-out"
                                            >
                                                <button
                                                    type="submit"
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </Form>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/pricing"
                                        className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Pricing
                                    </Link>
                                    <Link
                                        to="/auth/signin"
                                        className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/auth/signup"
                                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
