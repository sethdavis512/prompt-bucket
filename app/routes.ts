import {
    type RouteConfig,
    index,
    route,
    layout,
    prefix
} from '@react-router/dev/routes';

export default [
    // Public routes
    index('routes/home.tsx'),
    route('pricing', 'routes/pricing.tsx'),
    route('access-denied', 'routes/access-denied.tsx'),
    ...prefix(`auth`, [
        route('signin', 'routes/auth/signin.tsx'),
        route('signup', 'routes/auth/signup.tsx')
    ]),

    route('share/:id', 'routes/share/prompt.tsx'),

    // API routes for auth
    ...prefix(`api`, [
        route('auth/*', 'routes/api/auth.tsx'),
        route('webhooks/polar', 'routes/api.webhooks.polar.tsx')
    ]),

    // Polar payment routes
    route('checkout', 'routes/checkout.tsx'),

    // Protected routes wrapped in auth layout
    layout('routes/auth-layout.tsx', [
        route('dashboard', 'routes/dashboard.tsx'),
        route('profile', 'routes/profile.tsx'),
        route('billing', 'routes/billing.ts'),
        ...prefix(`prompts`, [
            route(':id', 'routes/prompts/detail.tsx'),
            route('new', 'routes/prompts/new.tsx')
        ])
    ])
] satisfies RouteConfig;
