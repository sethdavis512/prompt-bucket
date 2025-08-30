import { Star } from 'lucide-react';

interface FieldScoringProps {
    fieldType: string;
    label: string;
    score?: number;
    suggestion?: string;
    isProUser: boolean;
    isLoading?: boolean;
    onScoreUpdate?: (score: number, suggestion?: string) => void;
    contextualHint?: string;
}

export default function FieldScoring({
    label,
    score = 0,
    suggestion,
    isProUser,
    isLoading = false,
    contextualHint
}: FieldScoringProps) {
    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600 bg-green-100';
        if (score >= 4) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getScoreDisplay = () => {
        if (!isProUser) {
            // Show grayed-out score for free users
            return (
                <div
                    className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-400"
                    title="AI Scoring available with Pro"
                >
                    <Star className="w-3 h-3 mr-1 opacity-50" />
                    0/10
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className="flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-600 text-xs font-medium">
                    <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                    Scoring...
                </div>
            );
        }

        if (score > 0) {
            return (
                <div
                    className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}
                    title={suggestion || `Score: ${score}/10`}
                >
                    <Star className="w-3 h-3 mr-1" />
                    {score}/10
                </div>
            );
        }

        // Pro users without a score yet - show hint
        const displayHint = contextualHint || 'AI will rate this';
        return (
            <div
                className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-600 border border-primary-200"
                title="Fill in this section and click elsewhere to get AI quality feedback"
            >
                <Star className="w-3 h-3 mr-1 opacity-70" />
                {displayHint}
            </div>
        );
    };

    return (
        <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-700">
                {label}
            </label>
            {getScoreDisplay()}
        </div>
    );
}
