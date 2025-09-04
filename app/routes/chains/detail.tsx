import { useState, useEffect } from 'react';
import {
    redirect,
    useNavigate,
    useOutletContext,
    useFetcher
} from 'react-router';
import type { User } from '@prisma/client';
import {
    Link2,
    ArrowRight,
    Eye,
    Edit,
    Trash2,
    Star,
    Zap,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import type { Route } from './+types/detail';

import { requireAuth } from '~/lib/session';
import { getChainByUserIdAndId } from '~/models/chain.server';
import { getPromptsForSelectionByUserId } from '~/models/prompt.server';

export async function loader({ request, params }: Route.LoaderArgs) {
    const { user, isProUser } = await requireAuth(request);
    const chainId = params.id;

    if (!isProUser) {
        throw redirect('/dashboard');
    }

    // Get chain data
    const chain = await getChainByUserIdAndId(user.id, chainId!);

    if (!chain) {
        throw new Response('Chain not found', { status: 404 });
    }

    // Get all user prompts for editing
    const allPrompts = await getPromptsForSelectionByUserId(user.id);

    return { chain, allPrompts, isProUser };
}

export default function ChainDetail({ loaderData }: Route.ComponentProps) {
    const { user } = useOutletContext<{ user: User; isProUser: boolean }>();
    const navigate = useNavigate();

    const evaluationFetcher = useFetcher();
    const deleteFetcher = useFetcher();

    const [currentStep, setCurrentStep] = useState(0);
    const [evaluationResult, setEvaluationResult] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);

    const { chain } = loaderData;

    // Handle evaluation response
    useEffect(() => {
        if (evaluationFetcher.data && evaluationFetcher.state === 'idle') {
            setEvaluationResult(evaluationFetcher.data as string);
            setIsEvaluating(false);
        }
    }, [evaluationFetcher.data, evaluationFetcher.state]);

    const handleEvaluateChain = () => {
        const promptIds = chain.prompts.map((cp) => cp.prompt.id);
        setIsEvaluating(true);
        setEvaluationResult('');

        evaluationFetcher.submit(
            { chainId: chain.id, promptIds },
            {
                method: 'POST',
                action: '/api/evaluate-chain',
                encType: 'application/json'
            }
        );
    };

    const handleDeleteChain = () => {
        if (
            confirm(
                'Are you sure you want to delete this chain? This action cannot be undone.'
            )
        ) {
            deleteFetcher.submit(
                { chainId: chain.id },
                {
                    method: 'DELETE',
                    action: '/api/chains',
                    encType: 'application/json'
                }
            );
        }
    };

    // Navigate to chain editing
    const handleEditChain = () => {
        navigate(`/chains/${chain.id}/edit`);
    };

    // Redirect after successful deletion
    useEffect(() => {
        if (deleteFetcher.data && deleteFetcher.state === 'idle') {
            navigate('/chains');
        }
    }, [deleteFetcher.data, deleteFetcher.state, navigate]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-zinc-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link2 className="h-6 w-6 text-primary-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">
                                    {chain.name}
                                </h1>
                                {chain.description && (
                                    <p className="text-zinc-600 text-sm mt-1">
                                        {chain.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleEvaluateChain}
                                disabled={isEvaluating}
                                className="bg-purple-600 text-white hover:bg-purple-700 disabled:bg-zinc-300 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                            >
                                {isEvaluating ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Zap className="h-4 w-4" />
                                )}
                                <span>
                                    {isEvaluating
                                        ? 'Evaluating...'
                                        : 'Evaluate Chain'}
                                </span>
                            </button>

                            <button
                                onClick={handleEditChain}
                                className="bg-zinc-600 text-white hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                            >
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                            </button>

                            <button
                                onClick={handleDeleteChain}
                                disabled={deleteFetcher.state !== 'idle'}
                                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-zinc-300 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>

                    {/* Chain Stats */}
                    <div className="flex items-center space-x-6 mt-4 text-sm text-zinc-600">
                        <div className="flex items-center space-x-1">
                            <Link2 className="h-4 w-4" />
                            <span>{chain.prompts.length} steps</span>
                        </div>
                        {chain.chainScore && (
                            <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-amber-500" />
                                <span>Score: {chain.chainScore}/10</span>
                            </div>
                        )}
                        {chain.lastEvaluatedAt && (
                            <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>
                                    Last evaluated{' '}
                                    {new Date(
                                        chain.lastEvaluatedAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full flex">
                    {/* Horizontal Scrolling Chain Interface */}
                    <div className="flex-1 overflow-x-auto overflow-y-hidden">
                        <div className="h-full min-w-max px-6 py-6">
                            <div className="flex items-start space-x-6 h-full">
                                {chain.prompts.map((chainPrompt, index) => (
                                    <div
                                        key={chainPrompt.id}
                                        className="flex items-center space-x-4"
                                    >
                                        {/* Prompt Column */}
                                        <div
                                            className={`w-80 bg-white shadow rounded-lg overflow-hidden border-2 transition-colors ${
                                                currentStep === index
                                                    ? 'border-primary-500'
                                                    : 'border-zinc-200 hover:border-zinc-300'
                                            }`}
                                        >
                                            {/* Column Header */}
                                            <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                            {index + 1}
                                                        </div>
                                                        <h3 className="font-medium text-zinc-900 truncate">
                                                            {
                                                                chainPrompt
                                                                    .prompt
                                                                    .title
                                                            }
                                                        </h3>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            setCurrentStep(
                                                                index
                                                            )
                                                        }
                                                        className="text-primary-600 hover:text-primary-700"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {chainPrompt.prompt
                                                    .description && (
                                                    <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
                                                        {
                                                            chainPrompt.prompt
                                                                .description
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Column Content - Preview */}
                                            <div className="p-4 h-96 overflow-y-auto text-sm">
                                                {chainPrompt.prompt
                                                    .taskContext && (
                                                    <div className="mb-3">
                                                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                                                            Task Context
                                                        </div>
                                                        <p className="text-zinc-700 line-clamp-3">
                                                            {
                                                                chainPrompt
                                                                    .prompt
                                                                    .taskContext
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {chainPrompt.prompt
                                                    .detailedTaskDescription && (
                                                    <div className="mb-3">
                                                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                                                            Task Description
                                                        </div>
                                                        <p className="text-zinc-700 line-clamp-3">
                                                            {
                                                                chainPrompt
                                                                    .prompt
                                                                    .detailedTaskDescription
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {chainPrompt.prompt
                                                    .immediateTask && (
                                                    <div className="mb-3">
                                                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                                                            Immediate Task
                                                        </div>
                                                        <p className="text-zinc-700 line-clamp-2">
                                                            {
                                                                chainPrompt
                                                                    .prompt
                                                                    .immediateTask
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/prompts/${chainPrompt.prompt.id}`
                                                        )
                                                    }
                                                    className="text-xs text-primary-600 hover:text-primary-700 mt-2"
                                                >
                                                    View full prompt →
                                                </button>
                                            </div>
                                        </div>

                                        {/* Arrow between columns */}
                                        {index < chain.prompts.length - 1 && (
                                            <div className="flex items-center justify-center">
                                                <ArrowRight className="h-6 w-6 text-zinc-400" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Evaluation Panel */}
                    {(evaluationResult || isEvaluating) && (
                        <div className="w-96 bg-white border-l border-zinc-200 flex flex-col h-full">
                            <div className="bg-purple-50 px-4 py-3 border-b border-zinc-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Zap className="h-5 w-5 text-purple-600" />
                                        <h3 className="font-medium text-zinc-900">
                                            AI Chain Evaluation
                                        </h3>
                                    </div>
                                    {evaluationResult &&
                                        !isEvaluating &&
                                        (() => {
                                            // Extract score from evaluation result - try multiple patterns
                                            const scoreMatch =
                                                evaluationResult.match(
                                                    /Overall (?:Effectiveness|Score):\s*(\d+)/i
                                                );
                                            const score = scoreMatch
                                                ? parseInt(scoreMatch[1])
                                                : 0;

                                            const getScoreColor = (
                                                score: number
                                            ) => {
                                                if (score >= 8)
                                                    return 'text-green-600 bg-green-100';
                                                if (score >= 6)
                                                    return 'text-yellow-600 bg-yellow-100';
                                                return 'text-red-600 bg-red-100';
                                            };

                                            return score > 0 ? (
                                                <div
                                                    className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${getScoreColor(score)}`}
                                                >
                                                    <Star className="w-4 h-4 mr-1" />
                                                    {score}/10
                                                </div>
                                            ) : null;
                                        })()}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {isEvaluating ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="text-center">
                                            <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-2" />
                                            <p className="text-sm text-zinc-600">
                                                Analyzing your chain flow...
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Parse and format the evaluation result */}
                                        {(() => {
                                            const sections = evaluationResult
                                                .split('##')
                                                .filter(Boolean);
                                            return sections.map(
                                                (section, index) => {
                                                    const lines = section
                                                        .trim()
                                                        .split('\n');
                                                    const title =
                                                        lines[0].trim();
                                                    const content = lines
                                                        .slice(1)
                                                        .join('\n')
                                                        .trim();

                                                    // Skip the Overall Effectiveness/Score section since we show it in header
                                                    if (
                                                        title.includes(
                                                            'Overall Effectiveness'
                                                        ) ||
                                                        title.includes(
                                                            'Overall Score'
                                                        )
                                                    )
                                                        return null;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="border-b border-zinc-100 pb-4 last:border-b-0"
                                                        >
                                                            <h4 className="font-medium text-zinc-900 mb-2 flex items-center">
                                                                {title.includes(
                                                                    'Flow Analysis'
                                                                ) && (
                                                                    <Star className="h-4 w-4 mr-2 text-purple-600" />
                                                                )}
                                                                {title.includes(
                                                                    'Issues'
                                                                ) && (
                                                                    <span className="w-4 h-4 mr-2 text-red-500">
                                                                        ⚠️
                                                                    </span>
                                                                )}
                                                                {title.includes(
                                                                    'Recommendations'
                                                                ) && (
                                                                    <span className="w-4 h-4 mr-2 text-primary-500">
                                                                        💡
                                                                    </span>
                                                                )}
                                                                {title.includes(
                                                                    'Opportunities'
                                                                ) && (
                                                                    <span className="w-4 h-4 mr-2 text-green-500">
                                                                        🚀
                                                                    </span>
                                                                )}
                                                                {title}
                                                            </h4>
                                                            <div className="text-sm text-zinc-700 space-y-2">
                                                                {content
                                                                    .split('\n')
                                                                    .map(
                                                                        (
                                                                            line,
                                                                            lineIndex
                                                                        ) => {
                                                                            if (
                                                                                line
                                                                                    .trim()
                                                                                    .startsWith(
                                                                                        '-'
                                                                                    )
                                                                            ) {
                                                                                return (
                                                                                    <div
                                                                                        key={
                                                                                            lineIndex
                                                                                        }
                                                                                        className="flex items-start space-x-2"
                                                                                    >
                                                                                        <span className="text-zinc-400 mt-0.5">
                                                                                            •
                                                                                        </span>
                                                                                        <span>
                                                                                            {line.replace(
                                                                                                /^-\s*/,
                                                                                                ''
                                                                                            )}
                                                                                        </span>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return line.trim() ? (
                                                                                <p
                                                                                    key={
                                                                                        lineIndex
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        line
                                                                                    }
                                                                                </p>
                                                                            ) : null;
                                                                        }
                                                                    )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden bg-white border-t border-zinc-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() =>
                            setCurrentStep(Math.max(0, currentStep - 1))
                        }
                        disabled={currentStep === 0}
                        className="flex items-center space-x-1 text-zinc-600 disabled:text-zinc-400"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                    </button>

                    <span className="text-sm text-zinc-600">
                        Step {currentStep + 1} of {chain.prompts.length}
                    </span>

                    <button
                        onClick={() =>
                            setCurrentStep(
                                Math.min(
                                    chain.prompts.length - 1,
                                    currentStep + 1
                                )
                            )
                        }
                        disabled={currentStep === chain.prompts.length - 1}
                        className="flex items-center space-x-1 text-zinc-600 disabled:text-zinc-400"
                    >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
