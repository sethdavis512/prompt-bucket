import { useOutletContext } from "react-router"
import { User, Mail, Calendar, Crown } from "lucide-react"
import Layout from "~/components/Layout"

export default function Profile() {
  const { user } = useOutletContext<{ user: any }>()

  return (
    <Layout user={user}>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* User Info Card */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Account Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">
                      {user.name || "Not provided"}
                    </dd>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{user.email}</dd>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Member since</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Subscription
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Free Plan
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                You're currently on the free plan. Upgrade to unlock premium features and unlimited prompts.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Free Plan Features:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Unlimited prompt creation</li>
                  <li>• 10-section prompt structure</li>
                  <li>• Category organization</li>
                  <li>• Export functionality</li>
                </ul>
              </div>
              
              <div className="mt-4">
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                >
                  Upgrade to Pro (Coming Soon)
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Preferences
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Email Notifications</dt>
                    <dd className="text-sm text-gray-500">Receive updates about new features</dd>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    disabled
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Marketing Emails</dt>
                    <dd className="text-sm text-gray-500">Receive tips and best practices</dd>
                  </div>
                  <input
                    type="checkbox"
                    disabled
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Preference settings will be available in a future update.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}