import { useState } from 'react';
import { useFetcher } from 'react-router';
import { Plus, X, AlertCircle } from 'lucide-react';

interface CategoryManagerProps {
    categories: any[];
    selectedCategories: string[];
    onCategoryToggle: (categoryId: string) => void;
    isProUser: boolean;
}

export default function CategoryManager({
    categories,
    selectedCategories,
    onCategoryToggle,
    isProUser
}: CategoryManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const createFetcher = useFetcher();
    const deleteFetcher = useFetcher();

    const handleCreateCategory = () => {
        if (!categoryName.trim()) return;

        createFetcher.submit(
            {
                intent: 'create',
                name: categoryName.trim(),
                color: '#6366f1'
            },
            {
                method: 'post',
                encType: 'application/json',
                action: '/api/categories'
            }
        );

        // Close modal and reset form on success
        setTimeout(() => {
            if (createFetcher.data?.category) {
                setIsCreating(false);
                setCategoryName('');
            }
        }, 100);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-700">
                    Categories
                </label>
                {isProUser ? (
                    <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-500"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Category
                    </button>
                ) : (
                    <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-zinc-400 cursor-not-allowed">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Category
                    </div>
                )}
            </div>

            {/* Categories list */}
            <div className="flex flex-wrap gap-2">
                {isProUser ? (
                    <>
                        {/* Pro user - show their categories */}
                        {categories.length > 0 ? (
                            categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="relative inline-flex items-center"
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onCategoryToggle(category.id)
                                        }
                                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                                            selectedCategories.includes(
                                                category.id
                                            )
                                                ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-105'
                                                : 'bg-white text-primary-600 border-primary-300 hover:bg-primary-100 hover:border-primary-400'
                                        }`}
                                    >
                                        {category.name}
                                    </button>

                                    {/* Delete button for user categories */}
                                    {(category._count?.prompts === 0 ||
                                        category._count?.prompts ===
                                            undefined) && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDeleteConfirm(category.id)
                                            }
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs z-10"
                                            title="Delete category"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-zinc-500 italic">
                                No categories yet. Create your first category to
                                organize prompts.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        {/* Free user - show teaser categories */}
                        <div className="flex flex-wrap gap-2 opacity-50">
                            <div className="px-3 py-1 rounded-full text-sm font-medium border bg-zinc-100 text-zinc-500 border-zinc-300 cursor-not-allowed">
                                Marketing
                            </div>
                            <div className="px-3 py-1 rounded-full text-sm font-medium border bg-zinc-100 text-zinc-500 border-zinc-300 cursor-not-allowed">
                                Development
                            </div>
                            <div className="px-3 py-1 rounded-full text-sm font-medium border bg-zinc-100 text-zinc-500 border-zinc-300 cursor-not-allowed">
                                Content
                            </div>
                            <div className="px-3 py-1 rounded-full text-sm font-medium border bg-zinc-100 text-zinc-500 border-zinc-300 cursor-not-allowed">
                                + More
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Pro feature message for free users */}
            {!isProUser && (
                <p className="text-xs text-zinc-500 mt-2">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Create custom categories to organize your prompts with Pro.{' '}
                    <a
                        href="/pricing"
                        className="text-primary-600 hover:text-primary-500"
                    >
                        Upgrade →
                    </a>
                </p>
            )}

            {/* Create category modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-medium text-zinc-900 mb-4">
                            Create Category
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) =>
                                    setCategoryName(e.target.value)
                                }
                                placeholder="Category name..."
                                className="w-full text-sm border border-zinc-300 rounded px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsCreating(false);
                                        setCategoryName('');
                                    }
                                    if (
                                        e.key === 'Enter' &&
                                        categoryName.trim()
                                    ) {
                                        handleCreateCategory();
                                    }
                                }}
                                autoFocus
                            />
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setCategoryName('');
                                    }}
                                    className="px-3 py-2 text-sm text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateCategory}
                                    disabled={
                                        createFetcher.state !== 'idle' ||
                                        !categoryName.trim()
                                    }
                                    className="px-3 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
                                >
                                    {createFetcher.state === 'submitting'
                                        ? 'Creating...'
                                        : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-medium text-zinc-900 mb-2">
                            Delete Category
                        </h3>
                        <p className="text-sm text-zinc-600 mb-4">
                            Are you sure you want to delete "
                            {
                                categories.find((c) => c.id === deleteConfirm)
                                    ?.name
                            }
                            "? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-2 text-sm text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md"
                            >
                                Cancel
                            </button>
                            <deleteFetcher.Form
                                method="post"
                                action="/api/categories"
                                className="inline"
                            >
                                <input
                                    type="hidden"
                                    name="intent"
                                    value="delete"
                                />
                                <input
                                    type="hidden"
                                    name="id"
                                    value={deleteConfirm}
                                />
                                <button
                                    type="submit"
                                    disabled={deleteFetcher.state !== 'idle'}
                                    className="px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                                    onClick={() => {
                                        setTimeout(() => {
                                            if (deleteFetcher.data?.success) {
                                                setDeleteConfirm(null);
                                            }
                                        }, 100);
                                    }}
                                >
                                    {deleteFetcher.state === 'submitting'
                                        ? 'Deleting...'
                                        : 'Delete'}
                                </button>
                            </deleteFetcher.Form>
                        </div>
                    </div>
                </div>
            )}

            {/* Error display */}
            {createFetcher.data?.error && (
                <div className="mt-2 text-sm text-red-600">
                    {createFetcher.data.error}
                </div>
            )}
            {deleteFetcher.data?.error && (
                <div className="mt-2 text-sm text-red-600">
                    {deleteFetcher.data.error}
                </div>
            )}
        </div>
    );
}
