/**
 * Delivery-target tests for the chat gateway.
 *
 * Conversation rooms are only joined in handleConnection, so a participant who
 * was already online when the conversation was created is never in its room and
 * silently misses every `new_message`. Both broadcasts must therefore target the
 * per-user rooms (`user:<id>`), which every socket joins on connect.
 */
import { ChatGateway } from './chat.gateway';
import type { AuthenticatedSocket } from './chat.types';

interface Emission {
  rooms: string[];
  event: string;
  payload: unknown;
}

function makeServer() {
  const emissions: Emission[] = [];

  const server = {
    to(room: string) {
      const rooms = [room];
      const op = {
        to(next: string) {
          rooms.push(next);
          return op;
        },
        emit(event: string, payload: unknown) {
          emissions.push({ rooms: [...rooms], event, payload });
          return true;
        },
      };
      return op;
    },
  };

  return { server, emissions };
}

const SENDER = 'sender-id';
const RECIPIENT = 'recipient-id';
const CONVERSATION = 'conversation-id';

const conversation = {
  id: CONVERSATION,
  participant1Id: SENDER,
  participant2Id: RECIPIENT,
};

function makeGateway() {
  const prisma = {
    conversation: {
      findFirst: jest.fn().mockResolvedValue(conversation),
      update: jest.fn().mockResolvedValue(conversation),
    },
    message: {
      create: jest.fn().mockResolvedValue({
        id: 'message-id',
        conversationId: CONVERSATION,
        senderId: SENDER,
        content: 'hello',
        createdAt: new Date(),
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  };

  const gateway = new ChatGateway(prisma as never, {} as never);
  const { server, emissions } = makeServer();
  gateway.server = server as never;

  return { gateway, prisma, emissions };
}

function clientFor(profileId: string) {
  return { profile: { id: profileId } } as unknown as AuthenticatedSocket;
}

describe('ChatGateway delivery targets', () => {
  describe('send_message', () => {
    it('broadcasts new_message to both participants by user room', async () => {
      const { gateway, emissions } = makeGateway();

      await gateway.handleSendMessage(clientFor(SENDER), {
        conversationId: CONVERSATION,
        content: 'hello',
      });

      const emission = emissions.find((e) => e.event === 'new_message');
      expect(emission).toBeDefined();
      expect(emission!.rooms.sort()).toEqual(
        [`user:${SENDER}`, `user:${RECIPIENT}`].sort(),
      );
    });

    it('does not depend on conversation-room membership', async () => {
      const { gateway, emissions } = makeGateway();

      await gateway.handleSendMessage(clientFor(SENDER), {
        conversationId: CONVERSATION,
        content: 'hello',
      });

      const emission = emissions.find((e) => e.event === 'new_message');
      expect(emission!.rooms).not.toContain(CONVERSATION);
    });
  });

  describe('mark_read', () => {
    it('broadcasts messages_read to both participants by user room', async () => {
      const { gateway, emissions } = makeGateway();

      await gateway.handleMarkRead(clientFor(RECIPIENT), {
        conversationId: CONVERSATION,
      });

      const emission = emissions.find((e) => e.event === 'messages_read');
      expect(emission).toBeDefined();
      expect(emission!.rooms.sort()).toEqual(
        [`user:${SENDER}`, `user:${RECIPIENT}`].sort(),
      );
      expect(emission!.payload).toEqual({
        conversationId: CONVERSATION,
        readBy: RECIPIENT,
      });
    });

    it('reaches the reader so their own unread badge refreshes', async () => {
      const { gateway, emissions } = makeGateway();

      await gateway.handleMarkRead(clientFor(RECIPIENT), {
        conversationId: CONVERSATION,
      });

      const emission = emissions.find((e) => e.event === 'messages_read');
      expect(emission!.rooms).toContain(`user:${RECIPIENT}`);
    });
  });
});
