import { prisma } from '~/lib/prisma';

export function getUserById(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            subscriptionStatus: true,
            customerId: true,
            createdAt: true
        }
    });
}

export function updateUserSubscriptionByCustomerId(customerId: string, data: {
    subscriptionStatus: string;
    subscriptionId: string;
}) {
    return prisma.user.updateMany({
        where: { customerId },
        data
    });
}

export function cancelUserSubscriptionByCustomerId(customerId: string) {
    return prisma.user.updateMany({
        where: { customerId },
        data: {
            subscriptionStatus: 'canceled',
            subscriptionId: null
        }
    });
}

export function updateUserSubscriptionById(subscriptionId: string, data: {
    subscriptionStatus: string;
}) {
    return prisma.user.updateMany({
        where: { subscriptionId },
        data
    });
}

export function updateUserByEmail(email: string, data: { customerId: string }) {
    return prisma.user.updateMany({
        where: { email },
        data
    });
}

export function getAllUsers() {
    return prisma.user.findMany({
        select: {
            id: true,
            email: true,
            subscriptionStatus: true,
            customerId: true
        }
    });
}

export function getAllUsersForDebugging() {
    return prisma.user.findMany({
        select: { email: true, id: true }
    });
}