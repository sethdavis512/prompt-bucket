import type { Route } from './+types/detail';
import { requireTeamAuth } from '~/lib/session';

export async function loader({ request, params }: Route.LoaderArgs) {
  const teamSlug = params.slug as string;
  const sessionData = await requireTeamAuth(request, teamSlug);
  
  return {
    team: sessionData.team,
    user: sessionData.user,
    teamRole: sessionData.teamRole,
    promptId: params.id
  };
}

export default function TeamPromptDetail({ loaderData }: Route.ComponentProps) {
  const { team, promptId } = loaderData;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Prompt Detail</h1>
        <p className="text-gray-600 mt-1">Prompt ID: {promptId} | Team: {team.name}</p>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-600">
          Team prompt details will be available in the next update.
        </p>
      </div>
    </div>
  );
}