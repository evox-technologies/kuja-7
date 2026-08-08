/**
 * Covers the send-interest → received → approve → mutual flow end to end.
 *
 * Requires a local throwaway Postgres — see .env.test.example. Run with
 * `npm run test:integration`.
 */
import { PrismaClient, InterestStatus } from '@prisma/client';
import { MatchesService } from '../src/matches/matches.service';
import { UsersService } from '../src/users/users.service';
import { ChatService } from '../src/chat/chat.service';

const prisma = new PrismaClient();

const notifications = {
  notifyInterestReceived: jest.fn(),
  notifyInterestAccepted: jest.fn(),
};

const matches = new MatchesService(prisma as any, notifications as any);
const users = new UsersService(prisma as any);
const chat = new ChatService(prisma as any);

let seq = 0;

async function makeUser(tag: string) {
  seq += 1;
  return prisma.profile.create({
    data: {
      supabaseId: `sb-${tag}-${seq}`,
      email: `${tag}-${seq}@test.dev`,
      firstName: tag,
      lastName: 'Tester',
      gender: seq % 2 ? 'MALE' : 'FEMALE',
      dateOfBirth: new Date('1995-01-01'),
      profileCompleted: true,
    },
  });
}

async function reset() {
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.profile.deleteMany();
}

beforeEach(async () => {
  jest.clearAllMocks();
  await reset();
});

afterAll(async () => {
  await reset();
  await prisma.$disconnect();
});

describe('A sends an interest and B approves it', () => {
  it("shows the interest in B's received list", async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    await matches.sendInterest(A.id, B.id);

    const received = await matches.getReceivedInterests(B.id);
    expect(received.map((i) => i.sender.id)).toEqual([A.id]);
  });

  it('notifies B that an interest arrived', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    await matches.sendInterest(A.id, B.id);

    expect(notifications.notifyInterestReceived).toHaveBeenCalledWith(
      B.id,
      A.id,
      expect.any(String),
    );
  });

  it("puts B in A's mutual list once approved", async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    const mutual = await matches.getMutualInterests(A.id);
    expect(mutual.map((m) => m.profile.id)).toEqual([B.id]);
  });

  it("puts A in B's mutual list once approved", async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    const mutual = await matches.getMutualInterests(B.id);
    expect(mutual.map((m) => m.profile.id)).toEqual([A.id]);
  });

  it("drops the interest out of B's pending received list", async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    expect(await matches.getReceivedInterests(B.id)).toHaveLength(0);
  });

  it('reports isMutual on the profile detail for both users', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    type WithRelationship = { _relationship: { isMutual: boolean } };
    const seenByA = (await users.findOne(B.id, A.id)) as WithRelationship;
    const seenByB = (await users.findOne(A.id, B.id)) as WithRelationship;

    expect(seenByA._relationship.isMutual).toBe(true);
    expect(seenByB._relationship.isMutual).toBe(true);
  });

  it('allows a contact request in both directions', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    await expect(matches.sendContactRequest(A.id, B.id)).resolves.toBeDefined();
    await expect(matches.sendContactRequest(B.id, A.id)).resolves.toBeDefined();
  });

  it('creates exactly one conversation', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    expect(await prisma.conversation.count()).toBe(1);
  });

  it('notifies A that the interest was accepted', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    expect(notifications.notifyInterestAccepted).toHaveBeenCalledWith(
      A.id,
      B.id,
      interest.id,
    );
  });
});

describe('B declines the interest', () => {
  it('keeps the pair out of both mutual lists', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.REJECTED);

    expect(await matches.getMutualInterests(A.id)).toHaveLength(0);
    expect(await matches.getMutualInterests(B.id)).toHaveLength(0);
  });

  it("lets A send the interest again, landing back in B's received list", async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.REJECTED);

    await matches.sendInterest(A.id, B.id);

    const received = await matches.getReceivedInterests(B.id);
    expect(received.map((i) => i.sender.id)).toEqual([A.id]);
  });

  it('blocks a contact request', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.REJECTED);

    await expect(matches.sendContactRequest(A.id, B.id)).rejects.toThrow(
      /mutual interest/i,
    );
  });
});

describe('both users send an interest independently', () => {
  it('matches them without either pressing accept', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    await matches.sendInterest(A.id, B.id);
    await matches.sendInterest(B.id, A.id);

    expect(
      (await matches.getMutualInterests(A.id)).map((m) => m.profile.id),
    ).toEqual([B.id]);
    expect(
      (await matches.getMutualInterests(B.id)).map((m) => m.profile.id),
    ).toEqual([A.id]);
  });

  it('lists the partner once, not twice, despite two accepted rows', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    await matches.sendInterest(A.id, B.id);
    await matches.sendInterest(B.id, A.id);

    expect(await prisma.interest.count()).toBe(2);
    expect(await matches.getMutualInterests(A.id)).toHaveLength(1);
  });

  it('creates exactly one conversation', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    await matches.sendInterest(A.id, B.id);
    await matches.sendInterest(B.id, A.id);

    expect(await prisma.conversation.count()).toBe(1);
  });
});

describe('guards against corrupting an existing match', () => {
  it('does not downgrade an accepted interest when it is sent again', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    await matches.sendInterest(A.id, B.id);

    const row = await prisma.interest.findUnique({
      where: { id: interest.id },
    });
    expect(row?.status).toBe(InterestStatus.ACCEPTED);
    expect(await matches.getMutualInterests(A.id)).toHaveLength(1);
  });

  it('rejects a second response to an already answered interest', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    await expect(
      matches.respondToInterest(interest.id, B.id, InterestStatus.REJECTED),
    ).rejects.toThrow(/already/i);
  });

  it('rejects an attempt to move an interest back to pending', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    const interest = await matches.sendInterest(A.id, B.id);

    await expect(
      matches.respondToInterest(interest.id, B.id, InterestStatus.PENDING),
    ).rejects.toThrow();
  });

  it('rejects a response from someone who is not the receiver', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');
    const C = await makeUser('Carl');

    const interest = await matches.sendInterest(A.id, B.id);

    await expect(
      matches.respondToInterest(interest.id, C.id, InterestStatus.ACCEPTED),
    ).rejects.toThrow(/not found/i);
  });

  it('reuses a conversation the chat module already created in reverse order', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    await chat.getOrCreateConversation(B.id, A.id);

    const interest = await matches.sendInterest(A.id, B.id);
    await matches.respondToInterest(interest.id, B.id, InterestStatus.ACCEPTED);

    expect(await prisma.conversation.count()).toBe(1);
  });

  it('reuses the conversation on the auto-match path too', async () => {
    const A = await makeUser('Alice');
    const B = await makeUser('Bob');

    await chat.getOrCreateConversation(A.id, B.id);

    await matches.sendInterest(B.id, A.id);
    await matches.sendInterest(A.id, B.id);

    expect(await prisma.conversation.count()).toBe(1);
  });
});
