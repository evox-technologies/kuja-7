/**
 * Sample ("dummy") profiles have nobody behind them, so the platform answers on
 * their behalf: an interest sent to one comes straight back as a match, and a
 * contact request to one is approved immediately.
 *
 * Requires a local throwaway Postgres — see .env.test.example. Run with
 * `npm run test:integration`.
 */
import {
  PrismaClient,
  ContactRequestStatus,
  InterestStatus,
} from '@prisma/client';
import { MatchesService } from '../src/matches/matches.service';
import { UsersService } from '../src/users/users.service';

const prisma = new PrismaClient();

const notifications = {
  notifyInterestReceived: jest.fn(),
  notifyInterestAccepted: jest.fn(),
};

const matches = new MatchesService(prisma as any, notifications as any);
const users = new UsersService(prisma as any);

let seq = 0;

async function makeUser(tag: string, isDummy = false) {
  seq += 1;
  return prisma.profile.create({
    data: {
      // Sample profiles deliberately have no auth user at all.
      supabaseId: isDummy ? null : `sb-${tag}-${seq}`,
      email: `${tag}-${seq}@test.dev`,
      firstName: tag,
      lastName: 'Tester',
      gender: seq % 2 ? 'MALE' : 'FEMALE',
      dateOfBirth: new Date('1995-01-01'),
      profileCompleted: true,
      isDummy,
      mobileNumber: '+94 771234567',
      whatsappNumber: '+94 771234567',
      address: '1 Test Lane, Colombo',
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

describe('a member sends an interest to a sample profile', () => {
  it('matches both directions immediately', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);

    const mine = await matches.sendInterest(member.id, sample.id);
    expect(mine.status).toBe(InterestStatus.ACCEPTED);

    const theirs = await prisma.interest.findUnique({
      where: {
        senderId_receiverId: { senderId: sample.id, receiverId: member.id },
      },
    });
    expect(theirs?.status).toBe(InterestStatus.ACCEPTED);
  });

  it('opens a conversation', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);

    await matches.sendInterest(member.id, sample.id);

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: member.id, participant2Id: sample.id },
          { participant1Id: sample.id, participant2Id: member.id },
        ],
      },
    });
    expect(conversation).not.toBeNull();
  });

  it('notifies the member that it was accepted, not merely received', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);

    await matches.sendInterest(member.id, sample.id);

    expect(notifications.notifyInterestAccepted).toHaveBeenCalledTimes(1);
    expect(notifications.notifyInterestReceived).not.toHaveBeenCalled();
  });

  it('shows up under mutual interests', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);

    await matches.sendInterest(member.id, sample.id);

    // One entry, not two: both directions are ACCEPTED, and getMutualInterests
    // dedups by partner.
    const mutual = await matches.getMutualInterests(member.id);
    expect(mutual).toHaveLength(1);
    expect(mutual[0].profile.id).toBe(sample.id);
  });

  it('is idempotent — re-sending does not disturb the match', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);

    await matches.sendInterest(member.id, sample.id);
    const again = await matches.sendInterest(member.id, sample.id);

    expect(again.status).toBe(InterestStatus.ACCEPTED);
    expect(await prisma.interest.count()).toBe(2);
    expect(await prisma.conversation.count()).toBe(1);
  });

  it('leaves ordinary members alone — they still start as pending', async () => {
    const member = await makeUser('member');
    const other = await makeUser('other');

    const interest = await matches.sendInterest(member.id, other.id);

    expect(interest.status).toBe(InterestStatus.PENDING);
    expect(notifications.notifyInterestReceived).toHaveBeenCalledTimes(1);
    expect(notifications.notifyInterestAccepted).not.toHaveBeenCalled();
  });
});

describe('a member asks a sample profile for contact details', () => {
  it('is approved on the spot', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);
    await matches.sendInterest(member.id, sample.id);

    const req = await matches.sendContactRequest(member.id, sample.id);

    expect(req.status).toBe(ContactRequestStatus.ACCEPTED);
  });

  it('writes both directions, since contact details are a two-way exchange', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);
    await matches.sendInterest(member.id, sample.id);

    await matches.sendContactRequest(member.id, sample.id);

    const incoming = await prisma.contactRequest.findUnique({
      where: {
        requesterId_targetId: { requesterId: sample.id, targetId: member.id },
      },
    });
    expect(incoming?.status).toBe(ContactRequestStatus.ACCEPTED);
  });

  // The regression this guards: approving only the member's own request leaves
  // users.service.ts hiding the number, so the feature looks broken.
  it('actually reveals the phone number and address', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);
    await matches.sendInterest(member.id, sample.id);
    await matches.sendContactRequest(member.id, sample.id);

    const view = await users.findOne(sample.id, member.id);

    expect(view.mobileNumber).toBe('+94 771234567');
    expect(view.whatsappNumber).toBe('+94 771234567');
    expect(view.address).toBe('1 Test Lane, Colombo');
  });

  it('still hides contact details from a member who never asked', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);
    await matches.sendInterest(member.id, sample.id);

    const view = await users.findOne(sample.id, member.id);

    expect(view.mobileNumber).toBeNull();
    expect(view.address).toBeNull();
  });

  it('still requires a mutual interest first', async () => {
    const member = await makeUser('member');
    const sample = await makeUser('sample', true);

    await expect(
      matches.sendContactRequest(member.id, sample.id),
    ).rejects.toThrow(/mutual interest/i);
  });
});
