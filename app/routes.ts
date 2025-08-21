import {
    type RouteConfig,
    index,
    route,
    layout
} from '@react-router/dev/routes';

export default [
    // Public routes
    index('routes/home.tsx'),
    route('/access-denied', 'routes/access-denied.tsx'),
    route('/auth/signin', 'routes/auth/signin.tsx'),
    route('/auth/signup', 'routes/auth/signup.tsx'),
    route('/share/:id', 'routes/share/prompt.tsx'),

    // API routes for auth
    route('/api/auth/*', 'routes/api/auth.tsx'),

    // Protected routes wrapped in auth layout
    layout('routes/auth-layout.tsx', [
        route('/dashboard', 'routes/dashboard.tsx'),
        route('/profile', 'routes/profile.tsx'),
        route('/prompts/:id', 'routes/prompts/detail.tsx'),
        route('/prompts/new', 'routes/prompts/new.tsx')
    ])
] satisfies RouteConfig;
