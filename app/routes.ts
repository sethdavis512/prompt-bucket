import {
    type RouteConfig,
    index,
    route,
    layout
} from '@react-router/dev/routes';

export default [
    // Public routes
    index('routes/home.tsx'),
    route('/auth/signin', 'routes/auth/signin.tsx'),
    route('/auth/signup', 'routes/auth/signup.tsx'),
    route('/share/:id', 'routes/share/prompt.tsx'),
    route('/access-denied', 'routes/access-denied.tsx'),

    // API routes for auth
    route('/api/auth/*', 'routes/api/auth.tsx'),

    // Protected routes wrapped in auth layout
    layout('routes/auth-layout.tsx', [
        route('/dashboard', 'routes/dashboard.tsx'),
        route('/prompts', 'routes/prompts/index.tsx'),
        route('/prompts/new', 'routes/prompts/new.tsx'),
        route('/prompts/:id', 'routes/prompts/detail.tsx'),
        route('/categories', 'routes/categories.tsx'),
        route('/profile', 'routes/profile.tsx')
    ])
] satisfies RouteConfig;
