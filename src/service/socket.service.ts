import http from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

class SocketService {
    private io: Server | null = null;
    private userSocketMap = new Map<number, string>();

    public init(server: http.Server) {
        this.io = new Server(server, {
            cors: {
                origin: 'http://localhost:5173',
                credentials: true,
            },
        });

        this.io.on('connection', (socket: Socket) => {
            const token = socket.handshake.auth.token;

            let userId: number | undefined;
            try {
                const payload: any = jwt.verify(token, process.env.JWT_SECRET || '');
                userId = payload.id;
            } catch (err) {
                console.log('Invalid token');
                socket.disconnect();
                return;
            }

            socket.data.userId = userId;
            if (userId) {
                this.userSocketMap.set(userId, socket.id);
                console.log(`🔌 User ${userId} connected: ${socket.id}`);
            }

            socket.on('join_post_room', (postId) => {
                socket.join(`post_${postId}`);
                console.log(`User ${userId} joined post_${postId}`);
            });

            socket.on('leave_post_room', (postId) => {
                socket.leave(`post_${postId}`);
                console.log(`User ${userId} left post_${postId}`);
            });

            socket.on('disconnect', () => {
                console.log(`❌ Socket disconnected: ${socket.id}`);
                if (userId) {
                    this.userSocketMap.delete(userId);
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

    public emitToAll(event: string, data: any) {
        if (!this.io) return;
        this.io.emit(event, data);
    }

    public emitToAllExcept(excludedUserId: number, event: string, data: any) {
        if (!this.io) return;
        this.io.sockets.sockets.forEach((socket) => {
            if (socket.data.userId !== excludedUserId) {
                socket.emit(event, data);
            }
        });
    }

    public emitToRoomExcept(roomName: string, event: string, data: any, excludedUserId: number) {
        if (!this.io) return;

        const socketsInRoom = this.io.sockets.adapter.rooms.get(roomName);
        if (!socketsInRoom) return;

        socketsInRoom.forEach((socketId) => {
            const socket = this.io!.sockets.sockets.get(socketId);
            if (socket && socket.data.userId !== excludedUserId) {
                socket.emit(event, data);
            }
        });
    }

    public getIO() {
        return this.io;
    }
}

export const socketService = new SocketService();
