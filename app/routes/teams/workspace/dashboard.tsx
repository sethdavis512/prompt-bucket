import type { Route } from './+types/dashboard';
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

export default function TeamDashboard({ loaderData }: Route.ComponentProps) {
    const { team, user, teamRole } = loaderData;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        {team.name}
                    </h1>
                    <p className="text-zinc-600 mt-1">Team Dashboard</p>
                </div>

                <div className="text-sm text-zinc-500">
                    Your role: <span className="font-medium">{teamRole}</span>
                </div>
            </div>

            <div className="bg-primary-100 border border-primary-200 rounded-lg p-6">
                <h2 className="text-lg font-medium text-primary-900 mb-2">
                    🚧 Coming Soon
                </h2>
                <p className="text-primary-700">
                    Team workspace features are under development. This will
                    include:
                </p>
                <ul className="mt-2 text-primary-700 list-disc list-inside space-y-1">
                    <li>Shared team prompts and chains</li>
                    <li>Team activity feed</li>
                    <li>Collaboration tools</li>
                    <li>Team analytics and insights</li>
                </ul>
            </div>
        </div>
    );
}
