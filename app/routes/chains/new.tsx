import { useState, useEffect } from 'react';
import { redirect, useNavigate, useOutletContext, useFetcher } from 'react-router';
import type { User } from '@prisma/client';
import {
    Link2,
    Plus,
    X,
    ArrowRight,
    ChevronDown,
    GripVertical
} from 'lucide-react';
import type { Route } from './+types/new';

import TextField from '~/components/TextField';
import { prisma } from '~/lib/prisma';
import { auth } from '~/lib/auth';

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });

    // Check Pro subscription
    const user = await prisma.user.findUnique({
        where: { id: session!.user.id },
        select: { subscriptionStatus: true }
    });

    const isProUser = user?.subscriptionStatus === 'active';

    if (!isProUser) {
        throw redirect('/chains'); // Will show upgrade prompt
    }

    // Get user's prompts for selection
    const prompts = await prisma.prompt.findMany({
        where: { userId: session!.user.id },
        select: {
            id: true,
            title: true,
            description: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    return { prompts, isProUser };
}

export async function action({ request }: Route.ActionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
        throw redirect('/auth/signin');
    }

    // Check Pro subscription
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionStatus: true }
    });

    if (user?.subscriptionStatus !== 'active') {
        throw redirect('/chains');
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const promptIds = formData.getAll('promptIds') as string[];

    if (!name || promptIds.length === 0) {
        return new Response(JSON.stringify({ 
            error: 'Name and at least one prompt are required' 
        }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Create chain
        const chain = await prisma.chain.create({
            data: {
                name,
                description: description || null,
                userId: session.user.id,
                prompts: {
                    create: promptIds.map((promptId, index) => ({
                        promptId,
                        order: index
                    }))
                }
            }
        });

        return redirect(`/chains/${chain.id}`);
    } catch (error) {
        console.error('Error creating chain:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to create chain' 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export default function NewChain({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: User, isProUser: boolean }>();
    const navigate = useNavigate();
    const fetcher = useFetcher();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddPrompt = () => {
        setSelectedPrompts([...selectedPrompts, '']);
    };

    const handleRemovePrompt = (index: number) => {
        setSelectedPrompts(selectedPrompts.filter((_, i) => i !== index));
    };

    const handlePromptChange = (index: number, promptId: string) => {
        const newPrompts = [...selectedPrompts];
        newPrompts[index] = promptId;
        setSelectedPrompts(newPrompts);
    };

    const handleMovePrompt = (index: number, direction: 'up' | 'down') => {
        const newPrompts = [...selectedPrompts];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex >= 0 && targetIndex < newPrompts.length) {
            [newPrompts[index], newPrompts[targetIndex]] = [newPrompts[targetIndex], newPrompts[index]];
            setSelectedPrompts(newPrompts);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim() || selectedPrompts.filter(Boolean).length === 0) {
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', name.trim());
        if (description.trim()) {
            formData.append('description', description.trim());
        }
        
        selectedPrompts.filter(Boolean).forEach(promptId => {
            formData.append('promptIds', promptId);
        });

        fetcher.submit(formData, { method: 'POST' });
    };

    const getAvailablePrompts = (currentIndex: number) => {
        return loaderData.prompts.filter(prompt => 
            !selectedPrompts.includes(prompt.id) || selectedPrompts[currentIndex] === prompt.id
        );
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <Link2 className="h-6 w-6 text-gray-400" />
                        <h1 className="text-2xl font-bold text-gray-900">Create New Chain</h1>
                    </div>
                    <p className="text-gray-600 mt-2">
                        Build a multi-step workflow by chaining your prompts together
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Chain Information</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chain Name *
                                    </label>
                                    <TextField
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter chain name..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe what this chain accomplishes..."
                                        rows={3}
                                        className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Chain Builder */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-medium text-gray-900">Chain Steps</h2>
                                <button
                                    type="button"
                                    onClick={handleAddPrompt}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add Step</span>
                                </button>
                            </div>

                            {selectedPrompts.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                    <Link2 className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-500">
                                        No steps added yet. Click "Add Step" to start building your chain.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedPrompts.map((promptId, index) => (
                                        <div key={index} className="relative">
                                            <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                                                {/* Step number and drag handle */}
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex flex-col space-y-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMovePrompt(index, 'up')}
                                                            disabled={index === 0}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                        >
                                                            <ChevronDown className="h-3 w-3 rotate-180" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMovePrompt(index, 'down')}
                                                            disabled={index === selectedPrompts.length - 1}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                        >
                                                            <ChevronDown className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                </div>

                                                {/* Prompt selection */}
                                                <div className="flex-1">
                                                    <select
                                                        value={promptId}
                                                        onChange={(e) => handlePromptChange(index, e.target.value)}
                                                        className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        required
                                                    >
                                                        <option value="">Select a prompt...</option>
                                                        {getAvailablePrompts(index).map((prompt) => (
                                                            <option key={prompt.id} value={prompt.id}>
                                                                {prompt.title}
                                                                {prompt.description && ` - ${prompt.description.substring(0, 50)}...`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Remove button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePrompt(index)}
                                                    className="p-2 text-gray-400 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Arrow between steps */}
                                            {index < selectedPrompts.length - 1 && (
                                                <div className="flex justify-center py-2">
                                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {loaderData.prompts.length === 0 && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        You need to create some prompts before you can build chains. 
                                        <button
                                            type="button"
                                            onClick={() => navigate('/prompts/new')}
                                            className="ml-1 underline hover:no-underline"
                                        >
                                            Create a prompt first
                                        </button>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => navigate('/chains')}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !name.trim() || selectedPrompts.filter(Boolean).length === 0}
                                className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed px-6 py-2 rounded-md text-sm font-medium"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Chain'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}