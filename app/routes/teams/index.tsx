import type { Route } from './+types/index';
import { Link } from 'react-router';
import { requireAuth } from '~/lib/session';
import { getUserTeams } from '~/models/team.server';
import { useOutletContext } from 'react-router';
import type { AuthenticatedUser } from '~/lib/session';

export async function loader({ request }: Route.LoaderArgs) {
  const { user, isProUser } = await requireAuth(request);
  
  const teams = await getUserTeams(user.id);
  
  return {
    user,
    isProUser,
    teams
  };
}

export default function Teams({ loaderData }: Route.ComponentProps) {
  const { user } = useOutletContext<{ user: AuthenticatedUser }>();
  const { teams, isProUser } = loaderData;
  
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.196M17 20H7m10 0v-2c0-5.523-4.477-10-10-10S7 6.477 7 12v2m10 0H7m0 0H2v-2a3 3 0 015.196-2.196M7 20v-2m0 0V9a2 2 0 012-2h6a2 2 0 012 2v11" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
            </div>
            
            {isProUser ? (
              <Link
                to="/teams/new"
                data-cy="create-team-btn"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Team
              </Link>
            ) : (
              <div className="text-right">
                <Link
                  to="/pricing"
                  data-cy="upgrade-to-pro-btn"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade to Pro
                </Link>
                <p className="text-xs text-gray-500 mt-1">Team creation requires Pro</p>
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            Collaborate with your team members on prompts, chains, and categories
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
      
      {teams.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.196M17 20H7m10 0v-2c0-5.523-4.477-10-10-10S7 6.477 7 12v2m10 0H7m0 0H2v-2a3 3 0 015.196-2.196M7 20v-2m0 0V9a2 2 0 012-2h6a2 2 0 012 2v11" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            {isProUser 
              ? "Create your first team to start collaborating with colleagues."
              : "Teams allow you to collaborate on prompts and chains. Upgrade to Pro to create teams."
            }
          </p>
          
          {isProUser ? (
            <Link
              to="/teams/new"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Create Your First Team
            </Link>
          ) : (
            <Link
              to="/pricing"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
            >
              View Pro Plans
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const userMembership = team.members.find(member => member.userId === user.id);
            const isAdmin = userMembership?.role === 'ADMIN';
            
            return (
              <div
                key={team.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      /{team.slug}
                    </p>
                  </div>
                  
                  {isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Admin
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {team._count.members}
                      </div>
                      <div className="text-gray-500">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {team._count.prompts}
                      </div>
                      <div className="text-gray-500">Prompts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {team._count.chains}
                      </div>
                      <div className="text-gray-500">Chains</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                    <Link
                      to={`/teams/${team.slug}/dashboard`}
                      data-cy="open-team-btn"
                      className="flex-1 text-center py-2 px-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Open Team
                    </Link>
                    
                    {isAdmin && (
                      <Link
                        to={`/teams/${team.slug}/settings`}
                        className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                        title="Team Settings"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!isProUser && teams.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Unlock More Team Features
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Upgrade to Pro to create your own teams, get unlimited team members, and access advanced collaboration features.</p>
              </div>
              <div className="mt-4">
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  View Pro Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}