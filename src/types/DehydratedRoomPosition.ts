export type DehydratedRoomPosition = {
  x: number;
  y: number;
  roomName: Room["name"];
};

export function isDehydratedRoomPosition(obj: any): obj is DehydratedRoomPosition {
  return obj && typeof obj?.x === "number" && typeof obj?.y === "number" && typeof obj?.roomName === "string";
}

// Rehydrate function
export function getRehydratedRoomPosition(pos: DehydratedRoomPosition): RoomPosition {
  return new RoomPosition(pos.x, pos.y, pos.roomName);
}

export function getDehydratedRoomPosition(pos: RoomPosition): DehydratedRoomPosition {
  return { x: pos.x, y: pos.y, roomName: pos.roomName };
}
