import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { logger } from '../../shared/utils/logger';

type SupportChatSender = 'user' | 'admin';

interface SupportChatSendPayload {
  userId?: string;
  content?: string;
  senderId?: string;
  senderName?: string;
  senderRole?: SupportChatSender;
  clientMessageId?: string;
}

interface SupportChatAck {
  success: boolean;
  error?: string;
  messageId?: string;
  clientMessageId?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private livestreamRooms: Map<string, Set<string>>;
  
  constructor(server: HttpServer | HttpsServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST']
      }
    });
    this.livestreamRooms = new Map();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`🔌 Socket connected: ${socket.id}`);

      // Join livestream room
      socket.on('join-livestream', async ({ livestreamId, userId, userName }) => {
        await this.handleJoinLivestream(socket, livestreamId, userId, userName);
      });

      // Send chat message
      socket.on('send-message', async ({ livestreamId, userId, userName, message }) => {
        await this.handleSendMessage(livestreamId, userId, userName, message);
      });

      // Leave livestream room
      socket.on('leave-livestream', ({ livestreamId }) => {
        this.handleLeaveLivestream(socket, livestreamId);
      });

      socket.on('support-chat:join', ({ userId }) => {
        if (!userId) return;
        logger.info(`💬 Support chat join for user ${userId}`);
        socket.join(`support-chat:user:${userId}`);
      });

      socket.on('support-chat:leave', ({ userId }) => {
        if (!userId) return;
        logger.info(`💬 Support chat leave for user ${userId}`);
        socket.leave(`support-chat:user:${userId}`);
      });

      socket.on('support-chat:join-admin', ({ adminId }) => {
        logger.info(`💬 Support chat admin join ${adminId || 'unknown'}`);
        socket.join('support-chat:admins');
        if (adminId) {
          socket.join(`support-chat:admin:${adminId}`);
        }
      });

      socket.on('support-chat:send-message', (payload: SupportChatSendPayload, ack?: (response: SupportChatAck) => void) => {
        this.handleSupportChatMessage(socket, payload, ack);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinLivestream(
    socket: any,
    livestreamId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    logger.info(`👤 User ${userName} (${userId}) joining livestream: ${livestreamId}`);
    socket.join(livestreamId);

    // Track viewers
    if (!this.livestreamRooms.has(livestreamId)) {
      this.livestreamRooms.set(livestreamId, new Set());
    }
    this.livestreamRooms.get(livestreamId)!.add(socket.id);

    const viewerCount = this.livestreamRooms.get(livestreamId)!.size;

      // No persistent storage available for chat history yet
      socket.emit('chat-history', []);

    // Broadcast viewer count update
    this.io.to(livestreamId).emit('viewer-count', { viewerCount });

    // Notify others user joined
    socket.to(livestreamId).emit('user-joined', {
      userName,
      message: `${userName} đã tham gia livestream`
    });
  }

  private async handleSendMessage(
    livestreamId: string,
    userId: string,
    userName: string,
    message: string
  ): Promise<void> {
    logger.info(`💬 Message from ${userName} in ${livestreamId}: ${message}`);

    const timestamp = new Date();
    const chatMessage = {
      id: `${livestreamId}-${timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      userName,
      message,
      timestamp: timestamp.toISOString()
    };

    // Broadcast to all in room including sender
    this.io.to(livestreamId).emit('new-message', chatMessage);
  }

  private handleLeaveLivestream(socket: any, livestreamId: string): void {
    logger.info(`👋 User leaving livestream: ${livestreamId}`);
    socket.leave(livestreamId);

    if (this.livestreamRooms.has(livestreamId)) {
      this.livestreamRooms.get(livestreamId)!.delete(socket.id);
      const viewerCount = this.livestreamRooms.get(livestreamId)!.size;

      // Clean up empty rooms
      if (viewerCount === 0) {
        this.livestreamRooms.delete(livestreamId);
      } else {
        this.io.to(livestreamId).emit('viewer-count', { viewerCount });
      }
    }
  }

  private handleDisconnect(socket: any): void {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);

    // Remove from all rooms and update viewer counts
    this.livestreamRooms.forEach((viewers, livestreamId) => {
      if (viewers.has(socket.id)) {
        viewers.delete(socket.id);
        const viewerCount = viewers.size;

        if (viewerCount === 0) {
          this.livestreamRooms.delete(livestreamId);
        } else {
          this.io.to(livestreamId).emit('viewer-count', { viewerCount });
        }
      }
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  private handleSupportChatMessage(
    _socket: Socket,
    payload: SupportChatSendPayload,
    acknowledge?: (response: SupportChatAck) => void
  ): void {
    const userId = payload.userId?.trim();
    const content = payload.content?.toString().trim();
    const senderRole: SupportChatSender = payload.senderRole ?? 'user';

    if (!userId) {
      logger.warn('⚠️  Support chat message missing userId');
      acknowledge?.({ success: false, error: 'Thiếu mã người dùng', clientMessageId: payload.clientMessageId });
      return;
    }

    if (!content) {
      acknowledge?.({ success: false, error: 'Nội dung trống', clientMessageId: payload.clientMessageId });
      return;
    }

    const messageId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const messagePayload = {
      id: messageId,
      userId,
      senderId: payload.senderId ?? null,
      senderRole,
      senderName: payload.senderName ?? null,
      content,
      createdAt: new Date().toISOString(),
      clientMessageId: payload.clientMessageId
    };

    logger.info(`💬 Support chat message from ${payload.senderName || payload.senderId || senderRole}: ${content}`);

    // Echo to the specific user room and to every admin listener
    this.io.to(`support-chat:user:${userId}`).emit('support-chat:message', messagePayload);
    this.io.to('support-chat:admins').emit('support-chat:message', messagePayload);

    // If the sender is an admin, make sure their personal channel receives the message for syncing
    if (senderRole === 'admin' && payload.senderId) {
      this.io.to(`support-chat:admin:${payload.senderId}`).emit('support-chat:message', messagePayload);
    }

    acknowledge?.({ success: true, messageId, clientMessageId: payload.clientMessageId });
  }
}
