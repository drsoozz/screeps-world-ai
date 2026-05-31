import { spiralPath } from "utils/spiralPath";
import { BUILD_PRIORITY } from "./structures/BUILD_PRIORITY";
import { getNumBlockedSquares } from "utils/getNumBlockedSquares";
import { findSafeSources } from "utils/findSafeSources";
import { getRoadPlanCoords } from "./structures/getRoadPlanCoords";
import { hasStructureOrSite } from "utils/hasStructureOrConstructionSite";
import { getRehydratedRoomPosition } from "types/DehydratedRoomPosition";

export function planNextStructure(room: Room): void {
  // never build on CL1 because you don't want a backlog of construction sites before extensions can be built
  if ((room.controller?.level ?? 0) === 1) {
    return;
  }

  const existingStructs = room.find(FIND_STRUCTURES);
  const existingConstructionSites = room.find(FIND_CONSTRUCTION_SITES);

  for (const struct of BUILD_PRIORITY) {
    let numberBuilt: number;
    let numberMax: number;
    let needToBuild = false;
    switch (struct) {
      default: {
        numberBuilt =
          existingStructs.filter(s => {
            return s.structureType === struct;
          }).length +
          existingConstructionSites.filter(s => {
            return s.structureType === struct;
          }).length;
        numberMax = CONTROLLER_STRUCTURES[struct][room.controller?.level ?? 1] ?? 2500;
        needToBuild = numberBuilt < numberMax;
        break;
      }
      case STRUCTURE_ROAD:
      case STRUCTURE_WALL:
      case STRUCTURE_RAMPART: {
        // could be better
        needToBuild = true;
        break;
      }
    }

    if (!needToBuild) {
      continue;
    }

    switch (struct) {
      case STRUCTURE_EXTENSION: {
        return _planExtension(
          existingStructs.filter(s => {
            return s.structureType === STRUCTURE_SPAWN;
          })[0] as StructureSpawn | undefined
        );
      }
      case STRUCTURE_CONTAINER: {
        return _planContainer(room);
      }
      case STRUCTURE_ROAD: {
        _planRoad(room);
        break;
      }
      default: {
        break;
      }
    }
  }
}

function _planExtension(spawn: StructureSpawn | undefined) {
  if (!spawn) {
    return;
  }
  const spawnPos = spawn.pos;
  const _pos = spiralPath(spawnPos);
  let pos: RoomPosition | void;
  const terrain = Game.rooms[spawnPos.roomName].getTerrain();

  while (true) {
    pos = _pos.next().value;
    if (!pos) {
      return;
    }

    if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
      continue;
    }

    if (spawn.room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y).length > 0) {
      continue;
    }

    if (spawnPos.getRangeTo(pos) < 2) {
      continue;
    }

    const structuresAtTile = spawn.room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
    if (structuresAtTile.length > 0) {
      const roads = structuresAtTile.filter(s => s.structureType === STRUCTURE_ROAD);
      if (structuresAtTile.length != roads.length) {
        continue;
      } else {
        for (const road of roads) {
          const result = road.destroy();
          if (result != 0) {
            continue;
          }
        }
      }
    }

    const numBlockedSquares = getNumBlockedSquares(pos, terrain, true);
    if (numBlockedSquares == undefined || numBlockedSquares > 0) {
      continue;
    } else {
      break;
    }
  }

  creatingStructureMessage(STRUCTURE_EXTENSION);
  const result = pos.createConstructionSite(STRUCTURE_EXTENSION);
}

function _planContainer(room: Room) {
  const safeSources = findSafeSources(room);

  const containersOnSource: Record<Id<Source>, number> = {};
  for (const source of safeSources) {
    containersOnSource[source.id] =
      source.pos.findInRange(FIND_STRUCTURES, 2).filter(s => {
        return s.structureType === STRUCTURE_CONTAINER;
      }).length +
      source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 2).filter(s => {
        return s.structureType === STRUCTURE_CONTAINER;
      }).length;
  }

  safeSources.sort((a, b) => {
    return containersOnSource[a.id] - containersOnSource[b.id];
  });

  const targetSource = safeSources[0];

  const sourcePos = targetSource.pos;
  const _pos = spiralPath(sourcePos);
  let pos: RoomPosition | void;
  const terrain = Game.rooms[sourcePos.roomName].getTerrain();

  _pos.next(); // skip the center of the spiral (the source)
  while (true) {
    pos = _pos.next().value;
    if (!pos) {
      return;
    }

    if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
      continue;
    }

    if (room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y).length > 0) {
      continue;
    }

    const structuresAtTile = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y).filter(s => {
      return s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART;
    });
    if (structuresAtTile.length > 0) {
      continue;
    }
    break;
  }
  creatingStructureMessage(STRUCTURE_CONTAINER);
  const result = pos.createConstructionSite(STRUCTURE_CONTAINER);
}

function _planRoad(room: Room) {
  let roadPlan =
    Memory.structurePlanning.roads?.[room.name] ??
    (Memory.structurePlanning.roads[room.name] = { coords: [], index: 0 });

  if (roadPlan.coords.length === 0 || roadPlan.index >= roadPlan.coords.length) {
    roadPlan.coords = getRoadPlanCoords(room);
    roadPlan.index = 0;
    console.log(`Road data for structure planning was generated for ${room.name}.`);
  }

  const pos = getRehydratedRoomPosition(roadPlan.coords[roadPlan.index]);

  roadPlan.index++;

  if (!hasStructureOrSite(pos)) {
    creatingStructureMessage(STRUCTURE_ROAD);
    pos.createConstructionSite(STRUCTURE_ROAD);
  }
}

function creatingStructureMessage(structName: string): void {
  console.log(`Created a(n) ${structName}.`);
}
