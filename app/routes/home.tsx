import { Link } from 'react-router';
import {
    FileText,
    Zap,
    BookOpen,
    Users,
    ArrowRight,
    Check
} from 'lucide-react';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Prompt Bucket - Structure Your AI Prompts' },
        {
            name: 'description',
            content:
                'Create, organize, and manage AI prompts with our 10-section methodology. Build better prompts for better results.'
        }
    ];
}

const features = [
    {
        icon: FileText,
        title: '10-Section Structure',
        description:
            'Build prompts using our proven methodology that breaks down complex instructions into organized sections.'
    },
    {
        icon: Zap,
        title: 'Easy Management',
        description:
            'Create, edit, organize, and export your prompt templates with our intuitive interface.'
    },
    {
        icon: BookOpen,
        title: 'Category Organization',
        description:
            'Organize your prompts by categories like Writing, Code, Business, Education, and more.'
    },
    {
        icon: Users,
        title: 'Personal Library',
        description:
            'Build your own curated collection of prompt templates for different use cases and projects.'
    }
];

const promptSections = [
    'Task Context',
    'Tone Context',
    'Background Data',
    'Detailed Task Description',
    'Examples',
    'Conversation History',
    'Immediate Task',
    'Thinking Steps',
    'Output Formatting',
    'Prefilled Response'
];

export default function Home({
    loaderData,
    actionData,
    params,
    matches
}: Route.ComponentProps) {
    return (
        <div className="bg-gradient-to-br from-primary-50 via-white to-lime-50 min-h-screen">
            {/* Hero Section */}
            <div className="relative px-6 lg:px-8">
                <div className="mx-auto max-w-3xl pt-20 pb-32 sm:pt-48 sm:pb-40">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
                            Structure Your AI Prompts
                            <span className="text-primary-600">
                                {' '}
                                Like a Pro
                            </span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-zinc-600">
                            Create better AI prompts using our 10-section
                            methodology. Organize, manage, and export your
                            prompt templates for consistent, high-quality
                            results.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/auth/sign-up"
                                className="rounded-md bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/auth/sign-in"
                                className="text-base font-semibold leading-6 text-zinc-900 flex items-center"
                            >
                                Sign In <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                            Everything you need for better prompts
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-zinc-600">
                            Our platform provides all the tools you need to
                            create, organize, and manage professional-quality AI
                            prompts.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="flex flex-col"
                                >
                                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900">
                                        <feature.icon
                                            className="h-5 w-5 flex-none text-primary-600"
                                            aria-hidden="true"
                                        />
                                        {feature.title}
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600">
                                        <p className="flex-auto">
                                            {feature.description}
                                        </p>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>

            {/* 10-Section Methodology */}
            <div className="py-24 bg-zinc-50">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                            The 10-Section Methodology
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-zinc-600">
                            Structure your prompts using our proven framework
                            that ensures comprehensive, clear, and effective AI
                            instructions.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-4xl">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                            {promptSections.map((section, index) => (
                                <div
                                    key={section}
                                    className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm"
                                >
                                    <div className="flex-shrink-0">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-zinc-900">
                                            {section}
                                        </p>
                                    </div>
                                    <Check className="h-4 w-4 text-green-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-primary-600">
                <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Ready to create better prompts?
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-200">
                            Join thousands of users who are already creating
                            professional-quality AI prompts with our structured
                            approach.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/auth/sign-up"
                                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-primary-600 shadow-sm hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                Start Building Prompts
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
