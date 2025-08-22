import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import type { User } from '@prisma/client';
import {
    FileText,
    FolderOpen,
    TrendingUp,
    Plus,
    Search,
    Edit,
    Filter,
    EyeIcon,
    EyeOffIcon,
    TelescopeIcon,
    StarIcon
} from 'lucide-react';
import type { Route } from './+types/dashboard';

import TextField from '~/components/TextField';
import { prisma } from '~/lib/prisma';
import { auth } from '~/lib/auth';
import Layout from '~/components/Layout';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const categoryId = url.searchParams.get('category') || '';

    // Get user subscription status
    const user = await prisma.user.findUnique({
        where: { id: session!.user.id },
        select: { subscriptionStatus: true }
    });

    // Build where clause for prompts based on filters
    const promptWhere: any = { userId: session!.user.id };

    if (search) {
        promptWhere.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }

    if (categoryId) {
        promptWhere.categories = {
            some: {
                categoryId: categoryId
            }
        };
    }

    const [prompts, categories, promptCount] = await Promise.all([
        prisma.prompt.findMany({
            where: promptWhere,
            include: {
                categories: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        }),
        prisma.category.findMany({
            where: {
                userId: session!.user.id // Only user's own categories
            },
            include: {
                _count: {
                    select: {
                        prompts: {
                            where: {
                                prompt: {
                                    userId: session!.user.id
                                }
                            }
                        }
                    }
                }
            }
        }),
        prisma.prompt.count({
            where: { userId: session!.user.id }
        })
    ]);

    // Check if user is on pro plan
    const isProUser = user?.subscriptionStatus === 'active';
    const promptLimit = isProUser ? null : 5; // null means unlimited for pro users
    const canCreateMore = isProUser || promptCount < 5;

    return {
        prompts,
        categories,
        promptCount,
        search,
        categoryId,
        isProUser,
        promptLimit,
        canCreateMore
    };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: User }>();

    const [searchTerm, setSearchTerm] = useState(loaderData.search);

    return (
        <Layout user={user}>
            <div className="px-4 py-6 sm:px-0">
                <div className="flex justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Welcome back, {user.name || 'there'}!
                            </h1>
                            {loaderData.isProUser ? (
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Pro
                                </span>
                            ) : (
                                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Free
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600">
                            Manage your prompt library and create new templates
                        </p>
                        {!loaderData.isProUser && (
                            <p className="text-sm text-gray-500 mt-1">
                                {loaderData.promptCount}/
                                {loaderData.promptLimit} prompts used
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        {!loaderData.isProUser && (
                            <Link
                                to="/pricing"
                                className="flex gap-2 items-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Upgrade to Pro <StarIcon className='h-4 w-4' />
                            </Link>
                        )}
                        {loaderData.canCreateMore ? (
                            <Link
                                to="/prompts/new"
                                className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>New Prompt</span>
                            </Link>
                        ) : (
                            <div className="relative">
                                <button
                                    disabled
                                    className="bg-gray-300 text-gray-500 cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>New Prompt</span>
                                </button>
                                <div className="absolute -bottom-8 left-0 text-xs text-red-600">
                                    Limit reached.{' '}
                                    <Link to="/pricing" className="underline">
                                        Upgrade to Pro
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        {/* Filters */}
                        <div className="bg-white shadow rounded-lg mb-6">
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                                            <TextField
                                                type="search"
                                                placeholder="Search prompts..."
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value
                                                    )
                                                }
                                                inputClassName="pl-10"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const url = new URL(
                                                            window.location.href
                                                        );
                                                        url.searchParams.set(
                                                            'search',
                                                            searchTerm
                                                        );
                                                        window.location.href =
                                                            url.toString();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Filter className="h-4 w-4 text-gray-400" />
                                        {loaderData.isProUser ? (
                                            <select
                                                value={loaderData.categoryId}
                                                onChange={(e) => {
                                                    const url = new URL(
                                                        window.location.href
                                                    );
                                                    if (e.target.value) {
                                                        url.searchParams.set(
                                                            'category',
                                                            e.target.value
                                                        );
                                                    } else {
                                                        url.searchParams.delete(
                                                            'category'
                                                        );
                                                    }
                                                    window.location.href =
                                                        url.toString();
                                                }}
                                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                                            >
                                                <option value="">
                                                    All Categories
                                                </option>
                                                {loaderData.categories
                                                    .filter(
                                                        (category) =>
                                                            category._count
                                                                .prompts > 0
                                                    )
                                                    .map((category) => (
                                                        <option
                                                            key={category.id}
                                                            value={category.id}
                                                        >
                                                            {category.name} (
                                                            {
                                                                category._count
                                                                    .prompts
                                                            }
                                                            )
                                                        </option>
                                                    ))}
                                            </select>
                                        ) : (
                                            <select
                                                disabled
                                                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                                            >
                                                <option>Categories (Pro feature)</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prompts Grid */}
                        {loaderData.prompts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loaderData.prompts.map((prompt) => (
                                    <div
                                        key={prompt.id}
                                        className="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                {prompt.public ? (
                                                    <EyeIcon />
                                                ) : (
                                                    <EyeOffIcon />
                                                )}
                                                <p>
                                                    {prompt.public
                                                        ? 'Public'
                                                        : 'Private'}
                                                </p>
                                                {prompt.public && (
                                                    <a
                                                        className="text-indigo-600 hover:text-indigo-500"
                                                        href={`/share/${prompt.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        View public
                                                    </a>
                                                )}
                                            </div>

                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                                    {prompt.title}
                                                </h3>
                                            </div>

                                            {prompt.description && (
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                    {prompt.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {prompt.categories.map(
                                                    (pc: any) => (
                                                        <span
                                                            key={pc.category.id}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: `${pc.category.color || '#6B7280'}20`,
                                                                color:
                                                                    pc.category
                                                                        .color ||
                                                                    '#6B7280'
                                                            }}
                                                        >
                                                            {pc.category.name}
                                                        </span>
                                                    )
                                                )}
                                            </div>

                                            <div className="text-xs text-gray-500 mb-4">
                                                Updated{' '}
                                                {new Date(
                                                    prompt.updatedAt
                                                ).toLocaleDateString()}
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Link
                                                    to={`/prompts/${prompt.id}`}
                                                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-500 text-sm"
                                                >
                                                    <TelescopeIcon className="h-4 w-4" />
                                                    <span>View</span>
                                                </Link>
                                                <Link
                                                    to={`/prompts/${prompt.id}`}
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
                            <div className="bg-white shadow rounded-lg">
                                <div className="text-center py-12">
                                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        {loaderData.search ||
                                        loaderData.categoryId
                                            ? 'No matching prompts found'
                                            : 'No prompts yet'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {loaderData.search ||
                                        loaderData.categoryId
                                            ? 'Try adjusting your search or filter criteria.'
                                            : 'Get started by creating your first prompt template.'}
                                    </p>
                                    {!loaderData.search &&
                                        !loaderData.categoryId && (
                                            <div className="mt-6">
                                                <Link
                                                    to="/prompts/new"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create Your First Prompt
                                                </Link>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-1">
                        {/* Stats Cards */}
                        <div className="space-y-4">
                            <div className="bg-white shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <FileText className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    My Prompts
                                                </dt>
                                                <dd className="text-2xl font-bold text-gray-900">
                                                    {loaderData.promptCount}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <FolderOpen className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Categories
                                                </dt>
                                                <dd className="text-2xl font-bold text-gray-900">
                                                    {
                                                        loaderData.categories.filter(
                                                            (c) =>
                                                                c._count
                                                                    .prompts > 0
                                                        ).length
                                                    }
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <TrendingUp className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Account
                                                </dt>
                                                <dd className="text-2xl font-bold text-gray-900 capitalize">
                                                    {loaderData.isProUser ? 'Pro' : 'Free'}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
