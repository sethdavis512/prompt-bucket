import { Webhooks } from '@polar-sh/remix';
import { prisma } from '~/lib/prisma';

export const action = Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
    onPayload: async (payload) => {
        console.log('🔔 Received Polar webhook:', payload.type);
        console.log('📦 Payload data:', JSON.stringify(payload.data, null, 2));

        try {
            switch (payload.type) {
                case 'subscription.created':
                case 'subscription.updated': {
                    const subscription = payload.data;
                    console.log(
                        `🔄 Processing subscription ${payload.type}:`,
                        subscription.id
                    );
                    console.log(`👤 Customer ID: ${subscription.customerId}`);
                    console.log(`📊 Status: ${subscription.status}`);
                    console.log(
                        `🔍 Full subscription object:`,
                        JSON.stringify(subscription, null, 2)
                    );

                    // Find user by customer ID and update subscription status
                    const result = await prisma.user.updateMany({
                        where: {
                            customerId: subscription.customerId
                        },
                        data: {
                            subscriptionStatus: subscription.status,
                            subscriptionId: subscription.id
                        }
                    });
                    console.log(`✅ Updated ${result.count} users`);
                    break;
                }

                case 'subscription.canceled': {
                    const subscription = payload.data;

                    // Update user subscription status to canceled
                    await prisma.user.updateMany({
                        where: { customerId: subscription.customerId },
                        data: {
                            subscriptionStatus: 'canceled'
                        }
                    });
                    break;
                }

                case 'customer.created': {
                    const customer = payload.data;
                    console.log(
                        `👤 Processing customer created: ${customer.id}`
                    );
                    console.log(`📧 Customer email: ${customer.email}`);
                    console.log(
                        `🔍 Full customer object:`,
                        JSON.stringify(customer, null, 2)
                    );

                    // Update user with customer ID if we can match by email
                    if (customer.email) {
                        const result = await prisma.user.updateMany({
                            where: { email: customer.email },
                            data: {
                                customerId: customer.id
                            }
                        });
                        console.log(
                            `✅ Updated ${result.count} users with customer ID: ${customer.id}`
                        );

                        if (result.count === 0) {
                            console.log(
                                `⚠️ No users found with email: ${customer.email}`
                            );
                            // List all users for debugging
                            const allUsers = await prisma.user.findMany({
                                select: { email: true, id: true }
                            });
                            console.log('📋 All users in database:', allUsers);
                        }
                    } else {
                        console.log('⚠️ No email provided for customer');
                    }
                    break;
                }

                case 'checkout.created': {
                    const checkout = payload.data;
                    console.log('Checkout created:', checkout.id);
                    break;
                }

                case 'order.created': {
                    const order = payload.data;
                    console.log('Order created:', order.id);

                    // If this is a subscription order, the subscription webhook will handle status update
                    break;
                }

                default:
                    console.log('Unhandled webhook type:', payload.type);
            }
        } catch (error) {
            console.error('Error processing webhook:', error);
            throw error;
        }
    }
});
