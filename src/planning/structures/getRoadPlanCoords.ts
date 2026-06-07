import { ROOM_SIZE } from "consts";
import {
  DehydratedRoomPosition,
  getDehydratedRoomPosition,
  getRehydratedRoomPosition
} from "types/DehydratedRoomPosition";
import { findSafeSources } from "utils/findSafeSources";

export function getRoadPlanCoords(room: Room): DehydratedRoomPosition[] {
  const coords: DehydratedRoomPosition[] = [];
  const terrain = room.getTerrain();

  const _controller = (!!room?.controller ? [room.controller] : []).map(s => s.pos);
  const _sources = findSafeSources(room).map(s => s.pos);
  const _spawns = room.find(FIND_MY_SPAWNS).map(s => s.pos);
  const importantStructures = [..._controller, ..._sources, ..._spawns];

  for (let i = 0; i < importantStructures.length; i++) {
    for (let j = i + 1; j < importantStructures.length; j++) {
      const path = PathFinder.search(
        importantStructures[i],
        { pos: importantStructures[j], range: 1 },
        {
          plainCost: 1,
          swampCost: 1
        }
      ).path;
      for (let pos of path) {
        coords.push(getDehydratedRoomPosition(pos));
      }
    }
  }

  pushNearbyPositions(importantStructures, 2, terrain, coords);

  const containersAndExtensions = room
    .find(FIND_STRUCTURES, {
      filter: structure => {
        return structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_EXTENSION;
      }
    })
    .map(s => s.pos);
  // 1 range AOE around containers and extensions
  pushNearbyPositions(containersAndExtensions, 1, terrain, coords);

  return coords;
}

function pushNearbyPositions(
  objects: RoomPosition[],
  range: number,
  terrain: RoomTerrain,
  coords: DehydratedRoomPosition[]
): void {
  for (const obj of objects) {
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        // skip center tile
        if (dx === 0 && dy === 0) {
          continue;
        }

        const x = obj.x + dx;
        const y = obj.y + dy;

        // bounds check
        if (x < 0 || x >= ROOM_SIZE || y < 0 || y >= ROOM_SIZE) {
          continue;
        }

        // skip walls
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
          continue;
        }

        coords.push({ x: x, y: y, roomName: obj.roomName });
      }
    }
  }
}
