export enum SocketEvents {
  TEST_SEND = 'test:send', // client → server
  TEST_RECEIVE = 'test:receive', // server → client
  NOTIFICATION_RECEIVE = 'notification:receive', // server → client

  USER_CONNECTED = 'user:connected',
  USER_DISCONNECTED = 'user:disconnected',

  ERROR = 'error',
  JOIN_CHAT = 'chat:join',
  LEAVE_CHAT = 'chat:leave',
  SEND_MSG = 'message:send',
  MSG_NOTIFY = 'message:notify',
}
