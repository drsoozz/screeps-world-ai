import { ROOM_SIZE } from "consts";

export function* spiralPath(pos: RoomPosition = new RoomPosition(ROOM_SIZE / 2, ROOM_SIZE / 2, "!")) {
  let x = pos.x;
  let y = pos.y;
  let roomName = pos.roomName;

  let dx = 1;
  let dy = 0;

  let stepSize = 1;
  yield new RoomPosition(x, y, roomName);

  while (true) {
    for (let repeat = 0; repeat < 2; repeat++) {
      for (let i = 0; i < stepSize; i++) {
        x += dx;
        y += dy;

        if (x >= 0 && x < ROOM_SIZE && y >= 0 && y < ROOM_SIZE) {
          yield new RoomPosition(x, y, roomName);
        }
      }
      [dx, dy] = [-dy, dx];
    }

    stepSize++;
  }
}
