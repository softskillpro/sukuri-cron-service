import { connect } from 'amqplib';

interface EventData {
  project_id: string;
  tier_id?: string;
  quantity?: number;
  payment_option?: {
    token: string;
    name: string;
    symbol: string;
    is_eth: boolean;
  };
  amount?: number;
  timestamp: string;
  additional_data?: any;
}

interface Message {
  event_type: 'burn' | 'pay' | 'mint';
  data: EventData;
  submitted_at: string;
  user_id: string;
  project_id: string;
}

async function sendMessage(message: Message) {
  try {
    //const connection = await connect('amqp://ajones:AjonesPassword1@localhost:5672');
    const connection = await connect('amqps://tbrsxpvd:ZOhjfpDOVDwMGeMCMU-2jgMf2PpG0bbX@albatross.rmq.cloudamqp.com/tbrsxpvd');
    const channel = await connection.createChannel();
    const queue = 'subscription-queue';
    
    await channel.assertQueue(queue, { durable: true });
    
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });

    console.log(`Message sent: ${JSON.stringify(message)}`);
        
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error(`Error sending message: ${error.message}`);
  }
}

const message: Message = {
  event_type: 'pay',
  data: {
    project_id: '12345',
    payment_option: {
      token: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      is_eth: true,
    },
    amount: 100,
    timestamp: new Date().toISOString(),
  },
  submitted_at: new Date().toISOString(),
  user_id: 'user123',
  project_id: 'proj123',
};

sendMessage(message);
