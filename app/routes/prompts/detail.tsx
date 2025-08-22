import { useState, useEffect } from 'react';
import {
    Link,
    useOutletContext,
    useFetcher,
    useRevalidator,
    useNavigate,
    useLocation
} from 'react-router';
import { Edit, Copy, Download, ArrowLeft, Check, Share2 } from 'lucide-react';
import { prisma } from '~/lib/prisma';
import { auth } from '~/lib/auth';
import Layout from '~/components/Layout';
import TextField from '~/components/TextField';
import TextArea from '~/components/TextArea';
import PromptPreview from '~/components/PromptPreview';
import FieldScoring from '~/components/FieldScoring';
import CategoryManager from '~/components/CategoryManager';
import { usePromptScoring } from '~/hooks/usePromptScoring';
import { usePromptAPI } from '~/hooks/usePromptAPI';
import type { Route } from './+types/detail';

export async function loader({ request, params }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    const promptId = params.id;
    const url = new URL(request.url);
    const shouldEdit = url.searchParams.get('edit') === 'true';

    if (!promptId) {
        throw new Response('Prompt not found', { status: 404 });
    }

    const prompt = await prisma.prompt.findUnique({
        where: {
            id: promptId,
            userId: session!.user.id // Ensure user owns the prompt
        },
        include: {
            categories: {
                include: {
                    category: true
                }
            }
        }
    });

    if (!prompt) {
        throw new Response('Prompt not found', { status: 404 });
    }

    // Get all available categories for the user
    const allCategories = await prisma.category.findMany({
        where: {
            userId: session!.user.id // Only user's own categories
        },
        include: {
            _count: {
                select: {
                    prompts: {
                        where: {
                            prompt: {
                                userId: session!.user.id
                            }
                        }
                    }
                }
            }
        },
        orderBy: [
            { userId: 'asc' }, // System categories first (null userId)
            { name: 'asc' }
        ]
    });

    return { prompt, allCategories, shouldEdit };
}

export async function action({ request, params }: Route.ActionArgs) {
    const { auth } = await import('~/lib/auth');
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return { error: 'Authentication required' };
    }

    const formData = await request.formData();
    const promptId = params.id;

    if (!promptId) {
        return { error: 'Prompt ID required' };
    }

    // Verify user owns this prompt
    const existingPrompt = await prisma.prompt.findUnique({
        where: {
            id: promptId,
            userId: session.user.id // Ensure user owns the prompt
        }
    });

    if (!existingPrompt) {
        return {
            error: "Prompt not found or you don't have permission to edit it"
        };
    }

    // Get user subscription status for Pro feature validation
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionStatus: true }
    });

    const isProUser = user?.subscriptionStatus === 'active';
    const requestedPublic = formData.get('public') === 'true';

    // Validate Pro features: prevent free users from making prompts public
    if (requestedPublic && !isProUser) {
        return {
            error: 'Public sharing is a Pro feature. Upgrade your subscription to share prompts publicly.'
        };
    }

    const data = {
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || '',
        public: isProUser ? requestedPublic : false, // Force false for free users
        taskContext: (formData.get('taskContext') as string) || '',
        toneContext: (formData.get('toneContext') as string) || '',
        backgroundData: (formData.get('backgroundData') as string) || '',
        detailedTaskDescription:
            (formData.get('detailedTaskDescription') as string) || '',
        examples: (formData.get('examples') as string) || '',
        conversationHistory:
            (formData.get('conversationHistory') as string) || '',
        immediateTask: (formData.get('immediateTask') as string) || '',
        thinkingSteps: (formData.get('thinkingSteps') as string) || '',
        outputFormatting: (formData.get('outputFormatting') as string) || '',
        prefilledResponse: (formData.get('prefilledResponse') as string) || '',
        categoryIds: formData.getAll('categoryIds') as string[]
    };

    console.log('Updating prompt with data:', {
        promptId,
        userId: session.user.id,
        title: data.title
    });

    try {
        // Use a transaction to update prompt and categories atomically
        const updatedPrompt = await prisma.$transaction(async (tx) => {
            // Update the prompt
            const prompt = await tx.prompt.update({
                where: {
                    id: promptId,
                    userId: session.user.id // Double-check user ownership
                },
                data: {
                    title: data.title,
                    description: data.description,
                    public: data.public,
                    taskContext: data.taskContext,
                    toneContext: data.toneContext,
                    backgroundData: data.backgroundData,
                    detailedTaskDescription: data.detailedTaskDescription,
                    examples: data.examples,
                    conversationHistory: data.conversationHistory,
                    immediateTask: data.immediateTask,
                    thinkingSteps: data.thinkingSteps,
                    outputFormatting: data.outputFormatting,
                    prefilledResponse: data.prefilledResponse,
                    updatedAt: new Date()
                }
            });

            // Update categories: first delete all existing associations
            await tx.promptCategory.deleteMany({
                where: { promptId: promptId }
            });

            // Then create new associations
            if (data.categoryIds.length > 0) {
                await tx.promptCategory.createMany({
                    data: data.categoryIds.map((categoryId) => ({
                        promptId: promptId,
                        categoryId: categoryId
                    }))
                });
            }

            // Return the updated prompt with categories
            return await tx.prompt.findUnique({
                where: { id: promptId },
                include: {
                    categories: {
                        include: {
                            category: true
                        }
                    }
                }
            });
        });

        return { success: true, prompt: updatedPrompt };
    } catch (error) {
        console.error('Error updating prompt:', error);
        return {
            error: `Failed to update prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
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

export default function PromptDetail({ loaderData }: Route.ComponentProps) {
    const { user, isProUser } = useOutletContext<{ user: any, isProUser: boolean }>();
    const fetcher = useFetcher();
    const revalidator = useRevalidator();
    const navigate = useNavigate();

    // Use real prompt data from the loader
    const [prompt, setPrompt] = useState(loaderData.prompt);
    const { allCategories } = loaderData;
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [copiedFull, setCopiedFull] = useState(false);
    const [isEditing, setIsEditing] = useState(loaderData.shouldEdit || false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        prompt?.categories?.map((pc: any) => pc.category.id) || []
    );
    
    // Pro status now comes from auth layout context

    // If no prompt data, show loading or error
    if (!prompt) {
        return (
            <Layout user={user}>
                <div className="px-4 py-6 sm:px-0">
                    <div className="text-center">
                        <p className="text-gray-500">Loading prompt...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // State for edited values - initialize with real prompt data
    const [editedPrompt, setEditedPrompt] = useState({
        title: prompt?.title || '',
        description: prompt?.description || '',
        public: prompt?.public || false,
        taskContext: prompt?.taskContext || '',
        toneContext: prompt?.toneContext || '',
        backgroundData: prompt?.backgroundData || '',
        detailedTaskDescription: prompt?.detailedTaskDescription || '',
        examples: prompt?.examples || '',
        conversationHistory: prompt?.conversationHistory || '',
        immediateTask: prompt?.immediateTask || '',
        thinkingSteps: prompt?.thinkingSteps || '',
        outputFormatting: prompt?.outputFormatting || '',
        prefilledResponse: prompt?.prefilledResponse || ''
    });

    // Handle fetcher response
    useEffect(() => {
        if (fetcher.data) {
            if (fetcher.data.success && fetcher.data.prompt) {
                // Successfully saved - update prompt data and exit edit mode
                setPrompt(fetcher.data.prompt);
                setIsEditing(false);
                // Revalidate the auth-layout data to ensure fresh data on refresh
                revalidator.revalidate();
                console.log('Prompt saved successfully!');
            } else if (fetcher.data.error) {
                // Show error message
                console.error('Save failed:', fetcher.data.error);
                // Could add a toast notification here
            }
        }
    }, [fetcher.data, revalidator]);

    // Update editedPrompt when prompt data changes
    useEffect(() => {
        if (prompt) {
            setEditedPrompt({
                title: prompt.title || '',
                description: prompt.description || '',
                public: prompt.public || false,
                taskContext: prompt.taskContext || '',
                toneContext: prompt.toneContext || '',
                backgroundData: prompt.backgroundData || '',
                detailedTaskDescription: prompt.detailedTaskDescription || '',
                examples: prompt.examples || '',
                conversationHistory: prompt.conversationHistory || '',
                immediateTask: prompt.immediateTask || '',
                thinkingSteps: prompt.thinkingSteps || '',
                outputFormatting: prompt.outputFormatting || '',
                prefilledResponse: prompt.prefilledResponse || ''
            });
            setSelectedCategories(
                prompt.categories?.map((pc: any) => pc.category.id) || []
            );
        }
    }, [prompt]);

    const copyToClipboard = (text: string, sectionId?: string) => {
        navigator.clipboard.writeText(text).then(() => {
            if (sectionId) {
                setCopiedSection(sectionId);
                setTimeout(() => setCopiedSection(null), 2000);
            } else {
                setCopiedFull(true);
                setTimeout(() => setCopiedFull(false), 2000);
            }
        });
    };

    const generatePromptPreview = () => {
        const currentPrompt = isEditing ? editedPrompt : prompt;
        return promptSections
            .map((section) => {
                const content = currentPrompt[
                    section.id as keyof typeof currentPrompt
                ] as string;
                return content ? content : '';
            })
            .filter(Boolean)
            .join('\n\n');
    };

    const updateEditedValue = (field: string, value: string | boolean) => {
        setEditedPrompt((prev) => ({
            ...prev,
            [field]: field === 'public' ? value === 'true' : value
        }));
    };

    // Generate contextual hints based on existing content
    const getContextualHint = (fieldType: string): string => {
        const taskContext = promptValues.taskContext?.toLowerCase() || '';
        const title = promptValues.title?.toLowerCase() || '';
        
        // Extract key themes from task context and title
        const isMarketing = taskContext.includes('marketing') || title.includes('marketing');
        const isSoftware = taskContext.includes('software') || taskContext.includes('saas') || taskContext.includes('tech');
        const isWriting = taskContext.includes('writer') || taskContext.includes('content') || title.includes('writer');
        const isStrategy = taskContext.includes('strategy') || taskContext.includes('strategist');
        
        // Generate hints based on field type and context
        switch (fieldType) {
            case 'toneContext':
                if (isMarketing && isSoftware) return "Define marketing tone";
                if (isWriting) return "Set writing style";
                if (isStrategy) return "Choose strategic voice";
                return "Specify desired tone";
                
            case 'backgroundData':
                if (isMarketing && isSoftware) return "Add market context";
                if (isSoftware) return "Include tech background";
                if (isMarketing) return "Provide market data";
                return "Share relevant context";
                
            case 'detailedTaskDescription':
                if (isMarketing) return "Detail marketing goals";
                if (isSoftware) return "Outline tech requirements";
                if (isWriting) return "Specify content needs";
                return "Provide context or details";
                
            case 'examples':
                if (isMarketing) return "Show campaign examples";
                if (isSoftware) return "Include product examples";
                if (isWriting) return "Add writing samples";
                return "Provide examples";
                
            case 'immediateTask':
                if (isMarketing) return "State marketing request";
                if (isSoftware) return "Define current need";
                return "Describe specific task";
                
            case 'outputFormatting':
                if (isMarketing) return "Set content format";
                if (isWriting) return "Choose output style";
                return "Specify format needs";
                
            default:
                return "AI will rate this";
        }
    };
    
    // Create a filtered version of editedPrompt for the API hook (only string fields)
    const promptValues = {
        title: editedPrompt.title,
        description: editedPrompt.description,
        taskContext: editedPrompt.taskContext,
        toneContext: editedPrompt.toneContext,
        backgroundData: editedPrompt.backgroundData,
        detailedTaskDescription: editedPrompt.detailedTaskDescription,
        examples: editedPrompt.examples,
        conversationHistory: editedPrompt.conversationHistory,
        immediateTask: editedPrompt.immediateTask,
        thinkingSteps: editedPrompt.thinkingSteps,
        outputFormatting: editedPrompt.outputFormatting,
        prefilledResponse: editedPrompt.prefilledResponse
    };
    
    // Use custom hooks for scoring and API management
    const {
        scores,
        suggestions,
        totalScore,
        updateFieldScore
    } = usePromptScoring();
    
    const {
        scoringField,
        generatingField,
        scoreField,
        generateField,
        canGenerate
    } = usePromptAPI({
        isProUser,
        promptValues,
        onScoreUpdate: updateFieldScore,
        onContentGenerated: updateEditedValue
    });

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleSave = () => {
        // Create form data
        const formData = new FormData();
        formData.append('title', editedPrompt.title);
        formData.append('description', editedPrompt.description);
        formData.append('public', editedPrompt.public.toString());
        formData.append('taskContext', editedPrompt.taskContext);
        formData.append('toneContext', editedPrompt.toneContext);
        formData.append('backgroundData', editedPrompt.backgroundData);
        formData.append(
            'detailedTaskDescription',
            editedPrompt.detailedTaskDescription
        );
        formData.append('examples', editedPrompt.examples);
        formData.append(
            'conversationHistory',
            editedPrompt.conversationHistory
        );
        formData.append('immediateTask', editedPrompt.immediateTask);
        formData.append('thinkingSteps', editedPrompt.thinkingSteps);
        formData.append('outputFormatting', editedPrompt.outputFormatting);
        formData.append('prefilledResponse', editedPrompt.prefilledResponse);

        // Add selected categories
        selectedCategories.forEach((categoryId) => {
            formData.append('categoryIds', categoryId);
        });

        // Submit the form
        fetcher.submit(formData, { method: 'POST' });
    };

    const handleCancel = () => {
        // Reset edited values to current prompt data
        if (prompt) {
            setEditedPrompt({
                title: prompt.title || '',
                description: prompt.description || '',
                public: prompt.public || false,
                taskContext: prompt.taskContext || '',
                toneContext: prompt.toneContext || '',
                backgroundData: prompt.backgroundData || '',
                detailedTaskDescription: prompt.detailedTaskDescription || '',
                examples: prompt.examples || '',
                conversationHistory: prompt.conversationHistory || '',
                immediateTask: prompt.immediateTask || '',
                thinkingSteps: prompt.thinkingSteps || '',
                outputFormatting: prompt.outputFormatting || '',
                prefilledResponse: prompt.prefilledResponse || ''
            });
            // Reset selected categories to current prompt's categories
            setSelectedCategories(
                prompt.categories?.map((pc: any) => pc.category.id) || []
            );
        }
        setIsEditing(false);
        
        // Clean up URL by removing edit parameter using React Router navigation
        navigate(`/prompts/${prompt.id}`, { replace: true });
    };

    const buildFullPrompt = () => {
        return generatePromptPreview();
    };

    const exportPrompt = () => {
        const fullPrompt = buildFullPrompt();
        const blob = new Blob([fullPrompt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Layout user={user}>
            <div className="px-4 py-6 sm:px-0">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-start justify-between">
                        <div>
                            {isEditing ? (
                                <div className="space-y-4 mb-4">
                                    <TextField
                                        label="Title"
                                        required
                                        value={editedPrompt.title}
                                        onChange={(e) =>
                                            updateEditedValue(
                                                'title',
                                                e.target.value
                                            )
                                        }
                                        inputClassName="text-2xl font-bold"
                                        placeholder="Enter prompt title..."
                                        size="lg"
                                    />
                                    <TextField
                                        label="Description"
                                        value={editedPrompt.description}
                                        onChange={(e) =>
                                            updateEditedValue(
                                                'description',
                                                e.target.value
                                            )
                                        }
                                        inputClassName="text-gray-600"
                                        placeholder="Brief description of what this prompt does..."
                                    />
                                    {isProUser ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Visibility
                                            </label>
                                            <div className="flex items-center space-x-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        checked={
                                                            !editedPrompt.public
                                                        }
                                                        onChange={() =>
                                                            updateEditedValue(
                                                                'public',
                                                                'false'
                                                            )
                                                        }
                                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Private
                                                    </span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        checked={
                                                            editedPrompt.public
                                                        }
                                                        onChange={() =>
                                                            updateEditedValue(
                                                                'public',
                                                                'true'
                                                            )
                                                        }
                                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Public
                                                    </span>
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {editedPrompt.public
                                                    ? 'This prompt can be shared publicly via: /share/' +
                                                      prompt.id
                                                    : 'This prompt is only visible to you'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Visibility
                                            </label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="public"
                                                        value="false"
                                                        checked={true}
                                                        disabled
                                                        className="h-4 w-4 text-gray-400 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Private
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        (Free users)
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Public sharing is available with Pro. 
                                                    <a href="/pricing" className="text-blue-600 hover:text-blue-500 ml-1">
                                                        Upgrade to share prompts →
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Categories Section */}
                                    <CategoryManager
                                        categories={allCategories}
                                        selectedCategories={selectedCategories}
                                        onCategoryToggle={toggleCategory}
                                        isProUser={isProUser}
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                        {prompt.title}
                                    </h1>
                                    {prompt.description && (
                                        <p className="text-gray-600 mb-4">
                                            {prompt.description}
                                        </p>
                                    )}
                                </>
                            )}

                            <div className="flex flex-wrap gap-2 mb-4">
                                {prompt.categories?.map((pc: any) => (
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
                                )) || []}
                            </div>

                            <p className="text-sm text-gray-500">
                                Created{' '}
                                {new Date(
                                    prompt.createdAt
                                ).toLocaleDateString()}{' '}
                                • Updated{' '}
                                {new Date(
                                    prompt.updatedAt
                                ).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={
                                            fetcher.state === 'submitting'
                                        }
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {fetcher.state === 'submitting' ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-1" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(buildFullPrompt())
                                        }
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        {copiedFull ? (
                                            <>
                                                <Check className="h-4 w-4 mr-1 text-green-500" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-1" />
                                                Copy All
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={exportPrompt}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <Download className="h-4 w-4 mr-1" />
                                        Export
                                    </button>

                                    {prompt.public && isProUser && (
                                        <button
                                            onClick={() => {
                                                // Use current location to build share URL
                                                const shareUrl = `${document.location.origin}/share/${prompt.id}`;
                                                navigator.clipboard.writeText(
                                                    shareUrl
                                                );
                                            }}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <Share2 className="h-4 w-4 mr-1" />
                                            Share
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid Layout - Same as New Prompt Page */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sections Column */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-6">
                                Prompt Structure
                            </h3>

                            <div className="space-y-6">
                                {promptSections.map((section) => {
                                    const currentPrompt = isEditing
                                        ? editedPrompt
                                        : prompt;
                                    const content = currentPrompt[
                                        section.id as keyof typeof currentPrompt
                                    ] as string;
                                    if (!content && !isEditing) return null;

                                    return (
                                        <div
                                            key={section.id}
                                            className="border border-gray-200 rounded-lg p-4"
                                        >
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        {isEditing ? (
                                                            <FieldScoring
                                                                fieldType={section.id}
                                                                label={section.title}
                                                                score={isProUser ? scores[section.id] : 0}
                                                                suggestion={isProUser ? suggestions[section.id] : undefined}
                                                                isProUser={isProUser}
                                                                isLoading={isProUser && scoringField === section.id}
                                                                onScoreUpdate={(score, suggestion) => 
                                                                    updateFieldScore(section.id, score, suggestion)
                                                                }
                                                                contextualHint={getContextualHint(section.id)}
                                                            />
                                                        ) : (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-900">
                                                                    {section.title}
                                                                </label>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {
                                                                        section.description
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Generate Button - Top Right (Edit mode only) */}
                                                    {isEditing && isProUser && (
                                                        <div className="ml-4">
                                                            {canGenerate(section.id) ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => generateField(section.id)}
                                                                    disabled={generatingField === section.id}
                                                                    className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                                        generatingField === section.id
                                                                            ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                    }`}
                                                                >
                                                                    {generatingField === section.id ? (
                                                                        <>
                                                                            <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                                                                            Generating...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            ✨ Generate
                                                                        </>
                                                                    )}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                    
                                                    {!isEditing && (
                                                        <button
                                                            onClick={() =>
                                                                copyToClipboard(
                                                                    content,
                                                                    section.id
                                                                )
                                                            }
                                                            className="text-gray-400 hover:text-gray-600 ml-2"
                                                        >
                                                            {copiedSection ===
                                                            section.id ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* Description and suggestions for edit mode */}
                                                {isEditing && (
                                                    <>
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            {section.description}
                                                        </p>
                                                        
                                                        {suggestions[section.id] && isProUser && (
                                                            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                                                💡 {suggestions[section.id]}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <>
                                                    <TextArea
                                                        value={content}
                                                        onChange={(e) =>
                                                            updateEditedValue(
                                                                section.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => 
                                                            scoreField(section.id, e.target.value)
                                                        }
                                                        rows={4}
                                                        placeholder={`Enter ${section.title.toLowerCase()}...`}
                                                        disabled={scoringField === section.id}
                                                    />
                                                    
                                                    {isProUser && scoringField === section.id && (
                                                        <div className="mt-2 flex items-center text-xs text-blue-600">
                                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                            AI is analyzing this field...
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="bg-gray-50 p-3 rounded-md border">
                                                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                                                        {content}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Live Preview Column */}
                    <div className="sticky top-6 self-start">
                        <PromptPreview 
                            title="Complete Prompt Preview"
                            content={generatePromptPreview()}
                            totalScore={totalScore}
                            isProUser={isProUser}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
