const jwt = require('jsonwebtoken');

/**
 * All Socket.io event handlers.
 * Rooms are named by sessionId.
 */
module.exports = (io) => {
  // Authenticate socket on handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.user?.email}`);

    // ── JOIN SESSION ──
    socket.on('join-session', ({ sessionId }) => {
      socket.join(sessionId);
      socket.sessionId = sessionId;
      socket.to(sessionId).emit('user-joined', {
        userId: socket.user.id,
        email: socket.user.email,
        socketId: socket.id,
      });
      // Send current room users to the newcomer
      const room = io.sockets.adapter.rooms.get(sessionId);
      const userCount = room ? room.size : 1;
      io.to(sessionId).emit('user-count', { count: userCount });
    });

    // ── LEAVE SESSION ──
    socket.on('leave-session', ({ sessionId }) => {
      socket.leave(sessionId);
      socket.to(sessionId).emit('user-left', { userId: socket.user.id, socketId: socket.id });
      const room = io.sockets.adapter.rooms.get(sessionId);
      const userCount = room ? room.size : 0;
      io.to(sessionId).emit('user-count', { count: userCount });
    });

    // ── DRAW STROKE ──
    socket.on('draw-stroke', ({ sessionId, stroke }) => {
      socket.to(sessionId).emit('draw-stroke', { stroke, userId: socket.user.id });
    });

    // ── CURSOR MOVE ──
    socket.on('cursor-move', ({ sessionId, x, y }) => {
      socket.to(sessionId).emit('cursor-move', {
        userId: socket.user.id,
        email: socket.user.email,
        x, y,
        socketId: socket.id,
      });
    });

    // ── CLEAR CANVAS ──
    socket.on('clear-canvas', ({ sessionId }) => {
      socket.to(sessionId).emit('clear-canvas', { userId: socket.user.id });
    });

    // ── UNDO STROKE ──
    socket.on('undo-stroke', ({ sessionId }) => {
      socket.to(sessionId).emit('undo-stroke', { userId: socket.user.id });
    });

    // ── REDO STROKE ──
    socket.on('redo-stroke', ({ sessionId }) => {
      socket.to(sessionId).emit('redo-stroke', { userId: socket.user.id });
    });

    // ── CHAT MESSAGE ──
    socket.on('chat-message', ({ sessionId, message }) => {
      io.to(sessionId).emit('chat-message', {
        message,
        sender: socket.user.email,
        userId: socket.user.id,
        timestamp: new Date().toISOString(),
      });
    });

    // ── SAVE CANVAS ──
    socket.on('save-canvas', ({ sessionId, canvasDataURL }) => {
      io.to(sessionId).emit('canvas-saved', {
        savedBy: socket.user.email,
        timestamp: new Date().toISOString(),
      });
    });

    // ── USER TYPING ──
    socket.on('user-typing', ({ sessionId }) => {
      socket.to(sessionId).emit('user-typing', { userId: socket.user.id, email: socket.user.email });
    });

    // ── DISCONNECT ──
    socket.on('disconnect', () => {
      if (socket.sessionId) {
        socket.to(socket.sessionId).emit('user-left', { userId: socket.user.id, socketId: socket.id });
        const room = io.sockets.adapter.rooms.get(socket.sessionId);
        const userCount = room ? room.size : 0;
        io.to(socket.sessionId).emit('user-count', { count: userCount });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
