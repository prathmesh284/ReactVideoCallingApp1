const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  socket.on('join', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.room).emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', socket.id);
  });
});

server.listen(5000, () => console.log('Signaling server running on port 5000'));
