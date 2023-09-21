import { expect, test, vi } from 'vitest'
import { handleBurnEvent } from '../src/jobs/processSubscriptionEvents'
import prisma from '../__mocks__/prisma'
import { v4 as uuidv4 } from 'uuid';

vi.mock('../__mocks__/prisma')

test('handleBurnEvent should correctly handle a burn event', async () => {
  const fakeSubscriptionId: string = uuidv4();
  const fakeTierId: string = uuidv4();
  const fakeUserId: string = uuidv4();
  const fakeProjectId: string = uuidv4();

  const fakeBurnData = {
    subscription_id: fakeSubscriptionId,
    tier_id: fakeTierId,
    expiry: new Date().toISOString(),
  };

  prisma.subscription.delete.mockResolvedValue({
    id: fakeSubscriptionId,
    userId: fakeUserId,
    projectId: fakeProjectId,
    tierId: fakeTierId,
    last_processed: new Date(),
    expires: new Date(),
    should_continue: true,
    priority: 1
  });
  
  await handleBurnEvent(fakeBurnData);


  expect(prisma.subscription.delete).toHaveBeenCalledWith({
    where: { id: fakeSubscriptionId },
  });
});
