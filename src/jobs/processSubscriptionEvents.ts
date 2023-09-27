import { PrismaClient } from '@prisma/client';
import amqplib from 'amqplib';
import { config } from 'dotenv';
/**
 * RabbitMQ server URL.
 */
const RABBITMQ_URL = process.env.RABBIT_MQ;

/**
 * Prisma client instance to interact with your database.
 */
const prisma = new PrismaClient();

/**
 * Interface describing the structure of a RabbitMQ message.
 */
interface RabbitMQMessage {
    event_type: 'burn' | 'pay' | 'mint';  // Type of event: can be 'burn', 'pay', or 'mint'
    data: RabbitMQMessageData;  // Event data corresponding to the event type
    submitted_at: string;  // Timestamp when the message was submitted
    user_id: string;  // User ID associated with the event
    project_id: string;  // Project ID associated with the event
}

/**
 * Union type describing the possible structures of the data in a RabbitMQ message.
 */
type RabbitMQMessageData = BurnData | PayData | MintData;

/**
 * Interface describing the structure of a 'burn' event data.
 */
interface BurnData {
    subscription_id: string;  // Subscription ID that is to be burned
    tier_id: string;  // Tier ID associated with the subscription
    expiry: string;  // Expiry timestamp of the subscription
}

/**
 * Interface describing the structure of a 'pay' event data.
 */
interface PayData {
    subscription_id: string;  // Subscription ID that is to be paid
    payment_option: PaymentOption;  // Payment option details
    tier_id: string;  // Tier ID associated with the subscription
    expiry: string;  // Expiry timestamp of the subscription
    amount: number;  // Amount to be paid
}

/**
 * Interface describing the structure of a 'mint' event data.
 */
interface MintData {
    tier_id: string;  // Tier ID associated with the mint event
    expiry: string;  // Expiry timestamp associated with the mint event
}

/**
 * Interface describing the structure of a payment option.
 */
interface PaymentOption {
    token: string;  // Token identifier for the payment option
    name: string;  // Name of the token
    symbol: string;  // Symbol representing the token
    is_eth: boolean;  // Flag indicating if the token is Ethereum based
}

/**
 * The main function responsible for processing subscription payments. 
 * It consumes messages from the RabbitMQ queue and processes them accordingly.
 */
export async function processSubscriptionPayments() {
    try {
        const connection = await amqplib.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue('subscription-queue');

        channel.consume('subscription-queue', async (msg) => {
            if (msg) {
                const message: RabbitMQMessage = JSON.parse(msg.content.toString());
                if (message.event_type === 'burn') {
                    await handleBurnEvent(message.data as BurnData);
                }
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error processing subscription payments', error);
    }
}

/**
 * Function to handle 'burn' events. 
 * It deletes the subscription associated with the event data from the database.
 * 
 * @param data - The data of the 'burn' event containing subscription details.
 */
export async function handleBurnEvent(data: BurnData) {
    try {
        await prisma.subscription.delete({
            where: { id: data.subscription_id }
        });
    } catch (error) {
        console.error('Error handling burn event', error);
    }
}
processSubscriptionPayments();
