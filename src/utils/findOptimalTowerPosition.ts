import { ROOM_SIZE } from "consts";

export function findOptimalTowerPosition(room: Room, terrain?: RoomTerrain): RoomPosition {
  terrain = !terrain ? room.getTerrain() : terrain;
  const allExitTiles = room.find(FIND_EXIT);
  console.log(allExitTiles);

  let bestPos: RoomPosition | undefined = undefined;
  let minMaxDistance = Infinity;
  const boundsX = { min: 2, max: ROOM_SIZE - 2 };
  const boundsY = { min: 2, max: ROOM_SIZE - 2 };

  for (let x = boundsX.min; x <= boundsX.max; x++) {
    for (let y = boundsY.min; y <= boundsY.max; y++) {
      if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
        continue;
      }

      let maxDistanceForThisTile = 0;
      for (const exitTile of allExitTiles) {
        // Chebyshev distance
        const distX = Math.abs(x - exitTile.x);
        const distY = Math.abs(y - exitTile.y);
        const chebyshevDistance = Math.max(distX, distY);
        if (chebyshevDistance > maxDistanceForThisTile) {
          maxDistanceForThisTile = chebyshevDistance;
        }
      }

      if (minMaxDistance > maxDistanceForThisTile) {
        minMaxDistance = maxDistanceForThisTile;
        bestPos = new RoomPosition(x, y, room.name);
      } else if (minMaxDistance === maxDistanceForThisTile) {
        const currentCenterDistance = Math.max(Math.abs(x - ROOM_SIZE / 2), Math.abs(y - ROOM_SIZE / 2));
        const bestCenterDistance = Math.max(Math.abs(bestPos!.x - ROOM_SIZE / 2), Math.abs(bestPos!.y - ROOM_SIZE / 2));
        if (currentCenterDistance < bestCenterDistance) {
          bestPos = new RoomPosition(x, y, room.name);
        }
      }
    }
  }
  return bestPos!;
}
