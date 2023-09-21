import { PrismaClient } from '@prisma/client';
import amqplib from 'amqplib';
import { config } from 'dotenv';
/**
 * Represents a payment option with details about a specific type of token.
 */
interface PaymentOption {
    token: string;
    name: string;
    symbol: string;
    is_eth: boolean;
}

/**
 * Represents the data required to process a burn event.
 */
interface BurnData {
    subscription_id: string;
    tier_id: string;
    expiry: string;
}

/**
 * Represents the data required to process a pay event.
 */
interface PayData {
    subscription_id: string;
    payment_option: PaymentOption;
    tier_id: string;
    expiry: string;
    amount: number;
}

/**
 * Represents the data required to process a mint event.
 */
interface MintData {
    tier_id: string;
    expiry: string;
}

/**
 * Represents the data for a message that can be sent to RabbitMQ, which can be of several different types (burn, pay, mint).
 */
type RabbitMQMessageData = BurnData | PayData | MintData;

/**
 * Represents a message to be sent to RabbitMQ with details about the event type, data, submission time, user ID, and project ID.
 */
interface RabbitMQMessage {
    event_type: 'burn' | 'pay' | 'mint';
    data: RabbitMQMessageData;
    submitted_at: string;
    user_id: string;
    project_id: string;
}

const prisma = new PrismaClient();
const RABBITMQ_URL = process.env.RABBIT_MQ; 


/**
 * Creates the appropriate message data based on the event type and various other parameters.
 * 
 * @param eventType - The type of event ('burn', 'pay', or 'mint').
 * @param subscription - The subscription data.
 * @param userBalance - The user balance data.
 * @param subscriptionCost - The cost of the subscription.
 * 
 * @returns The created message data.
 */
function createMessageData(eventType: 'burn' | 'pay' | 'mint', subscription: any, userBalance: any, subscriptionCost: number): RabbitMQMessageData {
    if (eventType === 'burn') {
        return {
            subscription_id: subscription.id,
            tier_id: subscription.tierId,
            expiry: subscription.expires.toISOString(),
        };
    } else if (eventType === 'pay') {
        return {
            subscription_id: subscription.id,
            payment_option: {
                token: "TOKEN_IDENTIFIER_HERE",
                name: "TOKEN_NAME_HERE",
                symbol: "TOKEN_SYMBOL_HERE",
                is_eth: true
            },
            tier_id: subscription.tierId,
            expiry: subscription.expires.toISOString(),
            amount: subscriptionCost
        };
    } else {
        return {
            tier_id: subscription.tierId,
            expiry: subscription.expires.toISOString(),
        };
    }
}

/**
 * Main function to handle the processing of expired subscriptions.
 * It retrieves expired subscriptions and sends appropriate messages to RabbitMQ for further processing.
 */

async function main() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {
                expires: {
                    gte: todayStart,
                    lt: todayEnd,
                },
                should_continue: true,
            },
            include: {
                user: {
                    include: {
                        balances: true,
                    },
                },
                tier: true,
            },
        });

        const connection = await amqplib.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        for (const subscription of expiredSubscriptions) {
            const projectPayments = await prisma.projectPayment.findMany({
                where: {
                    projectId: subscription.projectId
                }
            });
            for (const projectPayment of projectPayments) {

                const tokenIdentifier = projectPayment.token
                const userBalance = subscription.user.balances.find(b => b.token === tokenIdentifier);
                const subscriptionCost = parseInt(subscription.tier.price, 10);
                const eventType = userBalance && userBalance.balance >= subscriptionCost ? 'pay' : 'burn';
                const message: RabbitMQMessage = {
                    event_type: eventType,
                    data: createMessageData(eventType, subscription, userBalance, subscriptionCost),
                    submitted_at: new Date().toISOString(),
                    user_id: subscription.userId,
                    project_id: subscription.projectId,
                };

                if (message.event_type === 'burn') {
                    message.data.expiry = subscription.expires.toISOString();
                }

                await channel.sendToQueue('subscription-queue', Buffer.from(JSON.stringify(message)));
            }
        }

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Error sending messages', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
