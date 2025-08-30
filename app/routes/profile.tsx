import { useOutletContext, Link } from 'react-router';
import { User, Mail, Calendar, Star, CreditCard } from 'lucide-react';

export default function Profile() {
    const { user, isProUser } = useOutletContext<{
        user: any;
        isProUser: boolean;
    }>();

    // Debug: Log user data to console
    console.log('Profile user data:', user);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-zinc-200">
                <div className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <User className="h-6 w-6 text-zinc-400" />
                        <h1 className="text-2xl font-bold text-zinc-900">
                            Profile Settings
                        </h1>
                    </div>
                    <p className="text-zinc-600 mt-2">
                        Manage your account information and preferences
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-2xl space-y-6">
                    {/* User Info Card */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-zinc-900 mb-4">
                                Account Information
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <User className="h-5 w-5 text-zinc-400 mr-3" />
                                    <div>
                                        <dt className="text-sm font-medium text-zinc-500">
                                            Name
                                        </dt>
                                        <dd className="text-sm text-zinc-900">
                                            {user.name || 'Not provided'}
                                        </dd>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <Mail className="h-5 w-5 text-zinc-400 mr-3" />
                                    <div>
                                        <dt className="text-sm font-medium text-zinc-500">
                                            Email
                                        </dt>
                                        <dd className="text-sm text-zinc-900">
                                            {user.email}
                                        </dd>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <Calendar className="h-5 w-5 text-zinc-400 mr-3" />
                                    <div>
                                        <dt className="text-sm font-medium text-zinc-500">
                                            Member since
                                        </dt>
                                        <dd className="text-sm text-zinc-900">
                                            {new Date(
                                                user.createdAt
                                            ).toLocaleDateString()}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-zinc-900">
                                    Subscription
                                </h3>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        isProUser
                                            ? 'bg-primary-100 text-primary-800'
                                            : 'bg-zinc-100 text-zinc-800'
                                    }`}
                                >
                                    {isProUser ? (
                                        <>
                                            <Star className="h-3 w-3 mr-1" />
                                            Pro Plan
                                        </>
                                    ) : (
                                        <>Free Plan</>
                                    )}
                                </span>
                            </div>

                            <p className="text-sm text-zinc-600 mb-4">
                                {isProUser
                                    ? "You're on the Pro plan with unlimited prompts and premium features."
                                    : "You're currently on the free plan. Upgrade to unlock premium features and unlimited prompts."}
                            </p>

                            <div className="bg-zinc-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-zinc-900 mb-2">
                                    {isProUser
                                        ? 'Pro Plan Features:'
                                        : 'Free Plan Features:'}
                                </h4>
                                <ul className="text-sm text-zinc-600 space-y-1">
                                    {isProUser ? (
                                        <>
                                            <li>• Unlimited prompt creation</li>
                                            <li>• Public prompt sharing</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>
                                                • 5 prompt templates maximum
                                            </li>
                                            <li>• Private prompts only</li>
                                        </>
                                    )}
                                </ul>
                            </div>

                            <div className="mt-4">
                                {isProUser ? (
                                    <Link
                                        to="/billing"
                                        className="inline-flex items-center bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Manage Billing
                                    </Link>
                                ) : (
                                    <Link
                                        to="/pricing"
                                        className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        Upgrade to Pro
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preferences Card */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-zinc-900 mb-4">
                                Preferences
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <dt className="text-sm font-medium text-zinc-900">
                                            Email Notifications
                                        </dt>
                                        <dd className="text-sm text-zinc-500">
                                            Receive updates about new features
                                        </dd>
                                    </div>
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        disabled
                                        className="h-4 w-4 text-primary-600 border-zinc-300 rounded focus:ring-primary-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <dt className="text-sm font-medium text-zinc-900">
                                            Marketing Emails
                                        </dt>
                                        <dd className="text-sm text-zinc-500">
                                            Receive tips and best practices
                                        </dd>
                                    </div>
                                    <input
                                        type="checkbox"
                                        disabled
                                        className="h-4 w-4 text-primary-600 border-zinc-300 rounded focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-zinc-200">
                                <p className="text-sm text-zinc-500">
                                    Preference settings will be available in a
                                    future update.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
