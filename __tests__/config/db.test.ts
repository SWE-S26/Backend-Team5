import type {} from 'jest'; // keeps TS happy with jest globals

// These are hoisted by Jest automatically — mocks are always ready
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: { on: jest.fn() },
}));

jest.mock('../../src/shared/logger/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('MongoDB Initialization', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should connect successfully', async () => {
    const mongoose = require('mongoose');
    mongoose.connect.mockResolvedValueOnce({});

    const { intializeDbConnection } = require('../../src/config/db/connect');
    const logger = require('../../src/shared/logger/logger');

    await intializeDbConnection();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('[MongoDB] connected');
  });

  it('should retry if connection fails', async () => {
    const mongoose = require('mongoose');
    mongoose.connect
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({});

    const { intializeDbConnection } = require('../../src/config/db/connect');
    const logger = require('../../src/shared/logger/logger');

    await intializeDbConnection();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('[MongoDB] Initial connection failed'),
    );

    await jest.advanceTimersByTimeAsync(5000);

    expect(mongoose.connect).toHaveBeenCalledTimes(2);
  });

  it('should attempt reconnect on disconnected event', async () => {
    const listeners: Record<string, (...args: unknown[]) => void> = {};

    const mongoose = require('mongoose');
    mongoose.connect.mockResolvedValue({});
    mongoose.connection.on.mockImplementation(
      (event: string, cb: (...args: unknown[]) => void) => {
        listeners[event] = cb;
      },
    );

    require('../../src/config/db/connect');
    const logger = require('../../src/shared/logger/logger');

    listeners['disconnected']();

    expect(logger.warn).toHaveBeenCalledWith(
      '[MongoDB] disconnected. Reconnecting...',
    );

    await jest.advanceTimersByTimeAsync(5000);

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it('should attempt reconnect on disconnected event', async () => {
    const listeners: Record<string, (...args: unknown[]) => void> = {};

    const mongoose = require('mongoose');

    mongoose.connection.on.mockImplementation(
      (event: string, cb: (...args: unknown[]) => void) => {
        listeners[event] = cb;
      },
    );

    require('../../src/config/db/connect'); // triggers connection.on('disconnected', ...) etc.
    const logger = require('../../src/shared/logger/logger');

    listeners['disconnected']();

    expect(logger.warn).toHaveBeenCalledWith(
      '[MongoDB] disconnected. Reconnecting...',
    );

    await jest.advanceTimersByTimeAsync(5000);
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it('should log runtime errors', () => {
    const listeners: Record<string, (...args: unknown[]) => void> = {};

    const mongoose = require('mongoose');
    mongoose.connection.on.mockImplementation(
      (event: string, cb: (...args: unknown[]) => void) => {
        listeners[event] = cb;
      },
    );

    require('../../src/config/db/connect'); // triggers connection.on('disconnected', ...) etc.
    const logger = require('../../src/shared/logger/logger');

    listeners['error'](new Error('runtime failure'));

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('[MongoDB] runtime error'),
    );
  });
});
