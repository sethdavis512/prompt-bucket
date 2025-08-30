import { Link } from 'react-router';
import { Check, Star, Zap, CreditCard, Users } from 'lucide-react';
import { auth } from '~/lib/auth';
import { getUserById } from '~/models/user.server';
import type { Route } from './+types/pricing';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    let user = null;

    if (session) {
        user = await getUserById(session.user.id);
    }

    return { products: process.env.POLAR_SUBSCRIPTION_PRODUCT_ID!, user };
}

export default function Pricing({ loaderData }: Route.ComponentProps) {
    const { user, products } = loaderData;
    const isProUser = user?.subscriptionStatus === 'active';

    const generateCheckoutUrl = () => {
        const params = new URLSearchParams({
            products
        });

        if (user) {
            params.set('customerEmail', user.email);
            if (user.name) {
                params.set('customerName', user.name);
            }
        }

        return `/checkout?${params.toString()}`;
    };

    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: 'forever',
            description: 'Perfect for getting started with prompt engineering',
            features: [
                '5 prompt templates',
                'Basic prompt structure',
                'Private prompts only',
                'Standard support'
            ],
            buttonText: 'Current Plan',
            buttonVariant: 'secondary' as const,
            highlighted: false,
            current: !isProUser
        },
        {
            name: 'Pro',
            price: '$10',
            period: 'month',
            teamPrice: '$8',
            description:
                'For individuals and teams who want to collaborate on prompts',
            features: [
                'Unlimited prompt templates',
                'Advanced prompt structure',
                'Public prompt sharing',
                'Priority support',
                'Advanced categorization',
                'Export & import features',
                'Create and manage teams',
                'Team collaboration workspace',
                'Shared prompts, chains & categories',
                'Team member invitations'
            ],
            buttonText: isProUser ? 'Current Plan' : 'Upgrade to Pro',
            buttonVariant: isProUser
                ? ('secondary' as const)
                : ('primary' as const),
            highlighted: true,
            current: isProUser,
            href: isProUser ? '/billing' : generateCheckoutUrl()
        }
    ];

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-zinc-200">
                <div className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6 text-zinc-400" />
                        <h1 className="text-2xl font-bold text-zinc-900">
                            Pricing
                        </h1>
                    </div>
                    <p className="text-zinc-600 mt-2">
                        Choose the plan that's right for you and your team
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-zinc-900 mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
                        Scale from individual productivity to team
                        collaboration. Upgrade or downgrade at any time.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl border-2 p-8 ${
                                    plan.highlighted
                                        ? 'border-primary-500 shadow-lg scale-105'
                                        : 'border-zinc-200 shadow-sm'
                                } ${plan.current ? 'ring-2 ring-primary-200' : ''}`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                                            <Star className="w-4 h-4 mr-1" />
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {plan.current && (
                                    <div className="absolute -top-4 right-4">
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            Current Plan
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold text-zinc-900">
                                            {plan.price}
                                        </span>
                                        <span className="text-zinc-600">
                                            /{plan.period}
                                        </span>
                                        {plan.teamPrice && (
                                            <div className="mt-2 text-sm text-zinc-600">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <Users className="h-4 w-4" />
                                                    <span>
                                                        Teams:{' '}
                                                        <strong className="text-primary-600">
                                                            {plan.teamPrice}
                                                            /user/month
                                                        </strong>
                                                    </span>
                                                </div>
                                                <p className="text-xs mt-1 text-zinc-500">
                                                    Minimum 2 seats
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-zinc-600">
                                        {plan.description}
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start"
                                        >
                                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <span className="text-zinc-700">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="text-center">
                                    {plan.href ? (
                                        <Link
                                            to={plan.href}
                                            className={`inline-flex items-center justify-center w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                                                plan.buttonVariant === 'primary'
                                                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                            }`}
                                        >
                                            {plan.buttonText}
                                            {plan.buttonVariant ===
                                                'primary' && (
                                                <Zap className="w-4 h-4 ml-2" />
                                            )}
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg font-medium bg-zinc-100 text-zinc-500 cursor-not-allowed"
                                        >
                                            {plan.buttonText}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Team Savings Calculator */}
                    <div className="mt-16 max-w-4xl mx-auto">
                        <div className="bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-2xl p-8">
                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-primary-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                                    Team Savings
                                </h3>
                                <p className="text-zinc-600">
                                    Save money when you bring your team together
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-lg font-semibold text-zinc-900 mb-1">
                                        2-Person Team
                                    </div>
                                    <div className="text-3xl font-bold text-primary-600 mb-2">
                                        $16
                                        <span className="text-base text-zinc-500">
                                            /month
                                        </span>
                                    </div>
                                    <div className="text-sm text-zinc-500">
                                        vs $20 individual plans
                                    </div>
                                    <div className="text-sm font-medium text-green-600 mt-1">
                                        Save $4/month
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-lg font-semibold text-zinc-900 mb-1">
                                        5-Person Team
                                    </div>
                                    <div className="text-3xl font-bold text-primary-600 mb-2">
                                        $40
                                        <span className="text-base text-zinc-500">
                                            /month
                                        </span>
                                    </div>
                                    <div className="text-sm text-zinc-500">
                                        vs $50 individual plans
                                    </div>
                                    <div className="text-sm font-medium text-green-600 mt-1">
                                        Save $10/month
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6">
                                    <div className="text-lg font-semibold text-zinc-900 mb-1">
                                        10-Person Team
                                    </div>
                                    <div className="text-3xl font-bold text-primary-600 mb-2">
                                        $80
                                        <span className="text-base text-zinc-500">
                                            /month
                                        </span>
                                    </div>
                                    <div className="text-sm text-zinc-500">
                                        vs $100 individual plans
                                    </div>
                                    <div className="text-sm font-medium text-green-600 mt-1">
                                        Save $20/month
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-zinc-600 mb-4">
                                    Ready to collaborate with your team?
                                </p>
                                <Link
                                    to={user ? '/teams' : '/auth/signup'}
                                    className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    {user ? 'Manage Teams' : 'Start Your Team'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {!user && (
                    <div className="mt-12 text-center">
                        <p className="text-zinc-600 mb-4">
                            Need an account first?
                        </p>
                        <Link
                            to="/auth"
                            className="inline-flex items-center px-6 py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
                        >
                            Sign Up Free
                        </Link>
                    </div>
                )}

                <div className="mt-16 text-center">
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-xl font-semibold text-zinc-900 mb-4">
                            Frequently Asked Questions
                        </h3>
                        <div className="space-y-4 text-left">
                            <div className="bg-zinc-50 rounded-lg p-6">
                                <h4 className="font-medium text-zinc-900 mb-2">
                                    Can I change plans anytime?
                                </h4>
                                <p className="text-zinc-600">
                                    Yes! You can upgrade or downgrade your plan
                                    at any time. Changes take effect immediately
                                    for upgrades.
                                </p>
                            </div>
                            <div className="bg-zinc-50 rounded-lg p-6">
                                <h4 className="font-medium text-zinc-900 mb-2">
                                    What happens to my prompts if I downgrade?
                                </h4>
                                <p className="text-zinc-600">
                                    Your existing prompts remain accessible, but
                                    you won't be able to create new ones beyond
                                    the free plan limit.
                                </p>
                            </div>
                            <div className="bg-zinc-50 rounded-lg p-6">
                                <h4 className="font-medium text-zinc-900 mb-2">
                                    How does team pricing work?
                                </h4>
                                <p className="text-zinc-600">
                                    Teams are billed at $8 per user per month
                                    with a minimum of 2 seats. Each team member
                                    gets full Pro features plus access to shared
                                    team workspaces.
                                </p>
                            </div>
                            <div className="bg-zinc-50 rounded-lg p-6">
                                <h4 className="font-medium text-zinc-900 mb-2">
                                    Can I mix individual and team subscriptions?
                                </h4>
                                <p className="text-zinc-600">
                                    Yes! You can have a personal Pro
                                    subscription and also be part of team
                                    workspaces. Team admins manage team billing
                                    separately from individual subscriptions.
                                </p>
                            </div>
                            <div className="bg-zinc-50 rounded-lg p-6">
                                <h4 className="font-medium text-zinc-900 mb-2">
                                    What team features are included?
                                </h4>
                                <p className="text-zinc-600">
                                    Teams get shared workspaces for prompts,
                                    chains, and categories, member invitation
                                    system, role-based permissions, and
                                    collaborative editing features.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
