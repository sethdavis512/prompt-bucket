import { Crown, Star } from 'lucide-react';

interface FieldScoringProps {
  fieldType: string;
  label: string;
  score?: number;
  suggestion?: string;
  isProUser: boolean;
  isLoading?: boolean;
  onScoreUpdate?: (score: number, suggestion?: string) => void;
}

export default function FieldScoring({ 
  label, 
  score = 0, 
  suggestion, 
  isProUser,
  isLoading = false
}: FieldScoringProps) {

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreDisplay = () => {
    if (!isProUser) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-medium">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </div>
          <div className="text-xs text-gray-500">AI Scoring</div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
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

    return null;
  };

  return (
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {getScoreDisplay()}
    </div>
  );
}