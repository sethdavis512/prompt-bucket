import { useState } from 'react';

interface PromptPreviewProps {
    title?: string;
    content: string;
    className?: string;
    totalScore?: number;
    isProUser?: boolean;
    onCopy?: (content: string) => void;
}

export default function PromptPreview({
    title = 'Live Prompt Preview',
    content,
    className = '',
    totalScore = 0,
    isProUser = false,
    onCopy
}: PromptPreviewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            onCopy?.(content);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className={`bg-white shadow rounded-lg ${className}`}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-zinc-900">
                        {title}
                    </h3>
                    <div className="flex items-center space-x-3">
                        {((isProUser && totalScore > 0) || !isProUser) && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-zinc-600">
                                    Quality Score:
                                </span>
                                <div
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        !isProUser
                                            ? 'bg-zinc-100 text-zinc-400'
                                            : totalScore >= 80
                                              ? 'bg-green-100 text-green-800'
                                              : totalScore >= 60
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : totalScore >= 40
                                                  ? 'bg-orange-100 text-orange-800'
                                                  : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {isProUser ? totalScore : 0}/100
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleCopy}
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                copied
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            }`}
                            disabled={!content}
                        >
                            {copied ? (
                                <>
                                    <svg
                                        className="w-3 h-3 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-3 h-3 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <div className="block w-full h-screen max-h-[calc(100vh-18rem)] p-6 bg-gradient-to-br from-slate-50 to-zinc-100 rounded-lg border border-zinc-200 overflow-y-auto text-sm leading-relaxed">
                    <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap font-sans">
                        {content ||
                            'Your prompt preview will appear here as you type...'}
                    </div>
                </div>
            </div>
        </div>
    );
}
