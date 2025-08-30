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

export default function TeamChains({ loaderData }: Route.ComponentProps) {
    const { team } = loaderData;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Team Chains
                    </h1>
                    <p className="text-zinc-600 mt-1">
                        Collaborative prompt chains for {team.name}
                    </p>
                </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-2">
                    Team Chains Coming Soon
                </h3>
                <p className="text-zinc-600">
                    Collaborative prompt chain creation and management will be
                    available soon.
                </p>
            </div>
        </div>
    );
}
