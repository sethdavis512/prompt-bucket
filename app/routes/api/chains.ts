import { data } from 'react-router';
import { auth } from '~/lib/auth';
import { prisma } from '~/lib/prisma';
import type { Route } from './+types/chains';

export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // Check Pro subscription for chain access
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true }
  });

  if (user?.subscriptionStatus !== 'active') {
    throw new Response(JSON.stringify({ 
      error: 'Pro subscription required for chain management' 
    }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const method = request.method;
  
  try {
    switch (method) {
      case 'POST': {
        const { name, description, promptIds } = await request.json();
        
        if (!name || !Array.isArray(promptIds) || promptIds.length === 0) {
          throw new Response(JSON.stringify({ 
            error: 'Name and at least one prompt are required' 
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Verify all prompts belong to the user
        const userPrompts = await prisma.prompt.findMany({
          where: {
            id: { in: promptIds },
            userId: session.user.id
          },
          select: { id: true }
        });

        if (userPrompts.length !== promptIds.length) {
          throw new Response(JSON.stringify({ 
            error: 'Some prompts do not exist or do not belong to you' 
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Create chain with prompts
        const chain = await prisma.chain.create({
          data: {
            name,
            description,
            userId: session.user.id,
            prompts: {
              create: promptIds.map((promptId: string, index: number) => ({
                promptId,
                order: index
              }))
            }
          },
          include: {
            prompts: {
              include: {
                prompt: {
                  select: {
                    id: true,
                    title: true,
                    description: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        });

        return data(chain);
      }

      case 'PUT': {
        const { chainId, name, description, promptIds } = await request.json();
        
        if (!chainId || !name || !Array.isArray(promptIds)) {
          throw new Response(JSON.stringify({ 
            error: 'Chain ID, name, and prompts are required' 
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Verify chain belongs to user
        const existingChain = await prisma.chain.findFirst({
          where: {
            id: chainId,
            userId: session.user.id
          }
        });

        if (!existingChain) {
          throw new Response(JSON.stringify({ 
            error: 'Chain not found or access denied' 
          }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Verify all prompts belong to the user
        if (promptIds.length > 0) {
          const userPrompts = await prisma.prompt.findMany({
            where: {
              id: { in: promptIds },
              userId: session.user.id
            },
            select: { id: true }
          });

          if (userPrompts.length !== promptIds.length) {
            throw new Response(JSON.stringify({ 
              error: 'Some prompts do not exist or do not belong to you' 
            }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Update chain
        const updatedChain = await prisma.chain.update({
          where: { id: chainId },
          data: {
            name,
            description,
            prompts: {
              deleteMany: {}, // Remove all existing chain prompts
              create: promptIds.map((promptId: string, index: number) => ({
                promptId,
                order: index
              }))
            }
          },
          include: {
            prompts: {
              include: {
                prompt: {
                  select: {
                    id: true,
                    title: true,
                    description: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        });

        return data(updatedChain);
      }

      case 'DELETE': {
        const { chainId } = await request.json();
        
        if (!chainId) {
          throw new Response(JSON.stringify({ 
            error: 'Chain ID is required' 
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Verify chain belongs to user and delete
        const deletedChain = await prisma.chain.deleteMany({
          where: {
            id: chainId,
            userId: session.user.id
          }
        });

        if (deletedChain.count === 0) {
          throw new Response(JSON.stringify({ 
            error: 'Chain not found or access denied' 
          }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return data({ success: true });
      }

      default:
        throw new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Error in chains API:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}