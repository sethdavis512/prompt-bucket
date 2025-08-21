interface PromptPreviewProps {
    title?: string;
    content: string;
    className?: string;
}

export default function PromptPreview({ 
    title = "Live Prompt Preview", 
    content, 
    className = "" 
}: PromptPreviewProps) {
    return (
        <div className={`bg-white shadow rounded-lg sticky top-6 self-start ${className}`}>
            <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {title}
                </h3>
                <div className="block w-full h-screen max-h-[calc(100vh-12rem)] p-6 bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border border-gray-200 overflow-y-auto text-sm leading-relaxed">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-sans">
                        {content || "Your prompt preview will appear here as you type..."}
                    </div>
                </div>
            </div>
        </div>
    );
}