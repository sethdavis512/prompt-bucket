import { useState, useCallback, useEffect } from 'react';
import { useFetcher } from 'react-router';

export interface PromptAPIConfig {
  isProUser: boolean;
  promptValues: Record<string, string>;
  onScoreUpdate?: (fieldType: string, score: number, suggestion?: string) => void;
  onContentGenerated?: (fieldType: string, content: string) => void;
}

export interface PromptAPIActions {
  scoreField: (fieldType: string, content: string) => void;
  generateField: (fieldType: string) => void;
  canGenerate: (fieldType: string) => boolean;
}

export interface PromptAPIState {
  scoringField: string | null;
  generatingField: string | null;
  lastScoredContent: Record<string, string>;
  isScoring: boolean;
  isGenerating: boolean;
}

export function usePromptAPI(config: PromptAPIConfig): PromptAPIState & PromptAPIActions {
  const { isProUser, promptValues, onScoreUpdate, onContentGenerated } = config;
  
  const [scoringField, setScoringField] = useState<string | null>(null);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [lastScoredContent, setLastScoredContent] = useState<Record<string, string>>({});
  
  const scoringFetcher = useFetcher();
  const generationFetcher = useFetcher();

  // Handle scoring response
  useEffect(() => {
    if (scoringFetcher.data && scoringField && scoringFetcher.state === 'idle') {
      try {
        const parsed = JSON.parse(scoringFetcher.data as string);
        if (parsed.score && onScoreUpdate) {
          onScoreUpdate(scoringField, parsed.score, parsed.suggestion);
        }
      } catch (e) {
        console.error('Failed to parse scoring result:', e);
      } finally {
        setScoringField(null);
      }
    }
  }, [scoringFetcher.data, scoringFetcher.state, scoringField, onScoreUpdate]);

  // Handle generation response
  useEffect(() => {
    if (generationFetcher.data && generatingField && generationFetcher.state === 'idle') {
      try {
        const generatedContent = generationFetcher.data as string;
        if (generatedContent?.trim() && onContentGenerated) {
          onContentGenerated(generatingField, generatedContent.trim());
        }
      } catch (e) {
        console.error('Failed to process generation result:', e);
      } finally {
        setGeneratingField(null);
      }
    }
  }, [generationFetcher.data, generationFetcher.state, generatingField, onContentGenerated]);

  const scoreField = useCallback((fieldType: string, content: string) => {
    if (!isProUser || !content.trim()) return;
    
    // Prevent duplicate scoring for the same content
    if (lastScoredContent[fieldType] === content) return;
    
    // Prevent scoring if already in progress or fetcher is busy
    if (scoringField === fieldType || scoringFetcher.state !== 'idle') return;

    setScoringField(fieldType);
    setLastScoredContent(prev => ({ ...prev, [fieldType]: content }));
    
    scoringFetcher.submit(
      { intent: 'score', fieldType, content },
      {
        method: 'POST',
        action: '/api/score-prompt',
        encType: 'application/json'
      }
    );
  }, [isProUser, lastScoredContent, scoringField, scoringFetcher]);

  const canGenerate = useCallback((fieldType: string): boolean => {
    // Must have at least task context or title
    const hasFoundation = !!(promptValues.taskContext?.trim() || promptValues.title?.trim());
    
    // Can't generate task context if there's no title
    if (fieldType === 'taskContext' && !promptValues.title?.trim()) {
      return false;
    }
    
    return hasFoundation && isProUser;
  }, [promptValues.taskContext, promptValues.title, isProUser]);

  const generateField = useCallback((fieldType: string) => {
    if (!canGenerate(fieldType) || generatingField) return;

    // Get all filled fields as context
    const previousFields: Record<string, string> = {};
    Object.entries(promptValues).forEach(([key, value]) => {
      if (key !== fieldType && value?.trim()) {
        previousFields[key] = value;
      }
    });

    setGeneratingField(fieldType);

    generationFetcher.submit(
      { 
        intent: 'generate', 
        fieldType, 
        previousFields 
      },
      {
        method: 'POST',
        action: '/api/score-prompt',
        encType: 'application/json'
      }
    );
  }, [canGenerate, generatingField, promptValues, generationFetcher]);

  return {
    // State
    scoringField,
    generatingField,
    lastScoredContent,
    isScoring: scoringFetcher.state !== 'idle',
    isGenerating: generationFetcher.state !== 'idle',
    
    // Actions
    scoreField,
    generateField,
    canGenerate
  };
}