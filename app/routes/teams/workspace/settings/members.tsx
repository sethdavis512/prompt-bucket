import type { Route } from './+types/members';
import { requireTeamAdmin } from '~/lib/session';

export async function loader({ request, params }: Route.LoaderArgs) {
  const teamSlug = params.slug as string;
  const sessionData = await requireTeamAdmin(request, teamSlug);
  
  return {
    team: sessionData.team,
    user: sessionData.user,
    teamRole: sessionData.teamRole
  };
}

export default function TeamMemberSettings({ loaderData }: Route.ComponentProps) {
  const { team } = loaderData;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <p className="text-gray-600 mt-1">Manage members and invitations for {team.name}</p>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.196M17 20H7m10 0v-2c0-5.523-4.477-10-10-10S7 6.477 7 12v2m10 0H7m0 0H2v-2a3 3 0 015.196-2.196M7 20v-2m0 0V9a2 2 0 012-2h6a2 2 0 012 2v11" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Member Management Coming Soon</h3>
        <p className="text-gray-600">
          Advanced member management interface will be available in the next update. For now, use the invitation system to add members.
        </p>
      </div>
    </div>
  );
}