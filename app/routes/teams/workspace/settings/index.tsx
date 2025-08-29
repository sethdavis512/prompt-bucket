import type { Route } from './+types/index';
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

export default function TeamSettings({ loaderData }: Route.ComponentProps) {
  const { team } = loaderData;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
        <p className="text-gray-600 mt-1">Manage settings for {team.name}</p>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Team Settings Coming Soon</h3>
        <p className="text-gray-600">
          Advanced team configuration and settings will be available in the next update.
        </p>
      </div>
    </div>
  );
}