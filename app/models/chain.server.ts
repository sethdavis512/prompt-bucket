import { prisma } from '~/lib/prisma';

export function getChainsByUserId(userId: string, options?: {
    search?: string;
    limit?: number;
    offset?: number;
}) {
    const where: any = { userId };

    if (options?.search) {
        where.OR = [
            { name: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } }
        ];
    }

    return prisma.chain.findMany({
        where,
        include: {
            prompts: {
                include: {
                    prompt: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                },
                orderBy: { order: 'asc' }
            }
        },
        orderBy: { updatedAt: 'desc' },
        take: options?.limit,
        skip: options?.offset
    });
}

export function getChainCountByUserId(userId: string) {
    return prisma.chain.count({
        where: { userId }
    });
}

export function getChainByUserIdAndId(userId: string, chainId: string) {
    return prisma.chain.findFirst({
        where: {
            id: chainId,
            userId
        },
        include: {
            prompts: {
                include: {
                    prompt: {
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
                            prefilledResponse: true,
                            totalScore: true
                        }
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    });
}

export function getChainScoringStats(userId: string) {
    return prisma.chain.aggregate({
        where: { 
            userId,
            chainScore: { gt: 0 }
        },
        _avg: { chainScore: true },
        _max: { chainScore: true },
        _count: { chainScore: true }
    });
}

export function createChain(userId: string, data: {
    name: string;
    description?: string;
    promptIds: string[];
}) {
    const { promptIds, ...chainData } = data;
    
    return prisma.chain.create({
        data: {
            ...chainData,
            userId,
            prompts: {
                create: promptIds.map((promptId, index) => ({
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
                            title: true
                        }
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    });
}

export function updateChain(userId: string, chainId: string, data: {
    name?: string;
    description?: string;
    promptIds?: string[];
    chainScore?: number;
    chainScoreExplanation?: string;
}) {
    const { promptIds, ...chainData } = data;
    
    return prisma.chain.update({
        where: {
            id: chainId,
            userId
        },
        data: {
            ...chainData,
            ...(promptIds && {
                prompts: {
                    deleteMany: {},
                    create: promptIds.map((promptId, index) => ({
                        promptId,
                        order: index
                    }))
                }
            })
        },
        include: {
            prompts: {
                include: {
                    prompt: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    });
}

export function deleteChain(userId: string, chainId: string) {
    return prisma.chain.delete({
        where: {
            id: chainId,
            userId
        }
    });
}

export function checkChainExists(userId: string, chainId: string) {
    return prisma.chain.findFirst({
        where: {
            id: chainId,
            userId
        }
    });
}

export function getChainByUserIdAndIdForEdit(userId: string, chainId: string) {
    return prisma.chain.findFirst({
        where: {
            id: chainId,
            userId
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
}