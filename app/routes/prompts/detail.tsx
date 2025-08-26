import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Edit, Copy, Share2, ArrowLeft } from 'lucide-react';
import { requireAuth } from '~/lib/session';
import { getPromptByUserIdAndId } from '~/models/prompt.server';
import PromptPreview from '~/components/PromptPreview';
import type { Route } from './+types/detail';

export async function loader({ request, params }: Route.LoaderArgs) {
    const { user } = await requireAuth(request);
    const promptId = params.id;

    if (!promptId) {
        throw new Response('Prompt not found', { status: 404 });
    }

    const prompt = await getPromptByUserIdAndId(user.id, promptId);

    if (!prompt) {
        throw new Response('Prompt not found', { status: 404 });
    }

    return { prompt };
}

export default function PromptDetail({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: any }>();
    const { prompt } = loaderData;
    const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

    // Pro status from auth layout context
    const isProUser = user?.subscription?.status === 'active';

    const promptSections = [
        {
            id: 'taskContext',
            title: 'Task Context',
            description: 'Define the AI\'s role and expertise area'
        },
        {
            id: 'toneContext', 
            title: 'Tone Context',
            description: 'Specify the desired tone and style'
        },
        {
            id: 'backgroundData',
            title: 'Background Data', 
            description: 'Provide relevant context and information'
        },
        {
            id: 'detailedTaskDescription',
            title: 'Detailed Task Description',
            description: 'Comprehensive task explanation'
        },
        {
            id: 'examples',
            title: 'Examples',
            description: 'Provide examples of desired responses'
        },
        {
            id: 'conversationHistory',
            title: 'Conversation History',
            description: 'Previous conversation context'
        },
        {
            id: 'immediateTask',
            title: 'Immediate Task',
            description: 'Current specific task'
        },
        {
            id: 'thinkingSteps',
            title: 'Thinking Steps',
            description: 'Step-by-step reasoning process'
        },
        {
            id: 'outputFormatting',
            title: 'Output Formatting',
            description: 'Desired output structure and format'
        },
        {
            id: 'prefilledResponse',
            title: 'Prefilled Response',
            description: 'Starting point for the response'
        }
    ];

    const copyToClipboard = (text: string, section: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(prev => ({ ...prev, [section]: true }));
        setTimeout(() => {
            setCopyStatus(prev => ({ ...prev, [section]: false }));
        }, 2000);
    };

    const handleShare = async () => {
        if (navigator.share && isProUser && prompt.public) {
            try {
                await navigator.share({
                    title: prompt.title,
                    text: prompt.description || undefined,
                    url: `${window.location.origin}/share/${prompt.id}`
                });
            } catch (err) {
                // Fallback to copying URL
                copyToClipboard(`${window.location.origin}/share/${prompt.id}`, 'share');
            }
        } else {
            // Copy share URL to clipboard
            const shareUrl = isProUser && prompt.public
                ? `${window.location.origin}/share/${prompt.id}`
                : window.location.href;
            copyToClipboard(shareUrl, 'share');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/prompts"
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Prompts
                            </Link>
                            <h1 className="text-lg font-medium text-gray-900 truncate max-w-md">
                                {prompt.title}
                            </h1>
                            {prompt.categories?.length > 0 && (
                                <div className="flex space-x-1">
                                    {prompt.categories.map((pc: any) => (
                                        <span
                                            key={pc.category.id}
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                        >
                                            {pc.category.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleShare}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Share2 className="w-4 h-4 mr-1" />
                                {copyStatus.share ? 'Copied!' : 'Share'}
                            </button>
                            <Link
                                to={`/prompts/${prompt.id}/edit`}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Prompt Details */}
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{prompt.title}</h3>
                                    {prompt.description && (
                                        <p className="mt-2 text-sm text-gray-600">{prompt.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                prompt.public
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {prompt.public ? 'Public' : 'Private'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Created {new Date(prompt.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prompt Sections */}
                        <div className="space-y-4">
                            {promptSections.map((section) => {
                                const content = prompt[section.id as keyof typeof prompt] as string;
                                if (!content) return null;

                                return (
                                    <div key={section.id} className="bg-white shadow rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {section.title}
                                            </h4>
                                            <button
                                                onClick={() => copyToClipboard(content, section.id)}
                                                className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                {copyStatus[section.id] ? (
                                                    <>Copied!</>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3 mr-1" />
                                                        Copy
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="prose prose-sm max-w-none">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="lg:sticky lg:top-24 lg:h-fit">
                        <PromptPreview
                            title="Complete Prompt Preview"
                            content={[
                                prompt.taskContext,
                                prompt.toneContext,
                                prompt.backgroundData,
                                prompt.detailedTaskDescription,
                                prompt.examples,
                                prompt.conversationHistory,
                                prompt.immediateTask,
                                prompt.thinkingSteps,
                                prompt.outputFormatting,
                                prompt.prefilledResponse
                            ].filter(Boolean).join('\n\n')}
                            isProUser={isProUser}
                            onCopy={(text) => copyToClipboard(text, 'complete')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}