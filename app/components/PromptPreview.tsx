interface PromptPreviewProps {
    title?: string;
    content: string;
    className?: string;
    totalScore?: number;
    isProUser?: boolean;
}

export default function PromptPreview({ 
    title = "Live Prompt Preview", 
    content, 
    className = "",
    totalScore = 0,
    isProUser = false
}: PromptPreviewProps) {
    return (
        <div className={`bg-white shadow rounded-lg sticky top-6 self-start ${className}`}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        {title}
                    </h3>
                    {(isProUser || totalScore > 0) && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Quality Score:</span>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                totalScore >= 80 ? 'bg-green-100 text-green-800' :
                                totalScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                totalScore >= 40 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {totalScore}/100
                            </div>
                        </div>
                    )}
                </div>
                <div className="block w-full h-screen max-h-[calc(100vh-12rem)] p-6 bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border border-gray-200 overflow-y-auto text-sm leading-relaxed">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-sans">
                        {content || "Your prompt preview will appear here as you type..."}
                    </div>
                </div>
            </div>
        </div>
    );
}