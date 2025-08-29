import type { Route } from './+types/index';
import { requireTeamAuth } from '~/lib/session';

export async function loader({ request, params }: Route.LoaderArgs) {
  const teamSlug = params.slug as string;
  const sessionData = await requireTeamAuth(request, teamSlug);
  
  return {
    team: sessionData.team,
    user: sessionData.user,
    teamRole: sessionData.teamRole
  };
}

export default function TeamPrompts({ loaderData }: Route.ComponentProps) {
  const { team } = loaderData;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Prompts</h1>
          <p className="text-gray-600 mt-1">Collaborative prompts for {team.name}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Team Prompts Coming Soon</h3>
        <p className="text-gray-600">
          Collaborative prompt creation and management will be available soon.
        </p>
      </div>
    </div>
  );
}