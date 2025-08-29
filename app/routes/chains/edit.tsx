import { useState, useEffect } from 'react';
import {
    Link,
    useOutletContext,
    useFetcher,
    useNavigate
} from 'react-router';
import { ArrowLeft, Check, X, Plus, Grip, Trash2 } from 'lucide-react';
import { requireAuth } from '~/lib/session';
import { getChainByUserIdAndIdForEdit, updateChain, checkChainExists } from '~/models/chain.server';
import { getPromptsForSelectionByUserId, getPromptsByIds, validatePromptsExist } from '~/models/prompt.server';
import TextField from '~/components/TextField';
import TextArea from '~/components/TextArea';
import Button from '~/components/Button';
import type { Route } from './+types/edit';

export async function loader({ request, params }: Route.LoaderArgs) {
    const { user, isProUser } = await requireAuth(request);
    const chainId = params.id;

    if (!chainId) {
        throw new Response('Chain not found', { status: 404 });
    }

    if (!isProUser) {
        throw new Response('Pro subscription required', { status: 403 });
    }

    // Get chain data
    const chain = await getChainByUserIdAndIdForEdit(user.id, chainId!);

    if (!chain) {
        throw new Response('Chain not found', { status: 404 });
    }

    // Get all user prompts for selection
    const allPrompts = await getPromptsForSelectionByUserId(user.id);

    return { chain, allPrompts, isProUser };
}

export async function action({ request, params }: Route.ActionArgs) {
    const { user, isProUser } = await requireAuth(request);
    const chainId = params.id!;
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    if (intent === 'update') {
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const promptIds = formData.getAll('promptIds') as string[];

        if (!isProUser) {
            return { success: false, error: 'Pro subscription required' };
        }

        try {
            // Verify chain belongs to user
            const existingChain = await checkChainExists(user.id, chainId);

            if (!existingChain) {
                return { success: false, error: 'Chain not found or access denied' };
            }

            // Verify all prompts belong to the user
            if (promptIds.length > 0) {
                const userPrompts = await validatePromptsExist(user.id, promptIds);

                if (userPrompts.length !== promptIds.length) {
                    return { success: false, error: 'Some prompts do not exist or do not belong to you' };
                }
            }

            // Update chain
            const updatedChain = await updateChain(user.id, chainId, {
                name,
                description,
                promptIds
            });

            return { success: true, chain: updatedChain };
        } catch (error) {
            console.error('Failed to update chain:', error);
            return { success: false, error: 'Failed to update chain' };
        }
    }

    return { success: false, error: 'Invalid intent' };
}

export default function EditChain({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: any; isProUser: boolean }>();
    const { chain, allPrompts } = loaderData;
    const navigate = useNavigate();
    const updateFetcher = useFetcher();
    
    const [editedChain, setEditedChain] = useState({
        name: chain?.name || '',
        description: chain?.description || '',
    });

    const [selectedPrompts, setSelectedPrompts] = useState<Array<{id: string, title: string, description?: string}>>(
        chain?.prompts?.map((cp: any) => cp.prompt) || []
    );

    const updateEditedValue = (field: string, value: string) => {
        setEditedChain(prev => ({ ...prev, [field]: value }));
    };

    const handleAddPrompt = (promptId: string) => {
        const prompt = allPrompts.find(p => p.id === promptId);
        if (prompt && !selectedPrompts.find(p => p.id === promptId)) {
            setSelectedPrompts(prev => [...prev, prompt]);
        }
    };

    const handleRemovePrompt = (promptId: string) => {
        setSelectedPrompts(prev => prev.filter(p => p.id !== promptId));
    };

    const handleReorderPrompts = (fromIndex: number, toIndex: number) => {
        setSelectedPrompts(prev => {
            const newPrompts = [...prev];
            const [movedPrompt] = newPrompts.splice(fromIndex, 1);
            newPrompts.splice(toIndex, 0, movedPrompt);
            return newPrompts;
        });
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append('intent', 'update');
        formData.append('name', editedChain.name);
        formData.append('description', editedChain.description);
        
        selectedPrompts.forEach(prompt => {
            formData.append('promptIds', prompt.id);
        });

        updateFetcher.submit(formData, { method: 'post' });
    };

    // Redirect after successful save
    useEffect(() => {
        if (updateFetcher.data?.success) {
            navigate(`/chains/${chain.id}`);
        }
    }, [updateFetcher.data, navigate, chain.id]);

    const availablePrompts = allPrompts.filter(prompt => 
        !selectedPrompts.find(sp => sp.id === prompt.id)
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Link
                                to={`/chains/${chain.id}`}
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Chain
                            </Link>
                            <h1 className="text-lg font-medium text-gray-900">
                                Edit Chain
                            </h1>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Link
                                to={`/chains/${chain.id}`}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Link>
                            <Button
                                onClick={handleSave}
                                data-cy="save-chain"
                                disabled={updateFetcher.state !== 'idle' || !editedChain.name || selectedPrompts.length === 0}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-6">
                        {/* Chain Details */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Chain Details</h2>
                            <div className="space-y-4">
                                <TextField
                                    label="Chain Name"
                                    data-cy="chain-name"
                                    required
                                    value={editedChain.name}
                                    onChange={(e) => updateEditedValue('name', e.target.value)}
                                    placeholder="Give your chain a descriptive name"
                                />

                                <TextArea
                                    label="Description"
                                    data-cy="chain-description"
                                    value={editedChain.description}
                                    onChange={(e) => updateEditedValue('description', e.target.value)}
                                    placeholder="Describe what this chain accomplishes"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Selected Prompts */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Chain Steps ({selectedPrompts.length})
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Arrange your prompts in the order they should be executed. Each prompt represents a step in your chain.
                            </p>
                            
                            {selectedPrompts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No prompts selected. Add prompts below to build your chain.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedPrompts.map((prompt, index) => (
                                        <div
                                            key={prompt.id}
                                            data-cy="chain-step"
                                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Grip className="w-4 h-4 text-gray-400" />
                                                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                    {index + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {prompt.title}
                                                </p>
                                                {prompt.description && (
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {prompt.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReorderPrompts(index, index - 1)}
                                                        data-cy="move-up"
                                                        className="text-gray-400 hover:text-gray-600"
                                                        title="Move up"
                                                    >
                                                        ↑
                                                    </button>
                                                )}
                                                {index < selectedPrompts.length - 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReorderPrompts(index, index + 1)}
                                                        data-cy="move-down"
                                                        className="text-gray-400 hover:text-gray-600"
                                                        title="Move down"
                                                    >
                                                        ↓
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePrompt(prompt.id)}
                                                    data-cy="remove-prompt"
                                                    className="text-red-400 hover:text-red-600"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Available Prompts */}
                        {availablePrompts.length > 0 && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    Add Prompts to Chain
                                </h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Select prompts to add to your chain. Click to add them in order.
                                </p>
                                <div className="space-y-2">
                                    {availablePrompts.map((prompt) => (
                                        <div
                                            key={prompt.id}
                                            data-cy="available-prompt"
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleAddPrompt(prompt.id)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {prompt.title}
                                                </p>
                                                {prompt.description && (
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {prompt.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Plus className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {updateFetcher.data?.error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="text-sm text-red-800">
                                    {updateFetcher.data.error}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}