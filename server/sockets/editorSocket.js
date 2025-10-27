import {
  createRoom,
  roomExists,
  getRoom,
  addUserToRoom,
  removeUserFromRoom,
  updateRoomCode,
  getRoomUsers,
  createRoomWithId
} from '../utils/roomManager.js';

export default (socket, io) => {
  console.log(" New client connected:", socket.id);

  socket.on("create-room", ({ userName }) => {
    const roomId = createRoom();
    const name = userName || 'Anonymous';
    
    socket.join(roomId);
    
    socket.roomId = roomId;
    socket.userName = name;
    
    addUserToRoom(roomId, socket.id, name);
    
    console.log(`✨ Room created: ${roomId} by ${name} (${socket.id})`);
    
    socket.emit("room-created", { roomId, userName: name });
    
    const users = getRoomUsers(roomId);
    io.to(roomId).emit("users-update", users);
  });

  socket.on("join-room", ({ roomId, userName }) => {
    const name = userName || 'Anonymous';
    
    if (!roomExists(roomId)) {
      console.log(`Creating room ${roomId} on first join by ${name}`);
      createRoomWithId(roomId);
    }
    
    socket.join(roomId);
    
    socket.roomId = roomId;
    socket.userName = name;
    
    addUserToRoom(roomId, socket.id, name);
    
    console.log(` User ${name} (${socket.id}) joined room ${roomId}`);
    
    const room = getRoom(roomId);
    const users = getRoomUsers(roomId);
    
    if (room.code) {
      socket.emit("code-update", room.code);
    }
    
    io.to(roomId).emit("users-update", users);
    socket.to(roomId).emit("user-joined", { id: socket.id, name });
    
    const clients = io.sockets.adapter.rooms.get(roomId);
    if (clients && clients.size > 1) {
      socket.to(roomId).emit("request-code", socket.id);
    }
  });

  socket.on("leave-room", () => {
    if (!socket.roomId) return;
    
    const roomId = socket.roomId;
    const userName = socket.userName;
    
    console.log(` User ${userName} (${socket.id}) leaving room ${roomId}`);
    
    const result = removeUserFromRoom(roomId, socket.id);
    
    if (result) {
      socket.leave(roomId);
      
      if (result.deleted) {
        console.log(`  Room ${roomId} deleted (no users remaining)`);
      } else {
        io.to(roomId).emit("users-update", result.users);
        socket.to(roomId).emit("user-left", { id: socket.id, name: userName });
      }
    }
    
    socket.roomId = null;
    socket.userName = null;
  });

  socket.on("local-edit", ({ roomId, code }) => {
    if (!roomExists(roomId)) return;
    
    updateRoomCode(roomId, code);
    
    socket.to(roomId).emit("remote-edit", code);
  });

  socket.on("code-change", ({ roomId, code }) => {
    if (!roomExists(roomId)) return;
    
    updateRoomCode(roomId, code);
    
    socket.to(roomId).emit("code-update", code);
  });
  
  socket.on("send-current-code", ({ targetSocketId, code }) => {
    io.to(targetSocketId).emit("code-update", code);
  });

  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
    
    if (socket.roomId) {
      const roomId = socket.roomId;
      const userName = socket.userName;
      
      const result = removeUserFromRoom(roomId, socket.id);
      
      if (result) {
        if (result.deleted) {
          console.log(`Room ${roomId} deleted after disconnect`);
        } else {
          io.to(roomId).emit("users-update", result.users);
          socket.to(roomId).emit("user-left", { id: socket.id, name: userName });
        }
      }
    }
  });
};

