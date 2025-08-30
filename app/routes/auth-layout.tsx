import { Outlet, NavLink, Link, Form } from 'react-router';
import {
    Home,
    FileText,
    Link2,
    FolderOpen,
    Users,
    Star,
    Crown,
    User,
    LogOut,
    CreditCard,
    ChevronDown,
    Settings,
    Menu,
    X
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { requireAuth } from '~/lib/session';
import AdminToolsDrawer from '~/components/AdminToolsDrawer';
import type { Route } from './+types/auth-layout';

export async function loader({ request }: Route.LoaderArgs) {
    return await requireAuth(request);
}

export default function AuthLayout({ loaderData }: Route.ComponentProps) {
    const { user, isProUser, isAdmin } = loaderData;
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: Home,
            enabled: true
        },
        {
            name: 'Prompts',
            href: '/prompts',
            icon: FileText,
            enabled: true
        },
        {
            name: 'Chains',
            href: '/chains',
            icon: Link2,
            enabled: isProUser,
            isPro: true
        },
        {
            name: 'Categories',
            href: '/categories',
            icon: FolderOpen,
            enabled: isProUser,
            isPro: true
        },
        {
            name: 'Teams',
            href: '/teams',
            icon: Users,
            enabled: isProUser,
            isPro: true
        }
    ];

    const handleCloseAdminDrawer = () => {
        setIsAdminDrawerOpen(false);
    };

    const handleOpenAdminDrawer = () => {
        setIsAdminDrawerOpen(true);
    };

    return (
        <div className="flex min-h-screen bg-zinc-50">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-b-zinc-200 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Mobile menu button */}
                            <button
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-zinc-700 hover:text-primary-600 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 mr-2"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>

                            <Link to="/dashboard" className="flex items-center">
                                <span className="h-8 w-8 text-2xl text-primary-600">
                                    🪣
                                </span>
                                <span className="text-xl font-bold text-zinc-900">
                                    PromptBucket
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() =>
                                        setIsDropdownOpen(!isDropdownOpen)
                                    }
                                    data-testid="user-dropdown"
                                    className="text-zinc-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                                >
                                    <User className="h-4 w-4" />
                                    <span>{user.name || user.email}</span>
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                        <Link
                                            to="/profile"
                                            onClick={() =>
                                                setIsDropdownOpen(false)
                                            }
                                            className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                                        >
                                            Profile Settings
                                        </Link>
                                        {user.subscriptionStatus ===
                                            'active' && (
                                            <Link
                                                to="/billing"
                                                onClick={() =>
                                                    setIsDropdownOpen(false)
                                                }
                                                className="flex items-center space-x-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                <span>Manage Billing</span>
                                            </Link>
                                        )}
                                        <Form
                                            method="post"
                                            action="/api/auth/sign-out"
                                        >
                                            <button
                                                type="submit"
                                                className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 flex items-center space-x-2"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Sign Out</span>
                                            </button>
                                        </Form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile navigation menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-zinc-200 z-40">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;

                            if (!item.enabled) {
                                return (
                                    <div
                                        key={item.name}
                                        className="flex items-center px-3 py-2 rounded-md text-base font-medium text-zinc-400 cursor-not-allowed"
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                        {item.isPro && (
                                            <Crown className="ml-auto h-4 w-4 text-amber-500" />
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                                            isActive
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'text-zinc-700 hover:text-primary-700 hover:bg-primary-100'
                                        }`
                                    }
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </NavLink>
                            );
                        })}

                        {/* Mobile Pro Upgrade Banner for Free Users */}
                        {!isProUser && (
                            <div className="mx-3 mt-4">
                                <div className="bg-gradient-to-r from-purple-500 to-primary-600 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Star className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-white">
                                                Upgrade to Pro
                                            </p>
                                            <p className="text-xs text-purple-100">
                                                Unlock teams & collaboration
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <NavLink
                                            to="/pricing"
                                            onClick={() =>
                                                setIsMobileMenuOpen(false)
                                            }
                                            className="w-full bg-white text-purple-600 hover:bg-zinc-50 border border-transparent rounded-md py-2 px-3 inline-flex items-center justify-center text-sm font-semibold transition-colors"
                                        >
                                            Learn More
                                        </NavLink>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Left Sidebar */}
            <div
                className="hidden md:flex md:w-64 md:flex-col pt-16"
                data-testid="sidebar"
            >
                <div className="flex flex-col flex-grow bg-white border-r border-zinc-200 pt-5 pb-4 overflow-y-auto">
                    {/* Navigation */}
                    <nav className="mt-2 flex-1 px-2 space-y-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;

                            if (!item.enabled) {
                                return (
                                    <div
                                        key={item.name}
                                        data-testid={`nav-${item.name.toLowerCase()}`}
                                        className="group flex items-center px-2 py-2 text-sm font-medium text-zinc-400 rounded-md cursor-not-allowed"
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                        {item.isPro && (
                                            <Crown className="ml-auto h-4 w-4 text-amber-500" />
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    data-testid={`nav-${item.name.toLowerCase()}`}
                                    className={({ isActive }) =>
                                        `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                            isActive
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'text-zinc-700 hover:text-primary-700 hover:bg-primary-100'
                                        }`
                                    }
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Pro Upgrade Banner for Free Users */}
                    {!isProUser && (
                        <div className="flex-shrink-0 px-4 pb-4">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-primary-600 rounded-lg p-3"
                                data-testid="upgrade-banner"
                            >
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Star className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-white">
                                            Upgrade to Pro
                                        </p>
                                        <p className="text-xs text-purple-100">
                                            Unlock teams & collaboration
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <NavLink
                                        to="/pricing"
                                        className="w-full bg-white text-purple-600 hover:bg-zinc-50 border border-transparent rounded-md py-2 px-3 inline-flex items-center justify-center text-sm font-semibold transition-colors"
                                    >
                                        Learn More
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-col flex-1 md:ml-0 pt-16 min-h-screen">
                <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    <Outlet context={loaderData} />
                </main>
            </div>

            {/* Admin Button - Only visible to admin users */}
            {isAdmin && (
                <button
                    onClick={handleOpenAdminDrawer}
                    className="fixed bottom-6 right-6 z-[50] bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-colors"
                    title="Admin Tools"
                >
                    <Settings className="w-5 h-5" />
                </button>
            )}

            {/* Admin Tools Drawer */}
            <AdminToolsDrawer
                user={user}
                isAdmin={isAdmin}
                isOpen={isAdminDrawerOpen}
                onClose={handleCloseAdminDrawer}
            />
        </div>
    );
}
