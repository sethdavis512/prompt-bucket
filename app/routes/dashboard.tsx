import { Link, useOutletContext } from 'react-router';
import type { User } from '@prisma/client';
import {
    Home,
    FileText,
    FolderOpen,
    TrendingUp,
    Link2,
    Plus
} from 'lucide-react';
import type { Route } from './+types/dashboard';
import { requireAuth } from '~/lib/session';
import { getCategoryCountByUserId } from '~/models/category.server';
import { getPromptCountByUserId, getPromptScoringStats } from '~/models/prompt.server';
import { getChainCountByUserId, getChainScoringStats } from '~/models/chain.server';

export async function loader({ request }: Route.LoaderArgs) {
    const { user, isProUser } = await requireAuth(request);

    const [categories, promptCount, promptStats, chainStats] = await Promise.all([
        getCategoryCountByUserId(user.id),
        getPromptCountByUserId(user.id),
        getPromptScoringStats(user.id),
        // Chain statistics (only for Pro users)
        isProUser ? Promise.all([
            getChainCountByUserId(user.id),
            getChainScoringStats(user.id)
        ]).then(([count, agg]) => ({ count, ...agg })) : { count: 0, _avg: { chainScore: null }, _max: { chainScore: null }, _count: { chainScore: 0 } }
    ]);

    const promptLimit = isProUser ? null : 5;
    const canCreateMore = isProUser || promptCount < 5;

    return {
        categoriesCount: categories,
        promptCount,
        promptStats,
        chainStats,
        isProUser,
        promptLimit,
        canCreateMore
    };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: User; isProUser: boolean }>();

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Home className="h-6 w-6 text-gray-400" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dashboard
                            </h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            {loaderData.canCreateMore ? (
                                <Link
                                    to="/prompts/new"
                                    data-cy="new-prompt-button"
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>New Prompt</span>
                                </Link>
                            ) : (
                                <div className="relative">
                                    <button
                                        disabled
                                        data-cy="new-prompt-button"
                                        className="bg-gray-300 text-gray-500 cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>New Prompt</span>
                                    </button>
                                    <div className="absolute -bottom-8 left-0 text-xs text-red-600">
                                        Limit reached.{' '}
                                        <Link
                                            to="/pricing"
                                            className="underline"
                                        >
                                            Upgrade to Pro
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-600 mt-2">
                        Welcome back, {user.name || 'there'}! Manage your prompt
                        library and create new templates.
                    </p>
                    {!loaderData.isProUser && (
                        <p className="text-sm text-gray-500 mt-1">
                            {loaderData.promptCount}/{loaderData.promptLimit}{' '}
                            prompts used
                        </p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Total Prompts */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FileText className="h-8 w-8 text-indigo-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Prompts
                                        </dt>
                                        <dd className="text-3xl font-bold text-gray-900">
                                            {loaderData.promptCount}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Categories (Pro Users Only) */}
                    {loaderData.isProUser && (
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <FolderOpen className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Categories
                                            </dt>
                                            <dd className="text-3xl font-bold text-gray-900">
                                                {loaderData.categoriesCount}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prompt Chains (Pro Users Only) */}
                    {loaderData.isProUser && (
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Link2 className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Prompt Chains
                                            </dt>
                                            <dd className="text-3xl font-bold text-gray-900">
                                                {loaderData.chainStats.count}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Status */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Account Status
                                        </dt>
                                        <dd className="text-3xl font-bold text-gray-900 capitalize">
                                            {loaderData.isProUser ? (
                                                <span className="text-indigo-600">Pro</span>
                                            ) : (
                                                'Free'
                                            )}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                            {!loaderData.isProUser && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">
                                        {loaderData.promptCount}/{loaderData.promptLimit} prompts used
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prompt Scoring Stats */}
                    {loaderData.promptStats._count.totalScore > 0 && (
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="text-sm font-medium text-gray-500 mb-3">
                                    Prompt Scoring
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Scored Prompts</span>
                                        <span className="text-lg font-semibold text-gray-900">
                                            {loaderData.promptStats._count.totalScore}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Average Score</span>
                                        <span className="text-lg font-semibold text-gray-900">
                                            {Math.round((loaderData.promptStats._avg.totalScore || 0) * 10) / 10}/100
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Best Score</span>
                                        <span className="text-lg font-semibold text-green-600">
                                            {loaderData.promptStats._max.totalScore}/100
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chain Scoring Stats (Pro Users Only) */}
                    {loaderData.isProUser && loaderData.chainStats._count.chainScore > 0 && (
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="text-sm font-medium text-gray-500 mb-3">
                                    Chain Scoring
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Evaluated Chains</span>
                                        <span className="text-lg font-semibold text-gray-900">
                                            {loaderData.chainStats._count.chainScore}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Average Score</span>
                                        <span className="text-lg font-semibold text-gray-900">
                                            {Math.round((loaderData.chainStats._avg.chainScore || 0) * 10) / 10}/10
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Best Score</span>
                                        <span className="text-lg font-semibold text-green-600">
                                            {loaderData.chainStats._max.chainScore}/10
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
