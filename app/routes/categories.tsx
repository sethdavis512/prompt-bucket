import { useOutletContext } from "react-router"
import { FolderOpen, FileText } from "lucide-react"
import Layout from "~/components/Layout"

export default function Categories() {
  const { user, categories } = useOutletContext<{ 
    user: any; 
    categories: any[];
  }>()

  return (
    <Layout user={user}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Categories
          </h1>
          <p className="text-gray-600">
            Browse prompts by category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => (
            <div
              key={category.id}
              className="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div
                    className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  <h3 className="text-lg font-medium text-gray-900">
                    {category.name}
                  </h3>
                </div>
                
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {category._count.prompts} prompt{category._count.prompts !== 1 ? "s" : ""}
                  </span>
                </div>

                {category.prompts.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Recent Prompts:
                    </h4>
                    <div className="space-y-1">
                      {category.prompts
                        .sort((a, b) => new Date(b.prompt.updatedAt).getTime() - new Date(a.prompt.updatedAt).getTime())
                        .slice(0, 3)
                        .map((pc) => (
                        <div key={pc.prompt.id} className="text-sm">
                          <a
                            href={`/prompts/${pc.prompt.id}`}
                            className="text-indigo-600 hover:text-indigo-500 block truncate"
                          >
                            {pc.prompt.title}
                          </a>
                        </div>
                      ))}
                      {category.prompts.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{category.prompts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {category._count.prompts > 0 && (
                  <div className="mt-4">
                    <a
                      href={`/prompts?category=${category.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      View all prompts →
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {categories?.every(cat => cat._count.prompts === 0) && (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No prompts in categories yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Create some prompts and assign them to categories to get started.
            </p>
            <div className="mt-6">
              <a
                href="/prompts/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Your First Prompt
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}