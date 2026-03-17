import { Server, Socket } from 'socket.io';
import { SocketEvents } from './socket.events';

export class SocketService {
  private io: Server;

  private userToSocket = new Map<string, string>();
  private socketToUser = new Map<string, string>();

  constructor(io: Server) {
    this.io = io;
  }

  // User Socket registration

  registerUser(userId: string, socketId: string): void {
    this.userToSocket.set(userId, socketId);
    this.socketToUser.set(socketId, userId);
  }

  unregisterSocket(socketId: string): void {
    const userId = this.socketToUser.get(socketId);
    if (userId) this.userToSocket.delete(userId);
    this.socketToUser.delete(socketId);
  }

  getSocketId(userId: string): string | undefined {
    return this.userToSocket.get(userId);
  }

  getUserId(socketId: string): string | undefined {
    return this.socketToUser.get(socketId);
  }

  // if needed for some reason in the future
  get onlineCount(): number {
    return this.userToSocket.size;
  }

  // Emit helpers

  /** Send to one specific socket by its raw socket ID. */
  sendToSocket<T>(socketId: string, event: SocketEvents, data: T): void {
    this.io.to(socketId).emit(event, data);
  }

  /** Send to a user by their userId (resolves socketId internally). */
  sendToUser<T>(userId: string, event: SocketEvents, data: T): boolean {
    const socketId = this.getSocketId(userId);
    if (!socketId) return false;
    this.io.to(socketId).emit(event, data);
    return true;
  }

  /** Broadcast to everyone in a room. */
  sendToRoom<T>(room: string, event: SocketEvents, data: T): void {
    this.io.to(room).emit(event, data);
  }

  /** Broadcast to ALL connected clients. */
  broadcast<T>(event: SocketEvents, data: T): void {
    this.io.emit(event, data);
  }

  /** Send to everyone EXCEPT the sender. */
  broadcastExcept<T>(socket: Socket, event: SocketEvents, data: T): void {
    socket.broadcast.emit(event, data);
  }

  //  Room helpers [i don't think we will need this but never be so sure]

  joinRoom(socket: Socket, room: string): void {
    socket.join(room);
  }

  leaveRoom(socket: Socket, room: string): void {
    socket.leave(room);
  }
}
