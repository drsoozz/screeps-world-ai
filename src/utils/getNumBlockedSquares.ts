import { ROOM_SIZE } from "consts";

/**
 * finds all tiles around a given RoomPosition that are unwalkable
 */
export function getNumBlockedSquares(
  pos: RoomPosition,
  terrain?: RoomTerrain,
  orthogonalOnly: boolean = false
): number | undefined {
  const room = Game.rooms[pos.roomName];
  if (!room) {
    return undefined;
  }

  let result = 0;
  terrain = !terrain ? room.getTerrain() : terrain;

  if (orthogonalOnly) {
    const left = new RoomPosition(pos.x - 1, pos.y, pos.roomName);
    const top = new RoomPosition(pos.x, pos.y + 1, pos.roomName);
    const right = new RoomPosition(pos.x + 1, pos.y, pos.roomName);
    const bottom = new RoomPosition(pos.x, pos.y - 1, pos.roomName);
    const directions = [left, top, right, bottom];
    for (const d of directions) {
      result += d.lookFor(LOOK_STRUCTURES).filter(defaultFilter).length;
      result += d.lookFor(LOOK_CONSTRUCTION_SITES).filter(defaultFilter).length;
    }
  } else {
    const structs = pos.findInRange(FIND_STRUCTURES, 1, {
      filter: defaultFilter
    });
    const csites = pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
      filter: defaultFilter
    });
    result += structs.length + csites.length;
  }

  // find all walls
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (orthogonalOnly && Math.abs(dx) === Math.abs(dy)) {
        continue;
      }
      const x = pos.x + dx;
      const y = pos.y + dy;

      if (x < 0 || x >= ROOM_SIZE || y < 0 || y >= ROOM_SIZE) {
        continue;
      }

      if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
        result++;
      }
    }
  }
  return result;
}

function defaultFilter(s: Structure | ConstructionSite): boolean {
  const t = s.structureType;
  return t != STRUCTURE_ROAD && t != STRUCTURE_CONTAINER && t != STRUCTURE_RAMPART;
}
