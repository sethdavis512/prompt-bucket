import { Link, Form } from "react-router"
import { Home, FileText, FolderOpen, User, LogOut, Plus } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
  user?: {
    name?: string | null
    email: string
  } | null
}

export default function Layout({ children, user }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900">Prompt Lab</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/prompts"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                  >
                    <FileText className="h-4 w-4" />
                    <span>My Prompts</span>
                  </Link>
                  <Link
                    to="/categories"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>Categories</span>
                  </Link>
                  <Link
                    to="/prompts/new"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Prompt</span>
                  </Link>
                  <div className="relative group">
                    <button className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{user.name || user.email}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile Settings
                      </Link>
                      <Form method="post" action="/api/auth/sign-out">
                        <button
                          type="submit"
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </Form>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/signin"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}