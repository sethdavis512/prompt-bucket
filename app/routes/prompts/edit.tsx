import { useState, useEffect } from 'react';
import {
    Link,
    useOutletContext,
    useFetcher,
    useNavigate
} from 'react-router';
import { ArrowLeft, Check, X } from 'lucide-react';
import { prisma } from '~/lib/prisma';
import { auth } from '~/lib/auth';
import TextField from '~/components/TextField';
import TextArea from '~/components/TextArea';
import PromptPreview from '~/components/PromptPreview';
import CategoryManager from '~/components/CategoryManager';
import type { Route } from './+types/edit';

export async function loader({ request, params }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    const promptId = params.id;

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
            userId: session!.user.id
        },
        include: {
            _count: {
                select: { prompts: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return { prompt, allCategories };
}

export async function action({ request, params }: Route.ActionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    const promptId = params.id!;
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    if (intent === 'update') {
        // Handle prompt update
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const isPublic = formData.get('public') === 'true';
        const taskContext = formData.get('taskContext') as string;
        const toneContext = formData.get('toneContext') as string;
        const backgroundData = formData.get('backgroundData') as string;
        const detailedTaskDescription = formData.get('detailedTaskDescription') as string;
        const examples = formData.get('examples') as string;
        const conversationHistory = formData.get('conversationHistory') as string;
        const immediateTask = formData.get('immediateTask') as string;
        const thinkingSteps = formData.get('thinkingSteps') as string;
        const outputFormatting = formData.get('outputFormatting') as string;
        const prefilledResponse = formData.get('prefilledResponse') as string;
        const categoryIds = formData.getAll('categoryIds') as string[];

        try {
            // Update the prompt
            const updatedPrompt = await prisma.prompt.update({
                where: {
                    id: promptId,
                    userId: session!.user.id
                },
                data: {
                    title,
                    description,
                    public: isPublic,
                    taskContext,
                    toneContext,
                    backgroundData,
                    detailedTaskDescription,
                    examples,
                    conversationHistory,
                    immediateTask,
                    thinkingSteps,
                    outputFormatting,
                    prefilledResponse,
                    updatedAt: new Date(),
                    categories: {
                        deleteMany: {},
                        create: categoryIds.map(categoryId => ({
                            category: { connect: { id: categoryId } }
                        }))
                    }
                }
            });

            return { success: true, prompt: updatedPrompt };
        } catch (error) {
            console.error('Failed to update prompt:', error);
            return { success: false, error: 'Failed to update prompt' };
        }
    }

    return { success: false, error: 'Invalid intent' };
}

export default function EditPrompt({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: any }>();
    const { prompt, allCategories } = loaderData;
    const navigate = useNavigate();
    const updateFetcher = useFetcher();
    
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        prompt?.categories?.map((pc: any) => pc.category.id) || []
    );

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

    const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

    // Pro status from auth layout context
    const isProUser = user?.subscription?.status === 'active';

    // TODO: Add scoring hooks when available

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

    const updateEditedValue = (field: string, value: string | boolean) => {
        setEditedPrompt(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const copyToClipboard = (text: string, section: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(prev => ({ ...prev, [section]: true }));
        setTimeout(() => {
            setCopyStatus(prev => ({ ...prev, [section]: false }));
        }, 2000);
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append('intent', 'update');
        formData.append('title', editedPrompt.title);
        formData.append('description', editedPrompt.description);
        formData.append('public', editedPrompt.public.toString());
        formData.append('taskContext', editedPrompt.taskContext);
        formData.append('toneContext', editedPrompt.toneContext);
        formData.append('backgroundData', editedPrompt.backgroundData);
        formData.append('detailedTaskDescription', editedPrompt.detailedTaskDescription);
        formData.append('examples', editedPrompt.examples);
        formData.append('conversationHistory', editedPrompt.conversationHistory);
        formData.append('immediateTask', editedPrompt.immediateTask);
        formData.append('thinkingSteps', editedPrompt.thinkingSteps);
        formData.append('outputFormatting', editedPrompt.outputFormatting);
        formData.append('prefilledResponse', editedPrompt.prefilledResponse);
        
        selectedCategories.forEach(categoryId => {
            formData.append('categoryIds', categoryId);
        });

        updateFetcher.submit(formData, { method: 'post' });
    };

    // Redirect after successful save
    useEffect(() => {
        if (updateFetcher.data?.success) {
            navigate(`/prompts/${prompt.id}`);
        }
    }, [updateFetcher.data, navigate, prompt.id]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Link
                                to={`/prompts/${prompt.id}`}
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Prompt
                            </Link>
                            <h1 className="text-lg font-medium text-gray-900">
                                Edit Prompt
                            </h1>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Link
                                to={`/prompts/${prompt.id}`}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Link>
                            <button
                                onClick={handleSave}
                                disabled={updateFetcher.state !== 'idle'}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4 mr-1" />
                                {updateFetcher.state === 'submitting' ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Edit Form */}
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="space-y-4">
                                <TextField
                                    label="Title"
                                    required
                                    value={editedPrompt.title}
                                    onChange={(e) => updateEditedValue('title', e.target.value)}
                                    placeholder="Give your prompt a descriptive title"
                                />

                                <TextArea
                                    label="Description"
                                    value={editedPrompt.description}
                                    onChange={(e) => updateEditedValue('description', e.target.value)}
                                    placeholder="Describe what this prompt does and when to use it"
                                    rows={3}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Visibility
                                    </label>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <input
                                                id="visibility-private"
                                                type="radio"
                                                name="visibility"
                                                value="false"
                                                checked={!editedPrompt.public}
                                                onChange={(e) => updateEditedValue('public', false)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                            />
                                            <label htmlFor="visibility-private" className="ml-3 block text-sm font-medium text-gray-700">
                                                Private
                                            </label>
                                        </div>
                                        {isProUser ? (
                                            <div className="flex items-center">
                                                <input
                                                    id="visibility-public"
                                                    type="radio"
                                                    name="visibility"
                                                    value="true"
                                                    checked={editedPrompt.public}
                                                    onChange={(e) => updateEditedValue('public', true)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                />
                                                <label htmlFor="visibility-public" className="ml-3 block text-sm font-medium text-gray-700">
                                                    Public
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex items-center opacity-50">
                                                <input
                                                    type="radio"
                                                    disabled
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                />
                                                <label className="ml-3 block text-sm font-medium text-gray-500">
                                                    Public (Pro only)
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {!editedPrompt.public
                                            ? 'This prompt is only visible to you'
                                            : 'This prompt can be shared publicly'
                                        }
                                    </p>
                                </div>

                                <CategoryManager
                                    categories={allCategories}
                                    selectedCategories={selectedCategories}
                                    onCategoryToggle={handleCategoryToggle}
                                    isProUser={isProUser}
                                />
                            </div>
                        </div>

                        {/* Prompt Sections */}
                        <div className="space-y-4">
                            {promptSections.map((section) => {
                                const content = editedPrompt[section.id as keyof typeof editedPrompt] as string;

                                return (
                                    <div key={section.id} className="bg-white shadow rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {section.title}
                                            </h4>
                                        </div>

                                        <p className="text-xs text-gray-500 mb-3">
                                            {section.description}
                                        </p>

                                        <TextArea
                                            value={content}
                                            onChange={(e) => updateEditedValue(section.id, e.target.value)}
                                            placeholder={`Enter ${section.title.toLowerCase()}...`}
                                            rows={4}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="lg:sticky lg:top-24 lg:h-fit">
                        <PromptPreview
                            title="Live Prompt Preview"
                            content={[
                                editedPrompt.taskContext,
                                editedPrompt.toneContext,
                                editedPrompt.backgroundData,
                                editedPrompt.detailedTaskDescription,
                                editedPrompt.examples,
                                editedPrompt.conversationHistory,
                                editedPrompt.immediateTask,
                                editedPrompt.thinkingSteps,
                                editedPrompt.outputFormatting,
                                editedPrompt.prefilledResponse
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