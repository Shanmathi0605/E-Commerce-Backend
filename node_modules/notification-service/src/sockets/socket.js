const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Map of userId -> socketId
const connectedClients = new Map();
let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  });

  // JWT auth middleware for Socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_KEY || 'asdfasdf');
      socket.userId = payload.id;
      socket.role = payload.role;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Token invalid'));
    }
  });

  io.on('connection', (socket) => {
    connectedClients.set(socket.userId, socket.id);
    console.log(`[Socket.IO] Client connected: User ${socket.userId} (Role: ${socket.role})`);

    // Listen for simple live chat support queries
    socket.on('support_message', (data) => {
      console.log(`[Socket.IO] Support message from user ${socket.userId}:`, data.message);
      // Echo response or trigger admin support alert
      socket.emit('support_response', {
        sender: 'chatbot',
        message: `Thank you for your query: "${data.message}". Our support bot is processing this request.`
      });
    });

    socket.on('disconnect', () => {
      connectedClients.delete(socket.userId);
      console.log(`[Socket.IO] Client disconnected: User ${socket.userId}`);
    });
  });

  return io;
};

// Send alert to specific connected user
const notifyUser = (userId, eventName, payload) => {
  if (!io) return;
  const socketId = connectedClients.get(userId);
  if (socketId) {
    io.to(socketId).emit(eventName, payload);
    console.log(`[Socket.IO] Dispatched event "${eventName}" to User ${userId}`);
  }
};

// Broadcast alert to all admins
const notifyAdmins = (eventName, payload) => {
  if (!io) return;
  io.sockets.sockets.forEach((socket) => {
    if (socket.role === 'admin') {
      socket.emit(eventName, payload);
      console.log(`[Socket.IO] Dispatched event "${eventName}" to Admin ${socket.userId}`);
    }
  });
};

module.exports = {
  initSocket,
  notifyUser,
  notifyAdmins
};
