import {
    type RouteConfig,
    index,
    route,
    layout,
    prefix
} from '@react-router/dev/routes';

export default [
    layout('routes/layout.tsx', [
        // Public routes
        index('routes/home.tsx'),
        route('pricing', 'routes/pricing.tsx'),
        route('access-denied', 'routes/access-denied.tsx'),
        ...prefix(`auth`, [
            route('sign-in', 'routes/auth/sign-in.tsx'),
            route('sign-up', 'routes/auth/sign-up.tsx')
        ]),
        route('share/:id', 'routes/share/prompt.tsx'),
        route('checkout', 'routes/checkout.tsx'),

        // Protected routes with auth + sidebar layout
        layout('routes/auth-layout.tsx', [
            route('dashboard', 'routes/dashboard.tsx'),
            route('categories', 'routes/categories.tsx'),
            route('profile', 'routes/profile.tsx'),
            route('billing', 'routes/billing.ts'),
            ...prefix(`prompts`, [
                index('routes/prompts/index.tsx'),
                route(':id', 'routes/prompts/detail.tsx'),
                route(':id/edit', 'routes/prompts/edit.tsx'),
                route('new', 'routes/prompts/new.tsx')
            ]),
            ...prefix(`chains`, [
                index('routes/chains/index.tsx'),
                route(':id', 'routes/chains/detail.tsx'),
                route(':id/edit', 'routes/chains/edit.tsx'),
                route('new', 'routes/chains/new.tsx')
            ]),
            // Team routes
            route('teams', 'routes/teams/index.tsx'),
            route('teams/new', 'routes/teams/new.tsx'),
            // Team workspace routes
            ...prefix(`teams/:slug`, [
                route('dashboard', 'routes/teams/workspace/dashboard.tsx'),
                ...prefix('prompts', [
                    index('routes/teams/workspace/prompts/index.tsx'),
                    route(':id', 'routes/teams/workspace/prompts/detail.tsx'),
                    route(
                        ':id/edit',
                        'routes/teams/workspace/prompts/edit.tsx'
                    ),
                    route('new', 'routes/teams/workspace/prompts/new.tsx')
                ]),
                ...prefix('chains', [
                    index('routes/teams/workspace/chains/index.tsx')
                ]),
                route('categories', 'routes/teams/workspace/categories.tsx'),
                ...prefix('settings', [
                    index('routes/teams/workspace/settings/index.tsx'),
                    route(
                        'members',
                        'routes/teams/workspace/settings/members.tsx'
                    )
                ])
            ]),
            // Team invitation acceptance
            route('invitations/:token', 'routes/invitations/accept.tsx'),

            // API routes
            ...prefix(`api`, [
                route(
                    'admin/user-settings',
                    'routes/api/admin/user-settings.ts'
                ),
                route('auth/*', 'routes/api/auth.tsx'),
                route('categories', 'routes/api/categories.ts'),
                route('chains', 'routes/api/chains.ts'),
                route('evaluate-chain', 'routes/api/evaluate-chain.ts'),
                route('score-prompt', 'routes/api/score-prompt.ts'),
                route('webhooks/polar', 'routes/api/webhooks/polar.tsx'),
                // Team API routes
                route('teams', 'routes/api/teams/index.ts'),
                route('teams/:id', 'routes/api/teams/detail.ts'),
                route('teams/:id/members', 'routes/api/teams/members.ts'),
                route(
                    'teams/:id/invitations',
                    'routes/api/teams/invitations.ts'
                ),
                route(
                    'invitations/:token/accept',
                    'routes/api/invitations/accept.ts'
                )
            ])
        ])
    ])
] satisfies RouteConfig;
