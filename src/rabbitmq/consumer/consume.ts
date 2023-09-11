import { connect } from 'amqplib';

async function consumeMessage() {
  try {
    //const connection = await connect('amqp://ajones:AjonesPassword1@localhost:5672/vhost');
    const connection = await connect('amqps://tbrsxpvd:ZOhjfpDOVDwMGeMCMU-2jgMf2PpG0bbX@albatross.rmq.cloudamqp.com/tbrsxpvd');
    const channel = await connection.createChannel();
    const queue = 'subscription-queue';
    
    await channel.assertQueue(queue, { durable: true });

    console.log(`Waiting for messages in queue: ${queue}`);
    
    channel.consume(queue, (msg) => {
      if (msg) {
        console.log(`Received message: ${msg.content.toString()}`);        
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error(`Error consuming message: ${error.message}`);
  }
}

consumeMessage();
