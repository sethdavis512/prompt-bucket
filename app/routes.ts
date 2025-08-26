import {
    type RouteConfig,
    index,
    route,
    layout,
    prefix
} from '@react-router/dev/routes';

export default [
    // API routes (no layout needed)
    ...prefix(`api`, [
        route('admin/user-settings', 'routes/api/admin/user-settings.ts'),
        route('auth/*', 'routes/api/auth.tsx'),
        route('categories', 'routes/api/categories.ts'),
        route('chains', 'routes/api/chains.ts'),
        route('evaluate-chain', 'routes/api/evaluate-chain.ts'),
        route('score-prompt', 'routes/api/score-prompt.ts'),
        route('webhooks/polar', 'routes/api.webhooks.polar.tsx')
    ]),

    // All UI routes wrapped in main layout
    layout('routes/layout.tsx', [
        // Public routes
        index('routes/home.tsx'),
        route('pricing', 'routes/pricing.tsx'),
        route('access-denied', 'routes/access-denied.tsx'),
        ...prefix(`auth`, [
            route('signin', 'routes/auth/signin.tsx'),
            route('signup', 'routes/auth/signup.tsx')
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
            ])
        ])
    ])
] satisfies RouteConfig;
