import { useState } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router';
import type { User } from '@prisma/client';
import {
    Link2,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Star,
    Crown
} from 'lucide-react';
import type { Route } from './+types/index';

import TextField from '~/components/TextField';
import { prisma } from '~/lib/prisma';
import { auth } from '~/lib/auth';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';

    // Get user subscription status
    const user = await prisma.user.findUnique({
        where: { id: session!.user.id },
        select: { subscriptionStatus: true }
    });

    const isProUser = user?.subscriptionStatus === 'active';

    // If not Pro user, return empty data
    if (!isProUser) {
        return {
            chains: [],
            chainCount: 0,
            search,
            isProUser: false
        };
    }

    // Build where clause for chains based on search
    const chainWhere: any = { userId: session!.user.id };

    if (search) {
        chainWhere.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [chains, chainCount] = await Promise.all([
        prisma.chain.findMany({
            where: chainWhere,
            include: {
                prompts: {
                    include: {
                        prompt: {
                            select: {
                                id: true,
                                title: true,
                                description: true
                            }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        }),
        prisma.chain.count({
            where: { userId: session!.user.id }
        })
    ]);

    return {
        chains,
        chainCount,
        search,
        isProUser
    };
}

export default function ChainsIndex({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: User; isProUser: boolean }>();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState(loaderData.search);

    // If not Pro user, show upgrade prompt
    if (!loaderData.isProUser) {
        return (
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Link2 className="h-6 w-6 text-gray-400" />
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Prompt Chains
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pro upgrade content */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <Crown className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Unlock Prompt Chaining
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Create powerful multi-step workflows by chaining
                            your prompts together. Get AI-powered evaluation and
                            feedback to optimize your chains.
                        </p>
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center text-sm text-gray-700">
                                <Star className="h-4 w-4 text-amber-500 mr-2" />
                                Horizontal scrolling chain interface
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                                <Star className="h-4 w-4 text-amber-500 mr-2" />
                                AI-powered chain evaluation and scoring
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                                <Star className="h-4 w-4 text-amber-500 mr-2" />
                                Flow analysis and optimization suggestions
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link2 className="h-6 w-6 text-gray-400" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                Prompt Chains
                            </h1>
                        </div>
                        <Link
                            to="/chains/new"
                            className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Chain</span>
                        </Link>
                    </div>

                    {loaderData.chainCount > 0 && (
                        <p className="text-gray-600 mt-2">
                            {loaderData.chainCount} chain
                            {loaderData.chainCount !== 1 ? 's' : ''} created
                        </p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {loaderData.chainCount > 0 && (
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                            <TextField
                                type="search"
                                placeholder="Search chains..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                inputClassName="pl-10"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const searchParams =
                                            new URLSearchParams();
                                        if (searchTerm) {
                                            searchParams.set(
                                                'search',
                                                searchTerm
                                            );
                                        }
                                        const queryString =
                                            searchParams.toString();
                                        navigate(
                                            queryString
                                                ? `/chains?${queryString}`
                                                : '/chains'
                                        );
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {loaderData.chains.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loaderData.chains.map((chain) => (
                            <div
                                key={chain.id}
                                className="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-medium text-gray-900 truncate">
                                            {chain.name}
                                        </h3>
                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                            <Link2 className="h-3 w-3" />
                                            <span>{chain.prompts.length}</span>
                                        </div>
                                    </div>

                                    {chain.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {chain.description}
                                        </p>
                                    )}

                                    {/* Chain preview */}
                                    <div className="mb-4">
                                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                                            <span>Chain Steps:</span>
                                        </div>
                                        <div className="space-y-1">
                                            {chain.prompts
                                                .slice(0, 3)
                                                .map((chainPrompt, index) => (
                                                    <div
                                                        key={chainPrompt.id}
                                                        className="text-xs text-gray-600 truncate"
                                                    >
                                                        {index + 1}.{' '}
                                                        {
                                                            chainPrompt.prompt
                                                                .title
                                                        }
                                                    </div>
                                                ))}
                                            {chain.prompts.length > 3 && (
                                                <div className="text-xs text-gray-400">
                                                    ... and{' '}
                                                    {chain.prompts.length - 3}{' '}
                                                    more
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Chain score */}
                                    {chain.chainScore && (
                                        <div className="mb-4">
                                            <div className="flex items-center space-x-2">
                                                <Star className="h-4 w-4 text-amber-500" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Score: {chain.chainScore}/10
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                        <div className="flex items-center space-x-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                Updated{' '}
                                                {new Date(
                                                    chain.updatedAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {chain.lastEvaluatedAt && (
                                            <div className="flex items-center space-x-1">
                                                <Eye className="h-3 w-3" />
                                                <span>Evaluated</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Link
                                            to={`/chains/${chain.id}`}
                                            className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-500 text-sm"
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span>View</span>
                                        </Link>
                                        <Link
                                            to={`/chains/${chain.id}?edit=true`}
                                            className="flex items-center space-x-1 text-gray-600 hover:text-gray-500 text-sm"
                                        >
                                            <Edit className="h-4 w-4" />
                                            <span>Edit</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Link2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {loaderData.search
                                ? 'No matching chains found'
                                : 'No chains yet'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {loaderData.search
                                ? 'Try adjusting your search criteria.'
                                : 'Get started by creating your first prompt chain.'}
                        </p>
                        {!loaderData.search && (
                            <div className="mt-6">
                                <Link
                                    to="/chains/new"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Chain
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
