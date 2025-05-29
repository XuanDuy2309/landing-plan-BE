import http from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { ConversationsModel } from '../models';

class SocketService {
    private io: Server | null = null;
    private userSocketMap = new Map<number, string>();
    private userTypingMap = new Map<string, NodeJS.Timeout>();
    private activeCallMap = new Map<string, Set<string>>();

    public init(server: http.Server, options?: any) {
        this.io = new Server(server, options);

        this.io.on('connection', (socket: Socket) => {
            // const token: string = socket.handshake.query.auth as string;
            const token: string = socket.handshake.auth.token as string;
            let userId: number | undefined;
            try {
                const payload: any = jwt.verify(token, process.env.JWT_SECRET || '');
                userId = payload.id;
            } catch (err) {
                console.log('Invalid token');
                socket.disconnect();
                return;
            }

            if (userId) {
                this.userSocketMap.set(userId, socket.id);
                console.log(`🔌 User ${userId} connected: ${socket.id}`);
                // Emit user online status
                this.emitToAll('user_status_change', {
                    userId,
                    online: true
                });
            }

            // Join conversation room
            socket.on('join_conversation', (data) => {
                const room = `conversation_${data.id}`;
                socket.join(room);
                const conversation = new ConversationsModel();
                if (userId) { conversation.resetUnreadCount(data.id, userId); }
                console.log(`User ${userId} joined ${room}`);
            });

            // Leave conversation room
            socket.on('leave_conversation', (data) => {
                const room = `conversation_${data.id}`;
                socket.leave(room);
                console.log(`User ${userId} left ${room}`);
            });

            // Handle typing status
            socket.on('typing_start', (data) => {
                if (!userId) return;

                const room = `conversation_${data.id}`;
                const key = `${userId}_${data.id}`;

                // Clear existing timeout if any
                if (this.userTypingMap.has(key)) {
                    clearTimeout(this.userTypingMap.get(key));
                }

                socket.to(room).emit('user_typing', {
                    typer_id: userId,
                    typer_name: data.full_name,
                    conversationId: data.id,
                    isTyping: true
                });

                // Set timeout to automatically stop typing after 3 seconds
                const timeout = setTimeout(() => {
                    socket.to(room).emit('user_typing', {
                        typer_id: userId,
                        typer_name: data.full_name,
                        conversationId: data.id,
                        isTyping: false
                    });
                    this.userTypingMap.delete(key);
                }, 3000);

                this.userTypingMap.set(key, timeout);
            });

            // Handle typing end
            socket.on('typing_end', (data) => {
                if (!userId) return;

                const room = `conversation_${data.id}`;
                const key = `${userId}_${data.id}`;

                // Clear typing timeout
                if (this.userTypingMap.has(key)) {
                    clearTimeout(this.userTypingMap.get(key));
                    this.userTypingMap.delete(key);
                }

                socket.to(room).emit('user_typing', {
                    typer_id: userId,
                    typer_name: data.full_name,
                    conversationId: data.id,
                    isTyping: false
                });
            });

            // Handle message read status
            socket.on('mark_read', (data) => {
                if (!userId) return;

                const room = `conversation_${data.conversationId}`;
                socket.to(room).emit('message_read', {
                    userId,
                    conversationId: data.conversationId,
                    messageIds: data.messageIds
                });
            });

            // Call handling
            socket.on('join_call', (data) => {
                const callRoom = `call_${data.callId}`;
                socket.join(callRoom);

                if (!this.activeCallMap.has(data.callId)) {
                    this.activeCallMap.set(data.callId, new Set());
                }

                this.activeCallMap.get(data.callId)?.add(socket.id);

                // Notify others in the call
                socket.to(callRoom).emit('user_joined_call', {
                    userId,
                    socketId: socket.id
                });
            });

            socket.on('leave_call', (data) => {
                const callRoom = `call_${data.callId}`;
                socket.leave(callRoom);

                this.activeCallMap.get(data.callId)?.delete(socket.id);

                // If no one is left in the call, clean up
                if (this.activeCallMap.get(data.callId)?.size === 0) {
                    this.activeCallMap.delete(data.callId);
                }

                // Notify others in the call
                socket.to(callRoom).emit('user_left_call', {
                    userId,
                    socketId: socket.id
                });
            });

            socket.on('call_signal', (data) => {
                const targetSocket = this.io?.sockets.sockets.get(data.targetId);
                if (targetSocket) {
                    targetSocket.emit('call_signal', {
                        signal: data.signal,
                        from: socket.id
                    });
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`❌ User ${userId} disconnected: ${socket.id}`);
                if (userId) {
                    this.userSocketMap.delete(userId);

                    // Remove from any active calls
                    this.activeCallMap.forEach((participants, callId) => {
                        if (participants.has(socket.id)) {
                            participants.delete(socket.id);
                            // Notify others in the call
                            this.io?.to(`call_${callId}`).emit('user_left_call', {
                                userId,
                                socketId: socket.id
                            });
                        }
                    });

                    // Emit user offline status
                    this.emitToAll('user_status_change', {
                        userId,
                        online: false
                    });
                }
            });
        });
    }

    public emitToUser(userId: number | string, event: string, data: any) {
        if (!this.io) return;
        const socketId = this.userSocketMap.get(Number(userId));
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }

    public emitToConversation(conversationId: string | number, event: string, data: any, excludeUserId?: number) {
        if (!this.io) return;
        const room = `conversation_${conversationId}`;
        if (excludeUserId) {
            const excludeSocketId = this.userSocketMap.get(excludeUserId);
            if (excludeSocketId) {
                this.io.to(room).except(excludeSocketId).emit(event, data);
            }
        } else {
            this.io.to(room).emit(event, data);
        }
    }

    public emitToAll(event: string, data: any) {
        if (!this.io) return;
        this.io.emit(event, data);
    }

    public isUserOnline(userId: number): boolean {
        return this.userSocketMap.has(userId);
    }

    public getIO() {
        return this.io;
    }

    public getCallParticipants(callId: string): string[] {
        return Array.from(this.activeCallMap.get(callId) || []);
    }

    public isCallActive(callId: string): boolean {
        return this.activeCallMap.has(callId) && this.activeCallMap.get(callId)!.size > 0;
    }

    public async notifyMention(mentionedUserId: number, data: any) {
        if (!this.io) return;

        const socketId = this.userSocketMap.get(mentionedUserId);
        if (socketId) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('mentioned', data);

                // Emit typing indicator for better UX
                socket.emit('chat_notification', {
                    type: 'mention',
                    message: `You were mentioned by ${data.mentionedBy.name}`,
                    conversationId: data.conversationId
                });
            }
        }
    }
}

export const socketService = new SocketService();
