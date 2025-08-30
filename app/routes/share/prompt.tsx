import { useState } from 'react';
import { redirect } from 'react-router';
import { Copy, Check, Home } from 'lucide-react';
import { getPromptForSharingById } from '~/models/prompt.server';
import Button from '~/components/Button';
import type { Route } from './+types/prompt';

export async function loader({ params }: Route.LoaderArgs) {
    const promptId = params.id;

    if (!promptId) {
        throw new Response('Prompt not found', { status: 404 });
    }

    const prompt = await getPromptForSharingById(promptId);

    if (!prompt) {
        throw new Response('Prompt not found', { status: 404 });
    }

    // If prompt is private, redirect to access denied page
    if (!prompt.public) {
        return redirect('/access-denied');
    }

    return { prompt };
}

const promptSections = [
    {
        id: 'taskContext',
        title: '1. Task Context',
        description: "Define the AI's role and expertise area"
    },
    {
        id: 'toneContext',
        title: '2. Tone Context',
        description: 'Specify the desired tone and style'
    },
    {
        id: 'backgroundData',
        title: '3. Background Data & Documents',
        description: 'Provide relevant context, data, or reference materials'
    },
    {
        id: 'detailedTaskDescription',
        title: '4. Detailed Task Description & Rules',
        description: 'Comprehensive instructions and constraints'
    },
    {
        id: 'examples',
        title: '5. Examples',
        description: 'Provide examples of desired output or structure'
    },
    {
        id: 'conversationHistory',
        title: '6. Conversation History',
        description: "Previous context or conversation that's relevant"
    },
    {
        id: 'immediateTask',
        title: '7. Immediate Task Description',
        description: 'The specific current request'
    },
    {
        id: 'thinkingSteps',
        title: '8. Thinking Steps',
        description: "Guide the AI's reasoning process"
    },
    {
        id: 'outputFormatting',
        title: '9. Output Formatting',
        description: 'Specify how the output should be structured'
    },
    {
        id: 'prefilledResponse',
        title: '10. Prefilled Response',
        description: "Optional: Start the AI's response"
    }
];

export default function SharedPrompt({ loaderData }: Route.ComponentProps) {
    const { prompt } = loaderData;
    const [copied, setCopied] = useState(false);

    const generateFullPrompt = () => {
        return promptSections
            .map((section) => {
                const content = prompt[
                    section.id as keyof typeof prompt
                ] as string;
                return content ? content : '';
            })
            .filter(Boolean)
            .join('\n\n');
    };

    const copyToClipboard = () => {
        const fullPrompt = generateFullPrompt();
        navigator.clipboard.writeText(fullPrompt).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="bg-white shadow rounded-lg mb-8 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                                {prompt.title}
                            </h1>
                            {prompt.description && (
                                <p className="text-zinc-600 mb-4">
                                    {prompt.description}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {prompt.categories.map((pc) => (
                                    <span
                                        key={pc.category.id}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                                        style={{
                                            backgroundColor: `${pc.category.color || '#6B7280'}20`,
                                            color:
                                                pc.category.color || '#6B7280'
                                        }}
                                    >
                                        {pc.category.name}
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm text-zinc-500">
                                Shared by{' '}
                                {prompt.user.name || prompt.user.email} •
                                Created{' '}
                                {new Date(
                                    prompt.createdAt
                                ).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Button
                                onClick={copyToClipboard}
                                className="shadow-sm"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Prompt
                                    </>
                                )}
                            </Button>

                            <a
                                href="/"
                                className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50"
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Home
                            </a>
                        </div>
                    </div>
                </div>

                {/* Prompt Content */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 mb-6">
                        Complete Prompt
                    </h2>

                    <div className="bg-zinc-900 text-green-400 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                        {generateFullPrompt()}
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Button
                            onClick={copyToClipboard}
                            size="lg"
                            className="shadow-sm"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-5 w-5 mr-2" />
                                    Copied to Clipboard!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-5 w-5 mr-2" />
                                    Copy to Clipboard
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-zinc-500">
                    <p>
                        Want to create your own prompt library?{' '}
                        <a
                            href="/"
                            className="text-primary-600 hover:text-primary-500"
                        >
                            Get started here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
