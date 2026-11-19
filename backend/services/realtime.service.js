/**
 * Holds the Socket.IO server so business logic can emit events without importing
 * server.js (which would create a circular dependency).
 */
let io = null;

export function registerEmitter(instance) {
  io = instance || null;
}

export function isRealtimeAvailable() {
  return Boolean(io);
}

/** Emits an event to the `user:<id>` rooms of all given user ids. */
export function emitToUsers(userIds, event, payload) {
  if (!io) return false;
  const rooms = [...new Set((userIds || []).filter(Boolean).map((id) => `user:${id.toString()}`))];
  if (!rooms.length) return false;
  for (const room of rooms) {
    io.to(room).emit(event, payload);
  }
  return true;
}

export default { registerEmitter, isRealtimeAvailable, emitToUsers };
