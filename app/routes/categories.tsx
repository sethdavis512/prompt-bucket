import { useOutletContext } from 'react-router';
import { FolderOpen } from 'lucide-react';
import { prisma } from '~/lib/prisma';
import { auth } from '~/lib/auth';
import CategoryManager from '~/components/CategoryManager';
import type { Route } from './+types/categories';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    // Get all categories for the user
    const categories = await prisma.category.findMany({
        where: {
            userId: session!.user.id
        },
        include: {
            _count: {
                select: { prompts: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return { categories };
}

export default function Categories({ loaderData }: Route.ComponentProps) {
    const { user, isProUser } = useOutletContext<{ user: any; isProUser: boolean }>();
    const { categories } = loaderData;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FolderOpen className="h-6 w-6 text-gray-400" />
                            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                        </div>
                    </div>
                    <p className="mt-2 text-gray-600">
                        Organize your prompts with custom categories.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white shadow rounded-lg p-6">
                    <CategoryManager
                        categories={categories}
                        selectedCategories={[]}
                        onCategoryToggle={() => {}}
                        isProUser={isProUser}
                    />

                    {isProUser && categories.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Categories</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map((category) => (
                                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900">
                                                    {category.name}
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                    {category._count.prompts} prompt{category._count.prompts !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: category.color || '#6366f1' }}
                                            />
                                        </div>
                                        {category.description && (
                                            <p className="mt-2 text-sm text-gray-600">
                                                {category.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isProUser && (
                        <div className="mt-8 text-center">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-indigo-900 mb-2">
                                    Unlock Categories with Pro
                                </h3>
                                <p className="text-indigo-700 mb-4">
                                    Create unlimited custom categories to organize your prompts and make them easier to find.
                                </p>
                                <a
                                    href="/pricing"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Upgrade to Pro
                                </a>
                            </div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}