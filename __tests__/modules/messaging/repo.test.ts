import { MessagingRepository } from '../../../src/modules/messaging/messaging.repository';
import User from '../../../src/shared/models/models.user';
import BlockedList from '../../../src/shared/models/models.blocked-list';
import Conversation from '../../../src/shared/models/models.conversation';
import Message from '../../../src/shared/models/models.message';
import Settings from '../../../src/shared/models/models.settings';
import Following from '../../../src/shared/models/models.following';
import { Types } from 'mongoose';

jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.blocked-list');
jest.mock('../../../src/shared/models/models.conversation');
jest.mock('../../../src/shared/models/models.message');
jest.mock('../../../src/shared/models/models.settings');
jest.mock('../../../src/shared/models/models.following');

const fakeUserId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e1');
const fakeReceiverId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e2');
const fakeChatId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e3');
const fakeMessageId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e4');

const fakeUser = { _id: fakeUserId, displayName: 'Test User' };
const fakeSettings = { _id: 'settings_1', userId: fakeUserId };
const fakeBlockedList = {
  _id: 'blocked_1',
  blockerId: fakeUserId,
  blockedUsers: [],
};
const fakeConversation = {
  _id: fakeChatId,
  participants: [fakeUserId, fakeReceiverId],
};
const fakeMessage = {
  _id: fakeMessageId,
  chatId: fakeChatId,
  content: 'Hello',
};
const fakeFollowing = { _id: 'following_1', userId: fakeUserId, following: [] };

const fakePopulatedConversation = {
  ...fakeConversation,
  lastMessage: fakeMessage,
};

// Helper to build a chainable mock for Mongoose queries
const chainable = (resolvedValue: any) => {
  const chain: any = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolvedValue),
  };
  return chain;
};

let repo: MessagingRepository;

beforeEach(() => {
  repo = new MessagingRepository();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// getUserSettingsInfo
// ─────────────────────────────────────────────
describe('MessagingRepository : getUserSettingsInfo', () => {
  it('should return settings when found', async () => {
    (Settings.findById as jest.Mock).mockResolvedValue(fakeSettings);

    const result = await repo.getUserSettingsInfo(fakeUserId);

    expect(result).toEqual(fakeSettings);
    expect(Settings.findById).toHaveBeenCalledWith({ userId: fakeUserId });
  });

  it('should return null when settings not found', async () => {
    (Settings.findById as jest.Mock).mockResolvedValue(null);

    const result = await repo.getUserSettingsInfo(fakeUserId);

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// findUserById
// ─────────────────────────────────────────────
describe('MessagingRepository : findUserById', () => {
  it('should return user when found', async () => {
    (User.findById as jest.Mock).mockResolvedValue(fakeUser);

    const result = await repo.findUserById(fakeUserId);

    expect(result).toEqual(fakeUser);
    expect(User.findById).toHaveBeenCalledWith(fakeUserId);
  });

  it('should return null when user not found', async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);

    const result = await repo.findUserById(fakeUserId);

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// findUserDetailedById
// ─────────────────────────────────────────────
describe('MessagingRepository : findUserDetailedById', () => {
  it('should return user, blockedList, and settings', async () => {
    (User.findById as jest.Mock).mockResolvedValue(fakeUser);
    (BlockedList.findOne as jest.Mock).mockResolvedValue(fakeBlockedList);
    (Settings.findOne as jest.Mock).mockResolvedValue(fakeSettings);

    const result = await repo.findUserDetailedById(fakeUserId);

    expect(result).toEqual([fakeUser, fakeBlockedList, fakeSettings]);
  });

  it('should return nulls when nothing found', async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);
    (BlockedList.findOne as jest.Mock).mockResolvedValue(null);
    (Settings.findOne as jest.Mock).mockResolvedValue(null);

    const result = await repo.findUserDetailedById(fakeUserId);

    expect(result).toEqual([null, null, null]);
  });
});

// ─────────────────────────────────────────────
// findUserBlockedList
// ─────────────────────────────────────────────
describe('MessagingRepository : findUserBlockedList', () => {
  it('should return blocked list when found', async () => {
    (BlockedList.findOne as jest.Mock).mockResolvedValue(fakeBlockedList);

    const result = await repo.findUserBlockedList(fakeUserId);

    expect(result).toEqual(fakeBlockedList);
    expect(BlockedList.findOne).toHaveBeenCalledWith({ blockerId: fakeUserId });
  });

  it('should return null when not found', async () => {
    (BlockedList.findOne as jest.Mock).mockResolvedValue(null);

    const result = await repo.findUserBlockedList(fakeUserId);

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// findChatById
// ─────────────────────────────────────────────
describe('MessagingRepository : findChatById', () => {
  it('should return conversation when found', async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(fakeConversation);

    const result = await repo.findChatById(fakeChatId);

    expect(result).toEqual(fakeConversation);
    expect(Conversation.findById).toHaveBeenCalledWith(fakeChatId);
  });

  it('should return null when not found', async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(null);

    const result = await repo.findChatById(fakeChatId);

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// findArchivedChat
// ─────────────────────────────────────────────
describe('MessagingRepository : findArchivedChat', () => {
  it('should return conversation when found', async () => {
    (Conversation.findOne as jest.Mock).mockResolvedValue(fakeConversation);

    const result = await repo.findArchivedChat(fakeUserId, fakeReceiverId);

    expect(result).toEqual(fakeConversation);
    expect(Conversation.findOne).toHaveBeenCalledWith({
      participants: { $all: [fakeUserId, fakeReceiverId] },
    });
  });

  it('should return null when no archived chat found', async () => {
    (Conversation.findOne as jest.Mock).mockResolvedValue(null);

    const result = await repo.findArchivedChat(fakeUserId, fakeReceiverId);

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// archiveChat
// ─────────────────────────────────────────────
describe('MessagingRepository : archiveChat', () => {
  it('should return updated conversation after archiving', async () => {
    const archived = { ...fakeConversation, archivedBy: [fakeUserId] };
    (Conversation.findOneAndUpdate as jest.Mock).mockResolvedValue(archived);

    const result = await repo.archiveChat(fakeUserId, fakeChatId);

    expect(result).toEqual(archived);
    expect(Conversation.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: fakeChatId },
      { $addToSet: { archivedBy: fakeUserId } },
      { returnDocument: 'after' },
    );
  });

  it('should return null when chat not found', async () => {
    (Conversation.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    const result = await repo.archiveChat(fakeUserId, fakeChatId);

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// createNewChat
// ─────────────────────────────────────────────
describe('MessagingRepository : createNewChat', () => {
  it('should create conversation and message, return populated conversation', async () => {
    (Conversation.create as jest.Mock).mockResolvedValue(fakeConversation);
    (Message.create as jest.Mock).mockResolvedValue(fakeMessage);

    const chain = chainable(fakePopulatedConversation);
    (Conversation.findByIdAndUpdate as jest.Mock).mockReturnValue(chain);

    const result = await repo.createNewChat(
      fakeUserId,
      fakeReceiverId,
      'Hello',
    );

    expect(result).toEqual(fakePopulatedConversation);
    expect(Conversation.create).toHaveBeenCalledWith({
      participants: [fakeUserId, fakeReceiverId],
    });
    expect(Message.create).toHaveBeenCalledWith({
      chatId: fakeConversation._id,
      senderId: fakeUserId,
      content: 'Hello',
      seenBy: [fakeUserId],
    });
  });

  it('should return null when update returns null', async () => {
    (Conversation.create as jest.Mock).mockResolvedValue(fakeConversation);
    (Message.create as jest.Mock).mockResolvedValue(fakeMessage);

    const chain = chainable(null);
    (Conversation.findByIdAndUpdate as jest.Mock).mockReturnValue(chain);

    const result = await repo.createNewChat(
      fakeUserId,
      fakeReceiverId,
      'Hello',
    );

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// activateChat
// ─────────────────────────────────────────────
describe('MessagingRepository : activateChat', () => {
  it('should create message and unarchive conversation', async () => {
    (Message.create as jest.Mock).mockResolvedValue(fakeMessage);

    const chain = chainable(fakePopulatedConversation);
    (Conversation.findOneAndUpdate as jest.Mock).mockReturnValue(chain);

    const result = await repo.activateChat(fakeUserId, fakeChatId, 'Hey');

    expect(result).toEqual(fakePopulatedConversation);
    expect(Message.create).toHaveBeenCalledWith({
      chatId: fakeChatId,
      senderId: fakeUserId,
      content: 'Hey',
      seenBy: [fakeUserId],
    });
  });

  it('should return null when conversation not found', async () => {
    (Message.create as jest.Mock).mockResolvedValue(fakeMessage);

    const chain = chainable(null);
    (Conversation.findOneAndUpdate as jest.Mock).mockReturnValue(chain);

    const result = await repo.activateChat(fakeUserId, fakeChatId, 'Hey');

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// getChatsHistory
// ─────────────────────────────────────────────
describe('MessagingRepository : getChatsHistory', () => {
  it('should return all chats when limit is undefined', async () => {
    const chain = chainable([fakePopulatedConversation]);
    (Conversation.find as jest.Mock).mockReturnValue(chain);

    const result = await repo.getChatsHistory(fakeUserId, undefined);

    expect(result).toEqual([fakePopulatedConversation]);
    expect(chain.limit).not.toHaveBeenCalled();
  });

  it('should apply limit when provided', async () => {
    const chain = chainable([fakePopulatedConversation]);
    (Conversation.find as jest.Mock).mockReturnValue(chain);

    const result = await repo.getChatsHistory(fakeUserId, 5);

    expect(result).toEqual([fakePopulatedConversation]);
    expect(chain.limit).toHaveBeenCalledWith(5);
  });
});

// ─────────────────────────────────────────────
// getChatMessages
// ─────────────────────────────────────────────
describe('MessagingRepository : getChatMessages', () => {
  it('should query with cursor when "before" is provided', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([fakeMessage]),
    };
    (Message.find as jest.Mock).mockReturnValue(chain);

    const result = await repo.getChatMessages(fakeChatId, {
      before: fakeMessageId,
      limit: 10,
    });

    expect(result).toEqual([fakeMessage]);
    expect(Message.find).toHaveBeenCalledWith({
      chatId: fakeChatId,
      _id: { $lt: fakeMessageId },
    });
  });

  it('should query without cursor when "before" is not provided', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([fakeMessage]),
    };
    (Message.find as jest.Mock).mockReturnValue(chain);

    const result = await repo.getChatMessages(fakeChatId, { limit: 10 });

    expect(result).toEqual([fakeMessage]);
    expect(Message.find).toHaveBeenCalledWith({ chatId: fakeChatId });
  });
});

// ─────────────────────────────────────────────
// markAsRead
// ─────────────────────────────────────────────
describe('MessagingRepository : markAsRead', () => {
  it('should call updateMany with correct query', async () => {
    (Message.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 });

    await repo.markAsRead(fakeUserId, fakeChatId);

    expect(Message.updateMany).toHaveBeenCalledWith(
      { chatId: fakeChatId, seenBy: { $ne: fakeUserId } },
      { $addToSet: { seenBy: fakeUserId } },
    );
  });
});

// ─────────────────────────────────────────────
// markAsUnRead
// ─────────────────────────────────────────────
describe('MessagingRepository : markAsUnRead', () => {
  it('should call updateMany with correct query', async () => {
    (Message.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

    await repo.markAsUnRead(fakeUserId, fakeMessageId);

    expect(Message.updateMany).toHaveBeenCalledWith(
      { _id: fakeMessageId },
      { $pull: { seenBy: fakeUserId } },
    );
  });
});

// ─────────────────────────────────────────────
// sendMessage
// ─────────────────────────────────────────────
describe('MessagingRepository : sendMessage', () => {
  it('should create message and return updated conversation', async () => {
    (Message.create as jest.Mock).mockResolvedValue(fakeMessage);

    const chain = chainable(fakePopulatedConversation);
    (Conversation.findOneAndUpdate as jest.Mock).mockReturnValue(chain);

    const result = await repo.sendMessage(fakeUserId, fakeChatId, 'Hello');

    expect(result).toEqual(fakePopulatedConversation);
    expect(Message.create).toHaveBeenCalledWith({
      chatId: fakeChatId,
      senderId: fakeUserId,
      content: 'Hello',
      seenBy: [fakeUserId],
    });
    expect(Conversation.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: fakeChatId },
      { $set: { lastMessage: fakeMessage._id, archivedBy: [] } },
      { returnDocument: 'after' },
    );
  });

  it('should return null when conversation not found', async () => {
    (Message.create as jest.Mock).mockResolvedValue(fakeMessage);

    const chain = chainable(null);
    (Conversation.findOneAndUpdate as jest.Mock).mockReturnValue(chain);

    const result = await repo.sendMessage(fakeUserId, fakeChatId, 'Hello');

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// findUserFollowedList
// ─────────────────────────────────────────────
describe('MessagingRepository : findUserFollowedList', () => {
  it('should return following list when found', async () => {
    (Following.findOne as jest.Mock).mockResolvedValue(fakeFollowing);

    const result = await repo.findUserFollowedList(fakeUserId);

    expect(result).toEqual(fakeFollowing);
    expect(Following.findOne).toHaveBeenCalledWith({ userId: fakeUserId });
  });

  it('should return null when not found', async () => {
    (Following.findOne as jest.Mock).mockResolvedValue(null);

    const result = await repo.findUserFollowedList(fakeUserId);

    expect(result).toBeNull();
  });
});
