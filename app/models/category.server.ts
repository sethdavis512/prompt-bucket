import { prisma } from '~/lib/prisma';

export function getCategoriesByUserId(userId: string) {
    return prisma.category.findMany({
        where: { userId },
        include: {
            _count: {
                select: { prompts: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export function getCategoryCountByUserId(userId: string) {
    return prisma.category.count({
        where: { userId }
    });
}

export function getCategoriesForPromptsByUserId(userId: string) {
    return prisma.category.findMany({
        where: { userId },
        include: {
            _count: {
                select: { prompts: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export function getCategoryByUserIdAndId(userId: string, categoryId: string) {
    return prisma.category.findUnique({
        where: {
            id: categoryId,
            userId
        }
    });
}

export function getCategoryByUserIdAndName(userId: string, name: string) {
    return prisma.category.findFirst({
        where: {
            userId,
            name
        }
    });
}

export function createCategory(userId: string, name: string, color: string) {
    return prisma.category.create({
        data: {
            name,
            color,
            userId
        }
    });
}

export function getCategoriesWithRecentPrompts(userId: string) {
    return prisma.category.findMany({
        where: { userId },
        include: {
            prompts: {
                where: {
                    prompt: {
                        userId: userId
                    }
                },
                include: {
                    prompt: {
                        select: {
                            id: true,
                            title: true,
                            updatedAt: true
                        }
                    }
                },
                take: 3,
                orderBy: {
                    prompt: {
                        updatedAt: 'desc'
                    }
                }
            },
            _count: {
                select: { prompts: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export function getCategoryByIdForAPI(categoryId: string) {
    return prisma.category.findUnique({
        where: { id: categoryId }
    });
}

export function deleteCategory(userId: string, categoryId: string) {
    return prisma.category.delete({
        where: {
            id: categoryId,
            userId
        }
    });
}
