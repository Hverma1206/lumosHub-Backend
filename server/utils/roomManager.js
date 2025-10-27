import { v4 as uuidv4 } from 'uuid';

const rooms = new Map();

export const generateRoomId = () => {
  return uuidv4();
};

export const createRoom = () => {
  const roomId = generateRoomId();
  rooms.set(roomId, {
    users: [],
    code: ''
  });
  return roomId;
};

export const createRoomWithId = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: [],
      code: ''
    });
  }
  return roomId;
};

export const roomExists = (roomId) => {
  return rooms.has(roomId);
};

export const getRoom = (roomId) => {
  return rooms.get(roomId);
};

export const addUserToRoom = (roomId, socketId, userName) => {
  if (!rooms.has(roomId)) {
    return false;
  }
  
  const room = rooms.get(roomId);
  room.users.push({ id: socketId, name: userName });
  return true;
};

export const removeUserFromRoom = (roomId, socketId) => {
  if (!rooms.has(roomId)) {
    return false;
  }
  
  const room = rooms.get(roomId);
  const index = room.users.findIndex(u => u.id === socketId);
  
  if (index !== -1) {
    room.users.splice(index, 1);
    
    if (room.users.length === 0) {
      rooms.delete(roomId);
      return { deleted: true };
    }
    
    return { deleted: false, users: room.users };
  }
  
  return false;
};

export const updateRoomCode = (roomId, code) => {
  if (!rooms.has(roomId)) {
    return false;
  }
  
  const room = rooms.get(roomId);
  room.code = code;
  return true;
};

export const getRoomUsers = (roomId) => {
  const room = rooms.get(roomId);
  return room ? room.users : [];
};

export const getRoomStats = () => {
  return {
    totalRooms: rooms.size,
    rooms: Array.from(rooms.entries()).map(([id, data]) => ({
      id,
      userCount: data.users.length
    }))
  };
};
 