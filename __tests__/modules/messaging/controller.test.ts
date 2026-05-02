import { MessagingController } from '../../../src/modules/messaging/messaging.controller';
import { MessagingService } from '../../../src/modules/messaging/messaging.service';
import { parseRequest } from '../../../src/shared/dtos/requestParser';
import { Types } from 'mongoose';
import { Request, Response } from 'express';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../../src/modules/messaging/messaging.service');
jest.mock('../../../src/shared/dtos/requestParser');

// ─── Fixtures ────────────────────────────────────────────────────────────────

const fakeUserId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e1');
const fakeChatId = new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e3');

const fakeUserInfo = {
  _id: fakeUserId.toString(),
  role: 'user',
  paymentInfo: null,
};

const mockReq = (overrides = {}): Partial<Request> => ({
  userInfo: fakeUserInfo,
  ...overrides,
});

const mockRes = (): { json: jest.Mock } => ({
  json: jest.fn(),
});

const fakeValidRequest = (data: object) => ({
  success: true,
  data,
});

const fakeInvalidRequest = (error: Error) => ({
  success: false,
  error,
});

let controller: MessagingController;

beforeEach(() => {
  controller = new MessagingController();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// sendNewMessage
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingController : sendNewMessage', () => {
  const fakeBody = { receiverId: fakeUserId.toString(), content: 'Hello!' };
  const fakeSenderResponse = { mapped: 'sender' };

  it('should send message and return 200 with data', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ body: fakeBody }),
    );
    (MessagingService.prototype.sendNewMessage as jest.Mock).mockResolvedValue(
      fakeSenderResponse,
    );

    const req = mockReq();
    const res = mockRes();

    await controller.sendNewMessage(req as Request, res as unknown as Response);

    expect(MessagingService.prototype.sendNewMessage).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      fakeBody,
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'message sent sucessfully',
      data: fakeSenderResponse,
    });
  });

  it('should throw when request validation fails', async () => {
    const validationError = new Error('Validation failed');
    (parseRequest as jest.Mock).mockReturnValue(
      fakeInvalidRequest(validationError),
    );

    const req = mockReq();
    const res = mockRes();

    await expect(
      controller.sendNewMessage(req as Request, res as unknown as Response),
    ).rejects.toThrow('Validation failed');

    expect(MessagingService.prototype.sendNewMessage).not.toHaveBeenCalled();
  });

  it('should propagate service errors', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ body: fakeBody }),
    );
    (MessagingService.prototype.sendNewMessage as jest.Mock).mockRejectedValue(
      new Error('Receiver not found'),
    );

    const req = mockReq();
    const res = mockRes();

    await expect(
      controller.sendNewMessage(req as Request, res as unknown as Response),
    ).rejects.toThrow('Receiver not found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// archiveChat
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingController : archiveChat', () => {
  const fakeBody = { chatId: fakeChatId.toString() };

  it('should archive chat and return success message', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ body: fakeBody }),
    );
    (MessagingService.prototype.archiveChat as jest.Mock).mockResolvedValue(
      undefined,
    );

    const req = mockReq();
    const res = mockRes();

    await controller.archiveChat(req as Request, res as unknown as Response);

    expect(MessagingService.prototype.archiveChat).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      fakeBody,
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Chat Archived Successfully',
    });
  });

  it('should throw when request validation fails', async () => {
    const validationError = new Error('Validation failed');
    (parseRequest as jest.Mock).mockReturnValue(
      fakeInvalidRequest(validationError),
    );

    const req = mockReq();
    const res = mockRes();

    await expect(
      controller.archiveChat(req as Request, res as unknown as Response),
    ).rejects.toThrow('Validation failed');

    expect(MessagingService.prototype.archiveChat).not.toHaveBeenCalled();
  });

  it('should propagate service errors', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ body: fakeBody }),
    );
    (MessagingService.prototype.archiveChat as jest.Mock).mockRejectedValue(
      new Error('Chat Not Found'),
    );

    const req = mockReq();
    const res = mockRes();

    await expect(
      controller.archiveChat(req as Request, res as unknown as Response),
    ).rejects.toThrow('Chat Not Found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getChatsHistory
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingController : getChatsHistory', () => {
  const fakeChats = [{ _id: fakeChatId }];

  it('should return chats history with limit', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ query: { limit: 10 } }),
    );
    (MessagingService.prototype.getChatsHistory as jest.Mock).mockResolvedValue(
      fakeChats,
    );

    const req = mockReq();
    const res = mockRes();

    await controller.getChatsHistory(
      req as Request,
      res as unknown as Response,
    );

    expect(MessagingService.prototype.getChatsHistory).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      10,
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Chat History Retrieved Successfully',
      data: fakeChats,
    });
  });

  it('should pass undefined limit when not provided', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ query: { limit: undefined } }),
    );
    (MessagingService.prototype.getChatsHistory as jest.Mock).mockResolvedValue(
      [],
    );

    const req = mockReq();
    const res = mockRes();

    await controller.getChatsHistory(
      req as Request,
      res as unknown as Response,
    );

    expect(MessagingService.prototype.getChatsHistory).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      undefined,
    );
  });

  it('should throw when request validation fails', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeInvalidRequest(new Error('Bad query')),
    );

    await expect(
      controller.getChatsHistory(
        mockReq() as Request,
        mockRes() as unknown as Response,
      ),
    ).rejects.toThrow('Bad query');

    expect(MessagingService.prototype.getChatsHistory).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getChatMessages
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingController : getChatMessages', () => {
  const fakePagination = { limit: 10, before: undefined };
  const fakeMessages = { messages: [], isReceiverBlocked: false };

  it('should return chat messages', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({
        query: fakePagination,
        params: { id: fakeChatId.toString() },
      }),
    );
    (MessagingService.prototype.getChatMessages as jest.Mock).mockResolvedValue(
      fakeMessages,
    );

    const req = mockReq();
    const res = mockRes();

    await controller.getChatMessages(
      req as Request,
      res as unknown as Response,
    );

    expect(MessagingService.prototype.getChatMessages).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      expect.any(Types.ObjectId),
      fakePagination,
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Chat Messages Retrieved Successfully',
      data: fakeMessages,
    });
  });

  it('should throw when request validation fails', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeInvalidRequest(new Error('Bad params')),
    );

    await expect(
      controller.getChatMessages(
        mockReq() as Request,
        mockRes() as unknown as Response,
      ),
    ).rejects.toThrow('Bad params');

    expect(MessagingService.prototype.getChatMessages).not.toHaveBeenCalled();
  });

  it('should propagate service errors', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({
        query: fakePagination,
        params: { id: fakeChatId.toString() },
      }),
    );
    (MessagingService.prototype.getChatMessages as jest.Mock).mockRejectedValue(
      new Error('Chat Not Found'),
    );

    await expect(
      controller.getChatMessages(
        mockReq() as Request,
        mockRes() as unknown as Response,
      ),
    ).rejects.toThrow('Chat Not Found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markAsRead
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingController : markAsRead', () => {
  const fakeBody = { id: fakeChatId.toString() };

  it('should mark chat as read and return success', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ body: fakeBody }),
    );
    (MessagingService.prototype.markAsRead as jest.Mock).mockResolvedValue(
      undefined,
    );

    const req = mockReq();
    const res = mockRes();

    await controller.markAsRead(req as Request, res as unknown as Response);

    expect(MessagingService.prototype.markAsRead).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      expect.any(Types.ObjectId),
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Marked As read Successfully',
    });
  });

  it('should throw when request validation fails', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeInvalidRequest(new Error('Bad body')),
    );

    await expect(
      controller.markAsRead(
        mockReq() as Request,
        mockRes() as unknown as Response,
      ),
    ).rejects.toThrow('Bad body');

    expect(MessagingService.prototype.markAsRead).not.toHaveBeenCalled();
  });

  it('should propagate service errors', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ body: fakeBody }),
    );
    (MessagingService.prototype.markAsRead as jest.Mock).mockRejectedValue(
      new Error('Chat Not Found'),
    );

    await expect(
      controller.markAsRead(
        mockReq() as Request,
        mockRes() as unknown as Response,
      ),
    ).rejects.toThrow('Chat Not Found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markAsUnRead
// ─────────────────────────────────────────────────────────────────────────────

describe('MessagingController : markAsUnRead', () => {
  const fakeBody = { id: fakeChatId.toString() };

  it('should mark chat as unread and return success', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ body: fakeBody }),
    );
    (MessagingService.prototype.markAsUnRead as jest.Mock).mockResolvedValue(
      undefined,
    );

    const req = mockReq();
    const res = mockRes();

    await controller.markAsUnRead(req as Request, res as unknown as Response);

    expect(MessagingService.prototype.markAsUnRead).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      expect.any(Types.ObjectId),
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Marked As Unread Successfully',
    });
  });

  it('should throw when request validation fails', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeInvalidRequest(new Error('Bad body')),
    );

    await expect(
      controller.markAsUnRead(
        mockReq() as Request,
        mockRes() as unknown as Response,
      ),
    ).rejects.toThrow('Bad body');

    expect(MessagingService.prototype.markAsUnRead).not.toHaveBeenCalled();
  });

  it('should propagate service errors', async () => {
    (parseRequest as jest.Mock).mockReturnValue(
      fakeValidRequest({ body: fakeBody }),
    );
    (MessagingService.prototype.markAsUnRead as jest.Mock).mockRejectedValue(
      new Error('Chat Not Found'),
    );

    await expect(
      controller.markAsUnRead(
        mockReq() as Request,
        mockRes() as unknown as Response,
      ),
    ).rejects.toThrow('Chat Not Found');
  });
});
