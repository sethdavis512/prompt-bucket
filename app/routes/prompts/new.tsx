import { useState } from 'react';
import { z } from 'zod';
import { useOutletContext, Form, redirect } from 'react-router';
import { prisma } from '~/lib/prisma';
import { auth } from '~/lib/auth';
import Layout from '~/components/Layout';
import TextField from '~/components/TextField';
import TextArea from '~/components/TextArea';
import type { Route } from './+types/new';

const createPromptSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    public: z.boolean().optional(),
    taskContext: z.string().optional(),
    toneContext: z.string().optional(),
    backgroundData: z.string().optional(),
    detailedTaskDescription: z.string().optional(),
    examples: z.string().optional(),
    conversationHistory: z.string().optional(),
    immediateTask: z.string().optional(),
    thinkingSteps: z.string().optional(),
    outputFormatting: z.string().optional(),
    prefilledResponse: z.string().optional(),
    categoryIds: z.array(z.string()).optional()
});

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    const categories = await prisma.category.findMany({
        include: {
            prompts: {
                where: {
                    prompt: {
                        userId: session!.user.id
                    }
                },
                include: {
                    prompt: {
                        select: {
                            id: true,
                            title: true,
                            updatedAt: true
                        }
                    }
                }
            },
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
        orderBy: { name: 'asc' }
    });

    return { categories };
}

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();

    // Since we're in an auth layout, we need to get the user from the auth session
    // The auth layout already checked authentication, but we need the user ID here
    // Let's extract it from the request context or get it from auth session

    // For now, let's get it from the form data (we'll add a hidden field)
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'User authentication required' };
    }

    const data = {
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || '',
        public: formData.get('public') === 'true',
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

    console.log('Form data categoryIds:', data.categoryIds);

    try {
        // Validate the data
        createPromptSchema.parse(data);

        // Create the prompt first
        const prompt = await prisma.prompt.create({
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
                userId: userId
            }
        });

        // Create category associations if any categories were selected
        if (data.categoryIds.length > 0) {
            await prisma.promptCategory.createMany({
                data: data.categoryIds.map((categoryId) => ({
                    promptId: prompt.id,
                    categoryId: categoryId
                }))
            });
        }

        return redirect('/dashboard');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                errors: error.flatten().fieldErrors,
                values: data
            };
        }
        return {
            error: 'Failed to create prompt',
            values: data
        };
    }
}

const promptSections = [
    {
        id: 'taskContext',
        title: '1. Task Context',
        description: "Define the AI's role and expertise area",
        placeholder:
            'You are an expert content writer with years of experience...',
        defaultValue:
            'You are an expert content writer with years of experience in creating engaging blog articles. You understand SEO best practices, audience engagement techniques, and how to structure content for maximum readability and impact.'
    },
    {
        id: 'toneContext',
        title: '2. Tone Context',
        description: 'Specify the desired tone and style',
        placeholder:
            "Use a professional, conversational tone that's accessible to...",
        defaultValue:
            "Use a professional yet conversational tone that's accessible to a general audience. The writing should be engaging, informative, and maintain reader interest throughout. Avoid jargon unless absolutely necessary, and when used, provide clear explanations."
    },
    {
        id: 'backgroundData',
        title: '3. Background Data & Documents',
        description: 'Provide relevant context, data, or reference materials',
        placeholder:
            'Consider current industry trends, research data, or specific documents...',
        defaultValue:
            'Consider current digital marketing trends, SEO best practices for 2024, and user engagement metrics. Focus on creating content that performs well in search engines while providing genuine value to readers.'
    },
    {
        id: 'detailedTaskDescription',
        title: '4. Detailed Task Description & Rules',
        description: 'Comprehensive instructions and constraints',
        placeholder:
            'The task is to create content that: 1. Follows specific guidelines 2. Meets quality standards...',
        defaultValue:
            'Create a comprehensive blog article that: 1. Is between 1500-2500 words 2. Includes proper headings (H1, H2, H3) 3. Has a compelling introduction and conclusion 4. Uses bullet points and numbered lists where appropriate 5. Includes actionable insights and practical tips'
    },
    {
        id: 'examples',
        title: '5. Examples',
        description: 'Provide examples of desired output or structure',
        placeholder:
            'Example format: Title: [Title] Content: [Content structure]...',
        defaultValue:
            "Structure example: Title: '10 Proven Strategies to...' Introduction (hook + preview) Main sections with H2 headings, each containing 2-3 paragraphs with actionable insights, bullet points for key takeaways, and a strong conclusion with next steps."
    },
    {
        id: 'conversationHistory',
        title: '6. Conversation History',
        description: "Previous context or conversation that's relevant",
        placeholder:
            'Previously we discussed... or In our last conversation...',
        defaultValue:
            'This is a new request with no prior conversation history. Approach this as a fresh start with no assumptions about previous discussions.'
    },
    {
        id: 'immediateTask',
        title: '7. Immediate Task Description',
        description: 'The specific current request',
        placeholder: 'Now, please write a blog post about [specific topic]...',
        defaultValue:
            'Now, please write a comprehensive blog post about [TOPIC TO BE SPECIFIED]. The article should be informative, well-researched, and provide practical value to readers interested in this subject.'
    },
    {
        id: 'thinkingSteps',
        title: '8. Thinking Steps',
        description: "Guide the AI's reasoning process",
        placeholder:
            'Think step by step: 1. Analyze the topic 2. Create outline 3. Write content...',
        defaultValue:
            'Think step by step: 1. Analyze the topic and target audience 2. Create a detailed outline with main points 3. Research current trends and best practices 4. Write compelling introduction 5. Develop each main section with examples 6. Create actionable conclusion with next steps'
    },
    {
        id: 'outputFormatting',
        title: '9. Output Formatting',
        description: 'Specify how the output should be structured',
        placeholder:
            'Format your response as: - Heading 1 - Content paragraphs - Bullet points...',
        defaultValue:
            'Format your response as: Title (H1), Introduction paragraph, Main sections with H2 headings, subsections with H3 if needed, bullet points for lists, bold text for key terms, and a conclusion with clear next steps or call-to-action.'
    },
    {
        id: 'prefilledResponse',
        title: '10. Prefilled Response',
        description: "Optional: Start the AI's response",
        placeholder: "I'll help you create... [optional response starter]",
        defaultValue:
            "I'll help you create a comprehensive and engaging blog article. Let me start by outlining the key points and then developing each section with practical insights and actionable advice."
    }
];

export default function NewPrompt({
    actionData,
    loaderData
}: Route.ComponentProps & {
    actionData?: {
        error?: string;
        errors?: { [key: string]: string[] };
        values?: any;
    };
}) {
    const { user } = useOutletContext<{ user: any }>();
    const { categories } = loaderData;
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(false);

    // State for live prompt preview
    const [promptValues, setPromptValues] = useState({
        title: 'Blog Article Writer',
        description:
            'Creates engaging blog articles with proper structure and SEO optimization',
        taskContext:
            'You are an expert content writer with years of experience in creating engaging blog articles. You understand SEO best practices, audience engagement techniques, and how to structure content for maximum readability and impact.',
        toneContext:
            "Use a professional yet conversational tone that's accessible to a general audience. The writing should be engaging, informative, and maintain reader interest throughout. Avoid jargon unless absolutely necessary, and when used, provide clear explanations.",
        backgroundData:
            'Consider current digital marketing trends, SEO best practices for 2024, and user engagement metrics. Focus on creating content that performs well in search engines while providing genuine value to readers.',
        detailedTaskDescription:
            'Create a comprehensive blog article that: 1. Is between 1500-2500 words 2. Includes proper headings (H1, H2, H3) 3. Has a compelling introduction and conclusion 4. Uses bullet points and numbered lists where appropriate 5. Includes actionable insights and practical tips',
        examples:
            "Structure example: Title: '10 Proven Strategies to...' Introduction (hook + preview) Main sections with H2 headings, each containing 2-3 paragraphs with actionable insights, bullet points for key takeaways, and a strong conclusion with next steps.",
        conversationHistory:
            'This is a new request with no prior conversation history. Approach this as a fresh start with no assumptions about previous discussions.',
        immediateTask:
            'Now, please write a comprehensive blog post about [TOPIC TO BE SPECIFIED]. The article should be informative, well-researched, and provide practical value to readers interested in this subject.',
        thinkingSteps:
            'Think step by step: 1. Analyze the topic and target audience 2. Create a detailed outline with main points 3. Research current trends and best practices 4. Write compelling introduction 5. Develop each main section with examples 6. Create actionable conclusion with next steps',
        outputFormatting:
            'Format your response as: Title (H1), Introduction paragraph, Main sections with H2 headings, subsections with H3 if needed, bullet points for lists, bold text for key terms, and a conclusion with clear next steps or call-to-action.',
        prefilledResponse:
            "I'll help you create a comprehensive and engaging blog article. Let me start by outlining the key points and then developing each section with practical insights and actionable advice."
    });

    const updatePromptValue = (field: string, value: string) => {
        setPromptValues((prev) => ({ ...prev, [field]: value }));
    };

    const generatePromptPreview = () => {
        return Object.entries(promptValues)
            .filter(
                ([key, value]) =>
                    key !== 'title' && key !== 'description' && value.trim()
            )
            .map(([key, value]) => value)
            .join('\n\n');
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    return (
        <Layout user={user}>
            <div className="px-4 py-6 sm:px-0">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Create New Prompt
                    </h1>
                    <p className="text-gray-600">
                        Build a structured prompt using the 10-section
                        methodology
                    </p>
                </div>

                {actionData?.error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {actionData.error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Column */}
                    <div className="bg-white shadow rounded-lg">
                        <Form method="post" className="space-y-6 p-6">
                            {/* Hidden field for user ID */}
                            <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                            />
                            {/* Basic Info */}
                            <div className="border-b border-gray-200 pb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Basic Information
                                </h3>

                                <div className="grid grid-cols-1 gap-4">
                                    <TextField
                                        label="Title"
                                        name="title"
                                        id="title"
                                        required
                                        value={promptValues.title}
                                        onChange={(e) =>
                                            updatePromptValue(
                                                'title',
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g., Blog Article Writer"
                                        error={actionData?.errors?.title?.[0]}
                                    />

                                    <TextField
                                        label="Description"
                                        name="description"
                                        id="description"
                                        value={promptValues.description}
                                        onChange={(e) =>
                                            updatePromptValue(
                                                'description',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Brief description of what this prompt does"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Categories
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((category: any) => (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleCategory(
                                                            category.id
                                                        )
                                                    }
                                                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                                        selectedCategories.includes(
                                                            category.id
                                                        )
                                                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                                            : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {category.name}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedCategories.map(
                                            (categoryId) => (
                                                <input
                                                    key={categoryId}
                                                    type="hidden"
                                                    name="categoryIds"
                                                    value={categoryId}
                                                />
                                            )
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Visibility
                                        </label>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="public"
                                                    value="false"
                                                    checked={!isPublic}
                                                    onChange={() =>
                                                        setIsPublic(false)
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
                                                    name="public"
                                                    value="true"
                                                    checked={isPublic}
                                                    onChange={() =>
                                                        setIsPublic(true)
                                                    }
                                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">
                                                    Public
                                                </span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Public prompts can be shared with
                                            others via a link. Private prompts
                                            are only visible to you.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Prompt Sections */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Prompt Structure
                                </h3>

                                {promptSections.map((section) => (
                                    <div
                                        key={section.id}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="mb-3">
                                            <label
                                                htmlFor={section.id}
                                                className="block text-sm font-medium text-gray-900"
                                            >
                                                {section.title}
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {section.description}
                                            </p>
                                        </div>
                                        <TextArea
                                            name={section.id}
                                            id={section.id}
                                            rows={4}
                                            value={
                                                promptValues[
                                                    section.id as keyof typeof promptValues
                                                ]
                                            }
                                            onChange={(e) =>
                                                updatePromptValue(
                                                    section.id,
                                                    e.target.value
                                                )
                                            }
                                            placeholder={section.placeholder}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Create Prompt
                                </button>
                            </div>
                        </Form>
                    </div>

                    {/* Live Preview Column */}
                    <div className="bg-white shadow rounded-lg sticky top-6 self-start">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Live Prompt Preview
                            </h3>
                            <div className="block w-full h-screen max-h-[calc(100vh-12rem)] p-6 bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border border-gray-200 overflow-y-auto text-sm leading-relaxed">
                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-sans">
                                    {generatePromptPreview()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
