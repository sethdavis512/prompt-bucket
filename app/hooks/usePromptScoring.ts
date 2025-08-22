import { useState, useCallback } from 'react';

export interface ScoringState {
  scores: Record<string, number>;
  suggestions: Record<string, string>;
  totalScore: number;
  scoringField: string | null;
  lastScoredContent: Record<string, string>;
}

export interface ScoringActions {
  updateFieldScore: (fieldType: string, score: number, suggestion?: string) => void;
  setScoringField: (fieldType: string | null) => void;
  setLastScoredContent: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  resetScoring: () => void;
}

export function usePromptScoring(): ScoringState & ScoringActions {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [scoringField, setScoringField] = useState<string | null>(null);
  const [lastScoredContent, setLastScoredContent] = useState<Record<string, string>>({});

  const updateFieldScore = useCallback((fieldType: string, score: number, suggestion?: string) => {
    setScores(prev => {
      const newScores = { ...prev, [fieldType]: score };
      const total = Object.values(newScores).reduce((sum, s) => sum + s, 0);
      setTotalScore(total);
      return newScores;
    });
    
    if (suggestion) {
      setSuggestions(prev => ({ ...prev, [fieldType]: suggestion }));
    }
  }, []);

  const resetScoring = useCallback(() => {
    setScores({});
    setSuggestions({});
    setTotalScore(0);
    setScoringField(null);
    setLastScoredContent({});
  }, []);

  return {
    // State
    scores,
    suggestions,
    totalScore,
    scoringField,
    lastScoredContent,
    
    // Actions
    updateFieldScore,
    setScoringField,
    setLastScoredContent,
    resetScoring
  };
}