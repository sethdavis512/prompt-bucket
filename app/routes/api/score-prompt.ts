import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { auth } from '~/lib/auth';
import { prisma } from '~/lib/prisma';
import type { Route } from './+types/score-prompt';

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    throw new Response('Method not allowed', { status: 405 });
  }

  try {
    const { intent, fieldType, content, previousFields }: { 
      intent: string; 
      fieldType: string; 
      content?: string; 
      previousFields?: Record<string, string>;
    } = await request.json();

    // Check authentication for all requests
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      throw new Response('Unauthorized', { status: 401 });
    }

    // For generation requests, validate Pro subscription
    if (intent === 'generate') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionStatus: true }
      });

      if (user?.subscriptionStatus !== 'active') {
        throw new Response(JSON.stringify({ 
          error: 'Pro subscription required for AI generation' 
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    switch (intent) {
      case 'score': {
        if (!content) {
          throw new Error('Content is required for scoring');
        }

        const scoringPrompt = createScoringPrompt(fieldType, content);

        const result = streamText({
          model: openai('gpt-3.5-turbo'),
          prompt: scoringPrompt,
          temperature: 0.1, // Lower temperature for consistent scoring
        });

        return result.toTextStreamResponse();
      }

      case 'generate': {
        if (!previousFields || Object.keys(previousFields).length === 0) {
          throw new Error('Previous fields are required for generation');
        }

        const generationPrompt = createGenerationPrompt(fieldType, previousFields);

        const result = streamText({
          model: openai('gpt-3.5-turbo'),
          prompt: generationPrompt,
          temperature: 0.7, // Higher temperature for creative generation
        });

        return result.toTextStreamResponse();
      }

      default: {
        throw new Error(`Unexpected intent: ${intent}`);
      }
    }
  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function createScoringPrompt(fieldType: string, content: string): string {
  const fieldCriteria = {
    taskContext: 'Clear, specific context that provides necessary background. Should be detailed enough for someone unfamiliar with the domain to understand.',
    toneContext: 'Specific tone and style instructions. Should define voice, formality level, and target audience clearly.',
    backgroundData: 'Relevant background information that supports the task. Should include facts, constraints, or contextual details.',
    detailedTaskDescription: 'Crystal clear, unambiguous instructions about what needs to be done. Should be specific and actionable.',
    examples: 'High-quality examples that demonstrate the desired output format and style. Multiple diverse examples are better.',
    conversationHistory: 'Relevant previous conversation context when needed for continuity.',
    immediateTask: 'Precise, actionable current request that builds on the context provided.',
    thinkingSteps: 'Logical step-by-step reasoning guide that helps structure the AI thought process.',
    outputFormatting: 'Specific format requirements with clear structure expectations.',
    prefilledResponse: 'Helpful starter text that guides the beginning of the response.'
  };

  const criteria = fieldCriteria[fieldType as keyof typeof fieldCriteria] || 'General prompt quality criteria';

  return `You are an expert prompt engineer. Score this ${fieldType} field on a scale of 1-10 based on these criteria: ${criteria}

Content to score: "${content}"

Provide your response in this exact JSON format:
{
  "score": [number from 1-10],
  "suggestion": "[brief, actionable improvement suggestion in 15 words or less]",
  "reasoning": "[one sentence explaining the score]"
}

Scoring guidelines:
- 1-3: Poor (empty, vague, or unclear)
- 4-7: Good (adequate but could be improved) 
- 8-10: Excellent (clear, specific, and well-crafted)

Empty or very short content should score 1-3. Be constructive but honest.`;
}

function createGenerationPrompt(fieldType: string, previousFields: Record<string, string>): string {
  // Field-specific limits and instructions for optimal token usage
  const fieldConfig = {
    taskContext: { 
      instruction: 'Write a role definition establishing the AI as an expert in a specific domain.',
      maxChars: 800, // ~200 tokens
      priority: ['title', 'description']
    },
    toneContext: { 
      instruction: 'Write tone and style instructions specifying voice, formality, and audience.',
      maxChars: 600, // ~150 tokens  
      priority: ['taskContext', 'title']
    },
    backgroundData: { 
      instruction: 'Write background information including relevant facts, constraints, or context.',
      maxChars: 1000, // ~250 tokens
      priority: ['taskContext', 'toneContext', 'title']
    },
    detailedTaskDescription: { 
      instruction: 'Write detailed task instructions with specific requirements and constraints.',
      maxChars: 1200, // ~300 tokens
      priority: ['taskContext', 'backgroundData', 'toneContext']
    },
    examples: { 
      instruction: 'Write concrete examples demonstrating the desired output format and style.',
      maxChars: 800, // ~200 tokens
      priority: ['taskContext', 'detailedTaskDescription', 'toneContext']
    },
    conversationHistory: { 
      instruction: 'Write relevant conversation context or state "This is a new conversation."',
      maxChars: 400, // ~100 tokens
      priority: ['taskContext', 'immediateTask']
    },
    immediateTask: { 
      instruction: 'Write the specific current request or action to be performed.',
      maxChars: 300, // ~75 tokens
      priority: ['taskContext', 'detailedTaskDescription']
    },
    thinkingSteps: { 
      instruction: 'Write step-by-step reasoning instructions to guide the AI thinking process.',
      maxChars: 600, // ~150 tokens
      priority: ['taskContext', 'detailedTaskDescription', 'immediateTask']
    },
    outputFormatting: { 
      instruction: 'Write specific formatting requirements and structure expectations.',
      maxChars: 400, // ~100 tokens
      priority: ['taskContext', 'detailedTaskDescription', 'examples']
    },
    prefilledResponse: { 
      instruction: 'Write opening text that starts the AI response in the desired direction.',
      maxChars: 200, // ~50 tokens
      priority: ['taskContext', 'immediateTask', 'toneContext']
    }
  };

  const config = fieldConfig[fieldType as keyof typeof fieldConfig];
  const instruction = config?.instruction || 'Generate appropriate content for this field.';
  const maxChars = config?.maxChars || 600;
  const priorityFields = config?.priority || [];
  
  // Build optimized context using field priority and truncation
  const fieldLabels: Record<string, string> = {
    title: 'Title',
    description: 'Description', 
    taskContext: 'Task Context',
    toneContext: 'Tone Context',
    backgroundData: 'Background Data',
    detailedTaskDescription: 'Detailed Task Description',
    examples: 'Examples',
    conversationHistory: 'Conversation History',
    immediateTask: 'Immediate Task',
    thinkingSteps: 'Thinking Steps',
    outputFormatting: 'Output Formatting',
    prefilledResponse: 'Prefilled Response'
  };

  // Helper function to truncate text while preserving meaning
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    
    // Try to cut at sentence boundary
    const truncated = text.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSentence > maxLength * 0.7) {
      return text.substring(0, lastSentence + 1);
    } else if (lastSpace > maxLength * 0.8) {
      return text.substring(0, lastSpace) + '...';
    } else {
      return truncated + '...';
    }
  };

  // Build context using priority fields first, with smart truncation
  const contextParts: string[] = [];
  let totalContextLength = 0;
  const maxContextLength = 1500; // ~375 tokens max for context

  // First, add priority fields
  for (const fieldKey of priorityFields) {
    if (previousFields[fieldKey]?.trim()) {
      const label = fieldLabels[fieldKey] || fieldKey;
      const value = truncateText(previousFields[fieldKey], 400); // Max 400 chars per field
      const part = `${label}: ${value}`;
      
      if (totalContextLength + part.length < maxContextLength) {
        contextParts.push(part);
        totalContextLength += part.length;
      }
    }
  }

  // Then add remaining fields if space allows
  for (const [fieldKey, value] of Object.entries(previousFields)) {
    if (!priorityFields.includes(fieldKey) && value?.trim() && totalContextLength < maxContextLength) {
      const label = fieldLabels[fieldKey] || fieldKey;
      const truncatedValue = truncateText(value, 300); // Shorter for non-priority fields
      const part = `${label}: ${truncatedValue}`;
      
      if (totalContextLength + part.length < maxContextLength) {
        contextParts.push(part);
        totalContextLength += part.length;
      }
    }
  }

  const context = contextParts.join('\n\n');

  return `You are an expert prompt engineer. Generate content for a "${fieldType}" field.

Context from other fields:
${context}

Task: ${instruction}

Requirements:
- Return ONLY the raw content text
- No conversational language like "Sure, here's..." or "I'll help you..."
- No field labels, prefixes, or explanations
- No quotation marks around the response
- Maximum ${maxChars} characters
- Direct, actionable content only

Generate the ${fieldType} content now:`;
}