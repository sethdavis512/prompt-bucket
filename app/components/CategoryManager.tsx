import { useState } from 'react';
import { useFetcher } from 'react-router';
import { Plus, X, Check, AlertCircle } from 'lucide-react';

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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const createFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Categories
        </label>
        {isProUser ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Category
          </button>
        ) : (
          <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 cursor-not-allowed">
            <Plus className="w-3 h-3 mr-1" />
            Add Category
          </div>
        )}
      </div>

      {/* Create new category form */}
      {isCreating && (
        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <createFetcher.Form method="post" action="/api/categories" className="flex items-center space-x-2">
            <input type="hidden" name="intent" value="create" />
            <input type="hidden" name="color" value="#6366f1" />
            <input
              type="text"
              name="name"
              placeholder="Category name..."
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsCreating(false);
                }
              }}
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={createFetcher.state !== 'idle'}
              className="p-1 text-green-600 hover:text-green-500 disabled:text-gray-400"
            >
              {createFetcher.state === 'submitting' ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1 text-gray-400 hover:text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </createFetcher.Form>
        </div>
      )}

      {/* Categories list */}
      <div className="flex flex-wrap gap-2">
        {isProUser ? (
          <>
            {/* Pro user - show their categories */}
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category.id} className="relative inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => onCategoryToggle(category.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      selectedCategories.includes(category.id)
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
                    }`}
                  >
                    {category.name}
                  </button>
                  
                  {/* Delete button for categories with no prompts */}
                  {category._count?.prompts === 0 && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(category.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                      title="Delete category"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No categories yet. Create your first category to organize prompts.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Free user - show teaser categories */}
            <div className="flex flex-wrap gap-2 opacity-50">
              <div className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed">
                Marketing
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed">
                Development
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed">
                Content
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed">
                + More
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pro feature message for free users */}
      {!isProUser && (
        <p className="text-xs text-gray-500 mt-2">
          <AlertCircle className="w-3 h-3 inline mr-1" />
          Create custom categories to organize your prompts with Pro.{' '}
          <a href="/pricing" className="text-indigo-600 hover:text-indigo-500">
            Upgrade →
          </a>
        </p>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete Category
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{categories.find(c => c.id === deleteConfirm)?.name}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <deleteFetcher.Form method="post" action="/api/categories" className="inline">
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={deleteConfirm} />
                <button
                  type="submit"
                  disabled={deleteFetcher.state !== 'idle'}
                  className="px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                  onClick={() => setDeleteConfirm(null)}
                >
                  {deleteFetcher.state === 'submitting' ? 'Deleting...' : 'Delete'}
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