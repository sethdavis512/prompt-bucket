import { useState, useEffect } from 'react';
import {
    Link,
    useOutletContext,
    useFetcher,
    useNavigate
} from 'react-router';
import { ArrowLeft, Check, X } from 'lucide-react';
import { requireAuth } from '~/lib/session';
import { getPromptByUserIdAndId, updatePrompt } from '~/models/prompt.server';
import { getCategoriesForPromptsByUserId } from '~/models/category.server';
import TextField from '~/components/TextField';
import TextArea from '~/components/TextArea';
import PromptPreview from '~/components/PromptPreview';
import CategoryManager from '~/components/CategoryManager';
import Button from '~/components/Button';
import FieldScoring from '~/components/FieldScoring';
import { usePromptScoring } from '~/hooks/usePromptScoring';
import { usePromptAPI } from '~/hooks/usePromptAPI';
import type { Route } from './+types/edit';

export async function loader({ request, params }: Route.LoaderArgs) {
    const { user, isProUser } = await requireAuth(request);
    const promptId = params.id;

    if (!promptId) {
        throw new Response('Prompt not found', { status: 404 });
    }

    const prompt = await getPromptByUserIdAndId(user.id, promptId);

    if (!prompt) {
        throw new Response('Prompt not found', { status: 404 });
    }

    // Get all available categories for the user
    const allCategories = await getCategoriesForPromptsByUserId(user.id);

    return { prompt, allCategories };
}

export async function action({ request, params }: Route.ActionArgs) {
    const { user } = await requireAuth(request);
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
            const updatedPrompt = await updatePrompt(user.id, promptId, {
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
                categoryIds
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
    const { isProUser } = useOutletContext<{ user: any; isProUser: boolean }>();

    // Scoring hooks
    const { scores, suggestions, totalScore, updateFieldScore } = usePromptScoring();

    const {
        scoringField,
        generatingField,
        scoreField,
        generateField,
        canGenerate
    } = usePromptAPI({
        isProUser,
        promptValues: { ...editedPrompt, public: editedPrompt.public.toString() },
        onScoreUpdate: updateFieldScore,
        onContentGenerated: (fieldType: string, content: string) => {
            updateEditedValue(fieldType, content);
        }
    });

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

    const handleFieldBlur = (fieldType: string, content: string) => {
        if (content.trim() && isProUser) {
            scoreField(fieldType, content);
        }
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
                            {isProUser && totalScore > 0 && (
                                <div className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-md">
                                    <span className="text-sm font-medium text-purple-700">
                                        Total Score: {totalScore}/100
                                    </span>
                                </div>
                            )}
                            <Button
                                as="link"
                                to={`/prompts/${prompt.id}`}
                                variant="secondary"
                                size="sm"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={updateFetcher.state !== 'idle'}
                                loading={updateFetcher.state === 'submitting'}
                                size="sm"
                            >
                                <Check className="w-4 h-4 mr-1" />
                                {updateFetcher.state === 'submitting' ? 'Saving...' : 'Save Changes'}
                            </Button>
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
                                <div>
                                    <FieldScoring
                                        fieldType="title"
                                        label="Title"
                                        score={scores.title}
                                        suggestion={suggestions.title}
                                        isProUser={isProUser}
                                        isLoading={scoringField === 'title'}
                                    />
                                    <TextField
                                        required
                                        value={editedPrompt.title}
                                        onChange={(e) => updateEditedValue('title', e.target.value)}
                                        onBlur={(e) => handleFieldBlur('title', e.target.value)}
                                        placeholder="Give your prompt a descriptive title"
                                    />
                                    {suggestions.title && isProUser && (
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <p className="text-xs font-medium text-blue-800 mb-1">AI Suggestion:</p>
                                            <p className="text-xs text-blue-700">{suggestions.title}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <FieldScoring
                                        fieldType="description"
                                        label="Description"
                                        score={scores.description}
                                        suggestion={suggestions.description}
                                        isProUser={isProUser}
                                        isLoading={scoringField === 'description'}
                                    />
                                    <TextArea
                                        value={editedPrompt.description}
                                        onChange={(e) => updateEditedValue('description', e.target.value)}
                                        onBlur={(e) => handleFieldBlur('description', e.target.value)}
                                        placeholder="Describe what this prompt does and when to use it"
                                        rows={3}
                                    />
                                    {suggestions.description && isProUser && (
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <p className="text-xs font-medium text-blue-800 mb-1">AI Suggestion:</p>
                                            <p className="text-xs text-blue-700">{suggestions.description}</p>
                                        </div>
                                    )}
                                </div>

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
                                        <FieldScoring
                                            fieldType={section.id}
                                            label={section.title}
                                            score={scores[section.id]}
                                            suggestion={suggestions[section.id]}
                                            isProUser={isProUser}
                                            isLoading={scoringField === section.id}
                                        />

                                        <p className="text-xs text-gray-500 mt-2 mb-3">
                                            {section.description}
                                        </p>

                                        <TextArea
                                            value={content}
                                            onChange={(e) => updateEditedValue(section.id, e.target.value)}
                                            onBlur={(e) => handleFieldBlur(section.id, e.target.value)}
                                            placeholder={`Enter ${section.title.toLowerCase()}...`}
                                            rows={4}
                                        />

                                        {suggestions[section.id] && isProUser && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                <p className="text-xs font-medium text-blue-800 mb-1">AI Suggestion:</p>
                                                <p className="text-xs text-blue-700">{suggestions[section.id]}</p>
                                            </div>
                                        )}

                                        {isProUser && canGenerate(section.id) && (
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => generateField(section.id)}
                                                    disabled={generatingField === section.id}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                                                >
                                                    {generatingField === section.id ? 'Generating...' : 'Generate with AI'}
                                                </button>
                                            </div>
                                        )}
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