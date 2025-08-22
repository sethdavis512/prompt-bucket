import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { X, Settings, Crown, User, Users } from 'lucide-react';

interface AdminToolsDrawerProps {
    user: any;
    isAdmin: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminToolsDrawer({
    user,
    isAdmin,
    isOpen,
    onClose
}: AdminToolsDrawerProps) {
    const [isProUser, setIsProUser] = useState(
        user?.subscriptionStatus === 'active'
    );
    const updateFetcher = useFetcher();
    const userManagementFetcher = useFetcher();
    const usersFetcher = useFetcher();

    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedSubscriptionStatus, setSelectedSubscriptionStatus] =
        useState('free');

    useEffect(() => {
        setIsProUser(user?.subscriptionStatus === 'active');
    }, [user?.subscriptionStatus]);

    // Fetch users when drawer opens
    useEffect(() => {
        if (isOpen && usersFetcher.state === 'idle' && !usersFetcher.data) {
            usersFetcher.load('/api/admin/user-settings');
        }
    }, [isOpen, usersFetcher]);

    const handleToggleSubscription = () => {
        const newStatus = !isProUser;
        setIsProUser(newStatus);

        updateFetcher.submit(
            {
                intent: 'toggle_subscription',
                userId: user.id,
                subscriptionStatus: newStatus ? 'active' : 'free'
            },
            {
                method: 'post',
                action: '/api/admin/user-settings'
            }
        );
    };

    const handleUserManagementSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUserId) {
            return;
        }

        userManagementFetcher.submit(
            {
                intent: 'manage_user_subscription',
                userId: selectedUserId,
                subscriptionStatus: selectedSubscriptionStatus
            },
            {
                method: 'post',
                action: '/api/admin/user-settings'
            }
        );
    };

    // Auto-refresh page after successful update
    useEffect(() => {
        if (updateFetcher.data?.success) {
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    }, [updateFetcher.data]);

    // Handle successful user management update
    useEffect(() => {
        if (userManagementFetcher.data?.success) {
            // Reset form
            setSelectedUserId('');
            setSelectedSubscriptionStatus('free');
            // Refetch users to see updated data
            usersFetcher.load('/api/admin/user-settings');
        }
    }, [userManagementFetcher.data, usersFetcher]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 bg-opacity-50 z-[60]"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 z-[70] h-screen p-4 overflow-y-auto transition-transform bg-white w-80 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <h5 className="text-base font-semibold text-gray-900 uppercase flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Tools
                    </h5>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* User Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                            <User className="w-5 h-5 text-gray-600" />
                            <div>
                                <h6 className="text-sm font-medium text-gray-900">
                                    {user?.name}
                                </h6>
                                <p className="text-xs text-gray-500">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            <p>ID: {user?.id}</p>
                            <p>
                                Created:{' '}
                                {new Date(user?.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Subscription Toggle */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Crown
                                    className={`w-4 h-4 ${isProUser ? 'text-yellow-500' : 'text-gray-400'}`}
                                />
                                <span className="text-sm font-medium text-gray-900">
                                    Pro Subscription
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isProUser}
                                    onChange={handleToggleSubscription}
                                    disabled={updateFetcher.state !== 'idle'}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Current status:{' '}
                            <span
                                className={`font-medium ${isProUser ? 'text-green-600' : 'text-gray-600'}`}
                            >
                                {isProUser ? 'Active Pro User' : 'Free User'}
                            </span>
                        </p>
                        {updateFetcher.state === 'submitting' && (
                            <p className="text-xs text-blue-600 mt-1">
                                Updating...
                            </p>
                        )}
                        {updateFetcher.data?.success && (
                            <p className="text-xs text-green-600 mt-1">
                                ✅ Updated! Refreshing page...
                            </p>
                        )}
                        {updateFetcher.data?.error && (
                            <p className="text-xs text-red-600 mt-1">
                                ❌ {updateFetcher.data.error}
                            </p>
                        )}
                    </div>

                    {/* User Management Form */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-4">
                            <Users className="w-4 h-4 text-gray-600" />
                            <h6 className="text-sm font-medium text-gray-900">
                                Manage User Subscriptions
                            </h6>
                        </div>

                        <form
                            onSubmit={handleUserManagementSubmit}
                            className="space-y-3"
                        >
                            {/* User Selection */}
                            <div>
                                <label
                                    htmlFor="user-select"
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                    Select User
                                </label>
                                <select
                                    id="user-select"
                                    value={selectedUserId}
                                    onChange={(e) =>
                                        setSelectedUserId(e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Choose a user...</option>
                                    {usersFetcher.data?.users?.map((u: any) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || u.email} ({u.email}) -{' '}
                                            {u.role} - {u.subscriptionStatus}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subscription Status Selection */}
                            <div>
                                <label
                                    htmlFor="subscription-select"
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                    Subscription Status
                                </label>
                                <select
                                    id="subscription-select"
                                    value={selectedSubscriptionStatus}
                                    onChange={(e) =>
                                        setSelectedSubscriptionStatus(
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="free">Free</option>
                                    <option value="active">Pro</option>
                                </select>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={
                                    !selectedUserId ||
                                    userManagementFetcher.state !== 'idle'
                                }
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium py-2 px-3 rounded transition-colors"
                            >
                                {userManagementFetcher.state === 'submitting'
                                    ? 'Updating...'
                                    : 'Update User Subscription'}
                            </button>
                        </form>

                        {/* Status Messages */}
                        {userManagementFetcher.data?.success && (
                            <p className="text-xs text-green-600 mt-2">
                                ✅ {userManagementFetcher.data.message}
                            </p>
                        )}
                        {userManagementFetcher.data?.error && (
                            <p className="text-xs text-red-600 mt-2">
                                ❌ {userManagementFetcher.data.error}
                            </p>
                        )}
                        {usersFetcher.state === 'loading' && (
                            <p className="text-xs text-blue-600 mt-2">
                                Loading users...
                            </p>
                        )}
                    </div>

                    {/* Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700">
                            ⚠️ <strong>Admin Only:</strong> These tools directly
                            modify user data. Use with caution.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
