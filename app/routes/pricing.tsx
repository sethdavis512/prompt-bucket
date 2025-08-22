import { Link } from 'react-router';
import { Check, Star, Zap, CreditCard } from 'lucide-react';
import { auth } from '~/lib/auth';
import { prisma } from '~/lib/prisma';
import type { Route } from './+types/pricing';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    let user = null;

    if (session) {
        user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                subscriptionStatus: true,
                customerId: true
            }
        });
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
            description: 'Everything you need to build amazing prompts',
            features: [
                'Unlimited prompt templates',
                'Advanced prompt structure',
                'Public prompt sharing',
                'Priority support',
                'Advanced categorization',
                'Export & import features'
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
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6 text-gray-400" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            Pricing
                        </h1>
                    </div>
                    <p className="text-gray-600 mt-2">
                        Choose the plan that's right for you
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Choose the plan that's right for you. Upgrade or
                        downgrade at any time.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl border-2 p-8 ${
                                    plan.highlighted
                                        ? 'border-indigo-500 shadow-lg scale-105'
                                        : 'border-gray-200 shadow-sm'
                                } ${plan.current ? 'ring-2 ring-indigo-200' : ''}`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
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
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold text-gray-900">
                                            {plan.price}
                                        </span>
                                        <span className="text-gray-600">
                                            /{plan.period}
                                        </span>
                                    </div>
                                    <p className="text-gray-600">
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
                                            <span className="text-gray-700">
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
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                                            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                                        >
                                            {plan.buttonText}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {!user && (
                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-4">
                            Need an account first?
                        </p>
                        <Link
                            to="/auth"
                            className="inline-flex items-center px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
                        >
                            Sign Up Free
                        </Link>
                    </div>
                )}

                <div className="mt-16 text-center">
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h3>
                        <div className="space-y-4 text-left">
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h4 className="font-medium text-gray-900 mb-2">
                                    Can I change plans anytime?
                                </h4>
                                <p className="text-gray-600">
                                    Yes! You can upgrade or downgrade your plan
                                    at any time. Changes take effect immediately
                                    for upgrades.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h4 className="font-medium text-gray-900 mb-2">
                                    What happens to my prompts if I downgrade?
                                </h4>
                                <p className="text-gray-600">
                                    Your existing prompts remain accessible, but
                                    you won't be able to create new ones beyond
                                    the free plan limit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
