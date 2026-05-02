import { MessagingService } from '../../../src/modules/messaging/messaging.service';
import { MessagingRepository } from '../../../src/modules/messaging/messaging.repository';
import { MessagingMapper } from '../../../src/modules/messaging/dtos/messaging.mapper';
import emailService from '../../../src/shared/abstractions/email/email.service';
import { getMessageNotifyhandler } from '../../../src/sockets/handlers/message.notify';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../src/shared/errors/responseErrors';
import { Types } from 'mongoose';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../../src/modules/messaging/messaging.repository');
jest.mock('../../../src/modules/messaging/dtos/messaging.mapper');
jest.mock('../../../src/shared/abstractions/email/email.service', () => ({
  default: {
    isEmailServiceWorking: jest.fn().mockReturnValue(true),
    sendNewMessageNotification: jest.fn(),
  },
}));
jest.mock('../../../src/sockets/handlers/message.notify', () => ({
  getMessageNotifyhandler: jest.fn(),
}));
jest.mock('../../../src/shared/errors/responseErrors', () => ({
  BadRequestError: jest.fn((msg: string) => new Error(msg)),
  ForbiddenError: jest.fn((msg: string) => new Error(msg)),
  NotFoundError: jest.fn((msg: string) => new Error(msg)),
}));
jest.mock('../../../src/shared/logger/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock('../../../src/shared/logger/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../src/shared/abstractions/email/email.service', () => ({
  __esModule: true,
  default: {
    isEmailServiceWorking: jest.fn().mockReturnValue(true),
    sendNewMessageNotification: jest.fn(),
  },
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const fakeUserId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e1');
const fakeReceiverId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e2');
const fakeChatId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e3');
const fakeMessageId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e4');

const fakeReceiver = {
  _id: fakeReceiverId,
  displayName: 'Receiver',
  email: 'receiver@test.com',
};

const fakeSettings = (overrides = {}) => ({
  privacy: { allowMessagesAnyone: true },
  notifications: { newMessage: { email: false, devices: 'everyone' } },
  ...overrides,
});

const fakeChat = {
  _id: fakeChatId,
  participants: [fakeUserId, fakeReceiverId],
  lastMessage: { _id: fakeMessageId },
};

const fakePopulatedConversation = {
  ...fakeChat,
  lastMessage: { _id: fakeMessageId, content: 'Hello', senderId: fakeUserId },
};

const fakeFollowing = {
  userId: fakeReceiverId,
  followed: [fakeUserId],
};

const fakeMappedSenderResponse = { mapped: 'sender' };
const fakeMappedReceiverResponse = { mapped: 'receiver' };

// ─── Setup ───────────────────────────────────────────────────────────────────

let service: MessagingService;

beforeEach(() => {
  service = new MessagingService();
  jest.clearAllMocks();

  (MessagingMapper.toChatHistorySenderResponse as jest.Mock).mockReturnValue(
    fakeMappedSenderResponse,
  );
  (MessagingMapper.toChatHistoryReceiverResponse as jest.Mock).mockReturnValue(
    fakeMappedReceiverResponse,
  );
  (MessagingMapper.toChatHistoryListResponse as jest.Mock).mockReturnValue([]);
});

// ─────────────────────────────────────────────────────────────────────────────
// sendNewMessage
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : sendNewMessage', () => {
  const newMessageDTO = {
    receiverId: fakeReceiverId.toString(),
    content: 'Hello!',
  };

  beforeEach(() => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([
      fakeReceiver,
      null, // no blocked list
      fakeSettings(),
    ]);
    (
      MessagingRepository.prototype.findArchivedChat as jest.Mock
    ).mockResolvedValue(null);
    (
      MessagingRepository.prototype.createNewChat as jest.Mock
    ).mockResolvedValue(fakePopulatedConversation);
    (MessagingRepository.prototype.findUserById as jest.Mock).mockResolvedValue(
      { displayName: 'Sender' },
    );
    (getMessageNotifyhandler as jest.Mock).mockReturnValue({
      sendMessageNotification: jest.fn(),
    });
  });

  it('should create a new chat and return sender response', async () => {
    const result = await service.sendNewMessage(fakeUserId, newMessageDTO);

    expect(result).toEqual(fakeMappedSenderResponse);
    expect(MessagingRepository.prototype.createNewChat).toHaveBeenCalledWith(
      fakeUserId,
      new Types.ObjectId(newMessageDTO.receiverId),
      newMessageDTO.content,
    );
  });

  it('should activate existing archived chat instead of creating new one', async () => {
    const archivedChat = { _id: fakeChatId };
    (
      MessagingRepository.prototype.findArchivedChat as jest.Mock
    ).mockResolvedValue(archivedChat);
    (MessagingRepository.prototype.activateChat as jest.Mock).mockResolvedValue(
      fakePopulatedConversation,
    );

    const result = await service.sendNewMessage(fakeUserId, newMessageDTO);

    expect(result).toEqual(fakeMappedSenderResponse);
    expect(MessagingRepository.prototype.activateChat).toHaveBeenCalledWith(
      fakeUserId,
      archivedChat._id,
      newMessageDTO.content,
    );
    expect(MessagingRepository.prototype.createNewChat).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when receiver does not exist', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([null, null, null]);

    await expect(
      service.sendNewMessage(fakeUserId, newMessageDTO),
    ).rejects.toThrow("Receiver ID doesn't exists");
    expect(BadRequestError).toHaveBeenCalledWith("Receiver ID doesn't exists");
  });

  it('should throw ForbiddenError when receiver has blocked the sender', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([
      fakeReceiver,
      { blockedIds: [fakeUserId] },
      fakeSettings(),
    ]);

    await expect(
      service.sendNewMessage(fakeUserId, newMessageDTO),
    ).rejects.toThrow('User Blocked You Cannot Send to Him');
    expect(ForbiddenError).toHaveBeenCalledWith(
      'User Blocked You Cannot Send to Him',
    );
  });

  it('should throw ForbiddenError when receiver only allows messages from followed users and sender is not followed', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([
      fakeReceiver,
      null,
      fakeSettings({ privacy: { allowMessagesAnyone: false } }),
    ]);
    (
      MessagingRepository.prototype.findUserFollowedList as jest.Mock
    ).mockResolvedValue({
      followed: [], // sender not in followed list
    });

    await expect(
      service.sendNewMessage(fakeUserId, newMessageDTO),
    ).rejects.toThrow('User Privacy and settings');
  });

  it('should throw ForbiddenError when receiver following list is null and privacy is restricted', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([
      fakeReceiver,
      null,
      fakeSettings({ privacy: { allowMessagesAnyone: false } }),
    ]);
    (
      MessagingRepository.prototype.findUserFollowedList as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.sendNewMessage(fakeUserId, newMessageDTO),
    ).rejects.toThrow('User Privacy and settings');
  });

  it('should send email notification when receiver has email notifications enabled', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([
      fakeReceiver,
      null,
      fakeSettings({
        notifications: { newMessage: { email: true, devices: 'everyone' } },
      }),
    ]);

    await service.sendNewMessage(fakeUserId, newMessageDTO);

    expect(emailService.sendNewMessageNotification).toHaveBeenCalledWith(
      fakeReceiver.email,
      'Sender',
      'https://beatza.me/message',
    );
  });

  it('should NOT send email when receiver has email notifications disabled', async () => {
    await service.sendNewMessage(fakeUserId, newMessageDTO);

    expect(emailService.sendNewMessageNotification).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// archiveChat
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : archiveChat', () => {
  const archiveChatDTO = { chatId: fakeChatId.toString() };

  it('should archive chat successfully', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      fakeChat,
    );
    (MessagingRepository.prototype.archiveChat as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(
      service.archiveChat(fakeUserId, archiveChatDTO),
    ).resolves.not.toThrow();

    expect(MessagingRepository.prototype.archiveChat).toHaveBeenCalledWith(
      fakeUserId,
      new Types.ObjectId(archiveChatDTO.chatId),
    );
  });

  it('should throw NotFoundError when chat does not exist', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      service.archiveChat(fakeUserId, archiveChatDTO),
    ).rejects.toThrow('Chat Not Found');
    expect(NotFoundError).toHaveBeenCalledWith('Chat Not Found');
  });

  it('should throw ForbiddenError when user is not a participant', async () => {
    const outsiderUserId = new Types.ObjectId('000000000000000000000099');
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      fakeChat,
    );

    await expect(
      service.archiveChat(outsiderUserId, archiveChatDTO),
    ).rejects.toThrow('Cannot Delete A Chat User is not a participant in it');
    expect(ForbiddenError).toHaveBeenCalledWith(
      'Cannot Delete A Chat User is not a participant in it',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getChatsHistory
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : getChatsHistory', () => {
  it('should return mapped chats history', async () => {
    const fakeChats = [fakePopulatedConversation];
    (
      MessagingRepository.prototype.getChatsHistory as jest.Mock
    ).mockResolvedValue(fakeChats);
    (MessagingMapper.toChatHistoryListResponse as jest.Mock).mockReturnValue(
      fakeChats,
    );

    const result = await service.getChatsHistory(fakeUserId, 10);

    expect(result).toEqual(fakeChats);
    expect(MessagingRepository.prototype.getChatsHistory).toHaveBeenCalledWith(
      fakeUserId,
      10,
    );
    expect(MessagingMapper.toChatHistoryListResponse).toHaveBeenCalledWith(
      fakeChats,
      fakeUserId,
    );
  });

  it('should pass undefined limit to repository', async () => {
    (
      MessagingRepository.prototype.getChatsHistory as jest.Mock
    ).mockResolvedValue([]);

    await service.getChatsHistory(fakeUserId, undefined);

    expect(MessagingRepository.prototype.getChatsHistory).toHaveBeenCalledWith(
      fakeUserId,
      undefined,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getChatMessages
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : getChatMessages', () => {
  const paginationInfo = { limit: 10 };

  beforeEach(() => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      fakeChat,
    );
    (
      MessagingRepository.prototype.findUserBlockedList as jest.Mock
    ).mockResolvedValue(null);
    (
      MessagingRepository.prototype.getChatMessages as jest.Mock
    ).mockResolvedValue([]);
  });

  it('should return messages and isReceiverBlocked=false when not blocked', async () => {
    const result = await service.getChatMessages(
      fakeUserId,
      fakeChatId,
      paginationInfo,
    );

    expect(result).toEqual({ messages: [], isReceiverBlocked: false });
  });

  it('should return isReceiverBlocked=true when receiver is in blocked list', async () => {
    (
      MessagingRepository.prototype.findUserBlockedList as jest.Mock
    ).mockResolvedValue({
      blockedIds: [fakeReceiverId],
    });

    const result = await service.getChatMessages(
      fakeUserId,
      fakeChatId,
      paginationInfo,
    );

    expect(result?.isReceiverBlocked).toBe(true);
  });

  it('should throw NotFoundError when chat does not exist', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      service.getChatMessages(fakeUserId, fakeChatId, paginationInfo),
    ).rejects.toThrow('Chat Not Found');
  });

  it('should throw ForbiddenError when user is not a participant', async () => {
    const outsider = new Types.ObjectId('000000000000000000000099');

    await expect(
      service.getChatMessages(outsider, fakeChatId, paginationInfo),
    ).rejects.toThrow('Cannot Delete A Chat User is not a participant in it');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markAsRead
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : markAsRead', () => {
  it('should mark all messages in chat as read', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      fakeChat,
    );
    (MessagingRepository.prototype.markAsRead as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(
      service.markAsRead(fakeUserId, fakeChatId),
    ).resolves.not.toThrow();

    expect(MessagingRepository.prototype.markAsRead).toHaveBeenCalledWith(
      fakeUserId,
      fakeChatId,
    );
  });

  it('should throw NotFoundError when chat does not exist', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(service.markAsRead(fakeUserId, fakeChatId)).rejects.toThrow(
      'Chat Not Found',
    );
  });

  it('should throw ForbiddenError when user is not a participant', async () => {
    const outsider = new Types.ObjectId('000000000000000000000099');
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      fakeChat,
    );

    await expect(service.markAsRead(outsider, fakeChatId)).rejects.toThrow(
      'Cannot Delete A Chat User is not a participant in it',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markAsUnRead
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : markAsUnRead', () => {
  it('should mark last message as unread', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      fakeChat,
    );
    (MessagingRepository.prototype.markAsUnRead as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(
      service.markAsUnRead(fakeUserId, fakeChatId),
    ).resolves.not.toThrow();

    expect(MessagingRepository.prototype.markAsUnRead).toHaveBeenCalledWith(
      fakeUserId,
      fakeChat.lastMessage._id,
    );
  });

  it('should throw NotFoundError when chat does not exist', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(service.markAsUnRead(fakeUserId, fakeChatId)).rejects.toThrow(
      'Chat Not Found',
    );
  });

  it('should throw ForbiddenError when user is not a participant', async () => {
    const outsider = new Types.ObjectId('000000000000000000000099');
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      fakeChat,
    );

    await expect(service.markAsUnRead(outsider, fakeChatId)).rejects.toThrow(
      'Cannot Delete A Chat User is not a participant in it',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findChatById
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : findChatById', () => {
  it('should return chat when found', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      fakeChat,
    );

    const result = await service.findChatById(fakeChatId);

    expect(result).toEqual(fakeChat);
  });

  it('should return null when chat not found', async () => {
    (MessagingRepository.prototype.findChatById as jest.Mock).mockResolvedValue(
      null,
    );

    const result = await service.findChatById(fakeChatId);

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sendMessage (socket variant)
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : sendMessage', () => {
  beforeEach(() => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([fakeReceiver, null, fakeSettings()]);
    (MessagingRepository.prototype.sendMessage as jest.Mock).mockResolvedValue(
      fakePopulatedConversation,
    );
  });

  it('should send message and return updated conversation with receiver and settings', async () => {
    const result = await service.sendMessage(
      fakeUserId,
      fakeChat as any,
      'Hello',
    );

    expect(result).toMatchObject({
      updatedConversation: fakeMappedReceiverResponse,
      receiver: fakeReceiver,
    });
    expect(MessagingRepository.prototype.sendMessage).toHaveBeenCalledWith(
      fakeUserId,
      fakeChat._id,
      'Hello',
    );
  });

  it('should return null when receiver does not exist', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([null, null, null]);

    const result = await service.sendMessage(
      fakeUserId,
      fakeChat as any,
      'Hello',
    );

    expect(result).toBeNull();
  });

  it('should return null when receiver has blocked the sender', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([
      fakeReceiver,
      { blockedIds: [fakeUserId] },
      fakeSettings(),
    ]);

    const result = await service.sendMessage(
      fakeUserId,
      fakeChat as any,
      'Hello',
    );

    expect(result).toBeNull();
  });

  it('should return null when privacy is restricted and sender is not followed', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([
      fakeReceiver,
      null,
      fakeSettings({ privacy: { allowMessagesAnyone: false } }),
    ]);
    (
      MessagingRepository.prototype.findUserFollowedList as jest.Mock
    ).mockResolvedValue({
      followed: [],
    });

    const result = await service.sendMessage(
      fakeUserId,
      fakeChat as any,
      'Hello',
    );

    expect(result).toBeNull();
  });

  it('should return null when following list is null and privacy is restricted', async () => {
    (
      MessagingRepository.prototype.findUserDetailedById as jest.Mock
    ).mockResolvedValue([
      fakeReceiver,
      null,
      fakeSettings({ privacy: { allowMessagesAnyone: false } }),
    ]);
    (
      MessagingRepository.prototype.findUserFollowedList as jest.Mock
    ).mockResolvedValue(null);

    const result = await service.sendMessage(
      fakeUserId,
      fakeChat as any,
      'Hello',
    );

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getUserSettings
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : getUserSettings', () => {
  it('should return settings when found', async () => {
    const fakeSettingsObj = fakeSettings();
    (
      MessagingRepository.prototype.getUserSettingsInfo as jest.Mock
    ).mockResolvedValue(fakeSettingsObj);

    const result = await service.getUserSettings(fakeUserId);

    expect(result).toEqual(fakeSettingsObj);
    expect(
      MessagingRepository.prototype.getUserSettingsInfo,
    ).toHaveBeenCalledWith(fakeUserId);
  });

  it('should return null when settings not found', async () => {
    (
      MessagingRepository.prototype.getUserSettingsInfo as jest.Mock
    ).mockResolvedValue(null);

    const result = await service.getUserSettings(fakeUserId);

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// handlePushNotification
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingService : handlePushNotification', () => {
  const fakeUpdatedChat = fakePopulatedConversation as any;
  const mockSendNotification = jest.fn();

  beforeEach(() => {
    (getMessageNotifyhandler as jest.Mock).mockReturnValue({
      sendMessageNotification: mockSendNotification,
    });
    mockSendNotification.mockResolvedValue(undefined);
  });

  it('should send notification when devices setting is "everyone"', async () => {
    await service.handlePushNotification(
      fakeSettings({
        notifications: { newMessage: { email: false, devices: 'everyone' } },
      }) as any,
      fakeUserId,
      fakeReceiverId,
      fakeUpdatedChat,
    );

    expect(mockSendNotification).toHaveBeenCalledWith(
      fakeReceiverId.toString(),
      fakeUpdatedChat,
    );
  });

  it('should NOT send notification when devices setting is "off"', async () => {
    await service.handlePushNotification(
      fakeSettings({
        notifications: { newMessage: { email: false, devices: 'off' } },
      }) as any,
      fakeUserId,
      fakeReceiverId,
      fakeUpdatedChat,
    );

    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('should send notification when devices is "followed" and sender is in followed list', async () => {
    (
      MessagingRepository.prototype.findUserFollowedList as jest.Mock
    ).mockResolvedValue({
      followed: [fakeUserId],
    });

    await service.handlePushNotification(
      fakeSettings({
        notifications: { newMessage: { email: false, devices: 'followed' } },
      }) as any,
      fakeUserId,
      fakeReceiverId,
      fakeUpdatedChat,
    );

    expect(mockSendNotification).toHaveBeenCalled();
  });

  it('should NOT send notification when devices is "followed" and sender is not followed', async () => {
    (
      MessagingRepository.prototype.findUserFollowedList as jest.Mock
    ).mockResolvedValue({
      followed: [],
    });

    await service.handlePushNotification(
      fakeSettings({
        notifications: { newMessage: { email: false, devices: 'followed' } },
      }) as any,
      fakeUserId,
      fakeReceiverId,
      fakeUpdatedChat,
    );

    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('should silently swallow errors from notify handler', async () => {
    (getMessageNotifyhandler as jest.Mock).mockReturnValue(null); // will throw on call

    await expect(
      service.handlePushNotification(
        fakeSettings() as any,
        fakeUserId,
        fakeReceiverId,
        fakeUpdatedChat,
      ),
    ).resolves.not.toThrow();
  });
});
