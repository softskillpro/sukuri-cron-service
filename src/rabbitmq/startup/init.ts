import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBIT_MQ;

async function initializeRabbitMQ() {
    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    await channel.assertExchange('dlx-exchange', 'direct');
    
    const primaryQueueOptions = {
        arguments: {
            '': 'dlx-exchange',
        }
    };
    await channel.assertQueue('subscription-queue', primaryQueueOptions);
    
    await channel.close();
    await connection.close();
    
    console.log("RabbitMQ initialization completed.");
}

initializeRabbitMQ().catch(error => {
    console.error('Error setting up RabbitMQ:', error);
    process.exit(1);
});
