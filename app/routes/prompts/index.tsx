import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { prisma } from '~/lib/prisma';
import { auth } from '~/lib/auth';
import Layout from '~/components/Layout';
import type { Route } from './+types/index';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const categoryId = url.searchParams.get('category') || '';

    const whereClause: any = {
        userId: session!.user.id,
        ...(search && {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        })
    };

    if (categoryId) {
        whereClause.categories = {
            some: {
                categoryId: categoryId
            }
        };
    }

    const [prompts, categories] = await Promise.all([
        prisma.prompt.findMany({
            where: whereClause,
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
        })
    ]);

    return { prompts, categories, search, categoryId };
}

export default function PromptsIndex({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: any }>();
    const { prompts, categories, search, categoryId } = loaderData;
    console.log('PromptsIndex received:', {
        user: !!user,
        promptsCount: prompts.length,
        categoriesCount: categories.length
    });

    const [searchTerm, setSearchTerm] = useState(search);

    return (
        <Layout user={user}>
            <div className="px-4 py-6 sm:px-0">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                My Prompts
                            </h1>
                            <p className="text-gray-600">
                                Manage your prompt library
                            </p>
                        </div>
                        <Link
                            to="/prompts/new"
                            className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Prompt</span>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg mb-6">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Search prompts..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        onKeyPress={(e) => {
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
                                <select
                                    value={categoryId}
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
                                            url.searchParams.delete('category');
                                        }
                                        window.location.href = url.toString();
                                    }}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Categories</option>
                                    {categories
                                        .filter(
                                            (category) =>
                                                category._count.prompts > 0
                                        )
                                        .map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name} (
                                                {category._count.prompts})
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prompts Grid */}
                {prompts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {prompts.map((prompt) => (
                            <div
                                key={prompt.id}
                                className="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
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
                                        {prompt.categories.map((pc: any) => (
                                            <span
                                                key={pc.category.id}
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${pc.category.color || '#6B7280'}20`,
                                                    color:
                                                        pc.category.color ||
                                                        '#6B7280'
                                                }}
                                            >
                                                {pc.category.name}
                                            </span>
                                        ))}
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
                                            <Eye className="h-4 w-4" />
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
                                {search || categoryId
                                    ? 'No matching prompts found'
                                    : 'No prompts yet'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {search || categoryId
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Get started by creating your first prompt template.'}
                            </p>
                            {!search && !categoryId && (
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
        </Layout>
    );
}
