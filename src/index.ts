import cron from 'node-cron';
import express from 'express';

import testScheduler from './jobs/testScheduler';

import { config } from 'dotenv';
config();

const app = express();

cron.schedule('*/30 * * * * *', async () => testScheduler());


app.listen(process.env.PORT, () => {
    console.log(`Sukuri Scheduler Started... Running on ${process.env.PORT}`);
});