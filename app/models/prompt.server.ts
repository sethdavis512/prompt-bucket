import { prisma } from '~/lib/prisma';

export function getPromptCountByUserId(userId: string) {
    return prisma.prompt.count({
        where: { userId }
    });
}

export function getPromptsByUserId(userId: string, options?: {
    search?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
}) {
    const where: any = { userId };

    if (options?.search) {
        where.OR = [
            { title: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } }
        ];
    }

    if (options?.categoryId) {
        where.categories = {
            some: {
                categoryId: options.categoryId
            }
        };
    }

    return prisma.prompt.findMany({
        where,
        include: {
            categories: {
                include: {
                    category: true
                }
            }
        },
        orderBy: { updatedAt: 'desc' },
        take: options?.limit,
        skip: options?.offset
    });
}

export function getPromptsForSelectionByUserId(userId: string) {
    return prisma.prompt.findMany({
        where: { userId },
        select: {
            id: true,
            title: true,
            description: true
        },
        orderBy: { title: 'asc' }
    });
}

export function getPromptByUserIdAndId(userId: string, promptId: string) {
    return prisma.prompt.findUnique({
        where: {
            id: promptId,
            userId
        },
        include: {
            categories: {
                include: {
                    category: true
                }
            }
        }
    });
}

export function getPromptScoringStats(userId: string) {
    return prisma.prompt.aggregate({
        where: { 
            userId,
            totalScore: { gt: 0 }
        },
        _avg: { totalScore: true },
        _max: { totalScore: true },
        _count: { totalScore: true }
    });
}

export function getPromptsByIds(userId: string, promptIds: string[]) {
    return prisma.prompt.findMany({
        where: {
            id: { in: promptIds },
            userId
        },
        select: {
            id: true,
            title: true,
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
    });
}

export function getPromptForSharingById(promptId: string) {
    return prisma.prompt.findUnique({
        where: { id: promptId },
        include: {
            user: {
                select: { name: true, email: true }
            },
            categories: {
                include: {
                    category: true
                }
            }
        }
    });
}

export function getPublicPromptById(promptId: string) {
    return prisma.prompt.findUnique({
        where: {
            id: promptId,
            public: true
        },
        include: {
            user: {
                select: { name: true, email: true }
            },
            categories: {
                include: {
                    category: true
                }
            }
        }
    });
}

export function createPrompt(userId: string, data: any) {
    const { categoryIds, ...promptData } = data;
    
    return prisma.prompt.create({
        data: {
            ...promptData,
            userId,
            categories: categoryIds?.length ? {
                create: categoryIds.map((categoryId: string) => ({
                    categoryId
                }))
            } : undefined
        },
        include: {
            categories: {
                include: {
                    category: true
                }
            }
        }
    });
}

export function updatePrompt(userId: string, promptId: string, data: any) {
    const { categoryIds, ...promptData } = data;
    
    return prisma.prompt.update({
        where: {
            id: promptId,
            userId
        },
        data: {
            ...promptData,
            categories: {
                deleteMany: {},
                ...(categoryIds?.length ? {
                    create: categoryIds.map((categoryId: string) => ({
                        categoryId
                    }))
                } : {})
            }
        },
        include: {
            categories: {
                include: {
                    category: true
                }
            }
        }
    });
}

export function deletePrompt(userId: string, promptId: string) {
    return prisma.prompt.delete({
        where: {
            id: promptId,
            userId
        }
    });
}

export function validatePromptsExist(userId: string, promptIds: string[]) {
    return prisma.prompt.findMany({
        where: {
            id: { in: promptIds },
            userId
        },
        select: { id: true }
    });
}

export function createPromptWithTransaction(userId: string, data: any) {
    const { categoryIds, ...promptData } = data;
    
    return prisma.$transaction(async (tx) => {
        const prompt = await tx.prompt.create({
            data: {
                ...promptData,
                userId
            }
        });

        if (categoryIds?.length) {
            await tx.promptCategory.createMany({
                data: categoryIds.map((categoryId: string) => ({
                    promptId: prompt.id,
                    categoryId
                }))
            });
        }

        return prompt;
    });
}