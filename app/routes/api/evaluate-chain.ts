import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { auth } from '~/lib/auth';
import { prisma } from '~/lib/prisma';
import type { Route } from './+types/evaluate-chain';

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    throw new Response('Method not allowed', { status: 405 });
  }

  try {
    const { chainId, promptIds }: { 
      chainId?: string; 
      promptIds: string[];
    } = await request.json();

    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      throw new Response('Unauthorized', { status: 401 });
    }

    // Validate Pro subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true }
    });

    if (user?.subscriptionStatus !== 'active') {
      throw new Response(JSON.stringify({ 
        error: 'Pro subscription required for AI chain evaluation' 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!Array.isArray(promptIds) || promptIds.length === 0) {
      throw new Error('Prompt IDs array is required for chain evaluation');
    }

    // Fetch prompts in order
    const prompts = await prisma.prompt.findMany({
      where: {
        id: { in: promptIds },
        userId: session.user.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        taskContext: true,
        toneContext: true,
        backgroundData: true,
        detailedTaskDescription: true,
        examples: true,
        conversationHistory: true,
        immediateTask: true,
        thinkingSteps: true,
        outputFormatting: true,
        prefilledResponse: true
      }
    });

    if (prompts.length !== promptIds.length) {
      throw new Error('Some prompts do not exist or do not belong to you');
    }

    // Order prompts according to the provided sequence
    const orderedPrompts = promptIds.map(id => 
      prompts.find(p => p.id === id)
    ).filter(Boolean);

    const evaluationPrompt = createChainEvaluationPrompt(orderedPrompts);

    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      prompt: evaluationPrompt,
      temperature: 0.3, // Balanced temperature for analytical feedback
    });

    // If chainId provided, save evaluation result
    if (chainId) {
      // Note: We'll save the evaluation after streaming completes
      // For now, just update the lastEvaluatedAt timestamp
      await prisma.chain.update({
        where: { 
          id: chainId,
          userId: session.user.id 
        },
        data: {
          lastEvaluatedAt: new Date()
        }
      });
    }

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error evaluating chain:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to evaluate chain';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function createChainEvaluationPrompt(prompts: any[]): string {
  const chainLength = prompts.length;
  
  // Build chain summary
  const chainSummary = prompts.map((prompt, index) => {
    const fields = [
      prompt.taskContext,
      prompt.detailedTaskDescription,
      prompt.immediateTask
    ].filter(Boolean);
    
    const summary = fields.length > 0 ? fields.join(' | ') : prompt.title;
    return `Step ${index + 1}: ${prompt.title}\n   Content: ${summary.substring(0, 200)}${summary.length > 200 ? '...' : ''}`;
  }).join('\n\n');

  let evaluationFocus = '';
  let specificGuidance = '';

  if (chainLength === 2) {
    evaluationFocus = 'SHORT CHAIN ANALYSIS';
    specificGuidance = `
For this 2-step chain, focus on:
- What additional steps could strengthen the workflow
- Missing preparatory or follow-up steps
- Opportunities to break down complex steps into smaller ones
- Context that might be missing between the two steps`;
  } else if (chainLength >= 5) {
    evaluationFocus = 'COMPREHENSIVE CHAIN ANALYSIS';
    specificGuidance = `
For this ${chainLength}-step chain, focus on:
- Identifying gaps in the logical flow
- Detecting redundant or overlapping steps
- Finding inconsistencies in context or assumptions
- Suggesting consolidation opportunities
- Ensuring smooth transitions between steps`;
  } else {
    evaluationFocus = 'MEDIUM CHAIN ANALYSIS';
    specificGuidance = `
For this ${chainLength}-step chain, focus on:
- Optimizing the flow and transitions
- Ensuring each step builds logically on the previous
- Identifying any missing critical steps
- Checking for appropriate level of detail at each step`;
  }

  return `You are an expert prompt chain analyst. Evaluate this ${chainLength}-step prompt chain for flow, coherence, and effectiveness.

${evaluationFocus}

CHAIN TO EVALUATE:
${chainSummary}

${specificGuidance}

Provide your analysis in this structured format:

## Overall Chain Assessment
[1-2 sentences summarizing the chain's purpose and overall quality]

## Flow Analysis
- **Logical Progression**: [How well do steps build on each other?]
- **Context Preservation**: [Is important context maintained throughout?]
- **Transition Quality**: [How smooth are the handoffs between steps?]

## Identified Issues
[List specific problems, gaps, or inefficiencies - be direct and actionable]

## Improvement Recommendations
[Specific, actionable suggestions to enhance the chain]

## Optimization Opportunities
[Ways to make the chain more efficient or effective]

Scoring: Rate the chain from 1-10 for overall effectiveness, where:
- 1-3: Poor flow with major gaps
- 4-6: Adequate but needs improvement  
- 7-8: Good with minor optimizations needed
- 9-10: Excellent, well-structured chain

Be constructive but honest in your assessment. Focus on practical improvements that will make the chain more effective.`;
}