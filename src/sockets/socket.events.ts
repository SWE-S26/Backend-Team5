export enum SocketEvents {
  TEST_SEND = 'test:send', // client → server
  TEST_RECEIVE = 'test:receive', // server → client

  USER_CONNECTED = 'user:connected',
  USER_DISCONNECTED = 'user:disconnected',

  ERROR = 'error',
}
