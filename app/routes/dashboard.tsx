import { Link, useOutletContext } from "react-router"
import { PlusCircle, FileText, FolderOpen, TrendingUp } from "lucide-react"
import { prisma } from "~/lib/prisma"
import { auth } from "~/lib/auth"
import Layout from "~/components/Layout"
import type { Route } from "./+types/dashboard"

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  const [prompts, categories, promptCount] = await Promise.all([
    prisma.prompt.findMany({
      where: { userId: session!.user.id },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
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
    }),
    prisma.prompt.count({
      where: { userId: session!.user.id }
    })
  ]);
  
  return { prompts, categories, promptCount };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user } = useOutletContext<{ user: any }>()
  const { prompts, categories, promptCount } = loaderData

  return (
    <Layout user={user}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || "there"}!
          </h1>
          <p className="text-gray-600">
            Manage your prompt library and create new templates
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Prompts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {promptCount}
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
                      Categories Used
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {categories.filter(c => c._count.prompts > 0).length}
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
                      Account Status
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 capitalize">
                      Free
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/prompts/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Prompt
              </Link>
              <Link
                to="/prompts"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                View All Prompts
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Prompts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Prompts
              </h3>
              <Link
                to="/prompts"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all →
              </Link>
            </div>
            
            {prompts.length > 0 ? (
              <div className="space-y-3">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <Link
                        to={`/prompts/${prompt.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {prompt.title}
                      </Link>
                      {prompt.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {prompt.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        {prompt.categories.map((pc: any) => (
                          <span
                            key={pc.category.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {pc.category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      to={`/prompts/${prompt.id}/edit`}
                      className="text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No prompts yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first prompt template.
                </p>
                <div className="mt-6">
                  <Link
                    to="/prompts/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Prompt
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}