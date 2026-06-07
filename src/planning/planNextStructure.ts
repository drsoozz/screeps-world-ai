import { spiralPath } from "utils/spiralPath";
import { BUILD_PRIORITY_NOT_OWNER, BUILD_PRIORITY_OWNER } from "consts";
import { getNumBlockedSquares } from "utils/getNumBlockedSquares";
import { findSafeSources } from "utils/findSafeSources";
import { getRoadPlanCoords } from "./structures/getRoadPlanCoords";
import { hasStructureOrSite } from "utils/hasStructureOrConstructionSite";
import { getRehydratedRoomPosition } from "types/DehydratedRoomPosition";
import { structurePlanningFactory } from "utils/structurePlanningFactories";
import { findOptimalTowerPosition } from "utils/findOptimalTowerPosition";

export function planNextStructure(room: Room): void {
  // never build on CL1 because you don't want a backlog of construction sites before extensions can be built
  if ((room.controller?.level ?? 0) === 1) {
    return;
  }
  console.log("wow!");
  let roomOwner = room?.controller?.owner?.username;
  let meOwner = Object.values(Game.spawns)[0].owner.username;
  console.log(roomOwner, meOwner);
  if (roomOwner !== undefined && roomOwner !== meOwner) {
    return;
  }
  let amOwner = roomOwner === meOwner;
  const existingStructs = room.find(FIND_STRUCTURES);
  const existingConstructionSites = room.find(FIND_CONSTRUCTION_SITES);

  let buildList = amOwner ? BUILD_PRIORITY_OWNER : BUILD_PRIORITY_NOT_OWNER;
  for (const struct of buildList) {
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

      case STRUCTURE_TOWER: {
        return _planTower(room);
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
    if (spawnPos.getRangeTo(pos) < 2) {
      continue;
    }

    const numBlockedSquares = getNumBlockedSquares(pos, terrain, true);
    if (numBlockedSquares == undefined || numBlockedSquares > 0) {
      continue;
    } else {
      const validData = isValidPlacementPosition(spawn.room, pos, terrain);
      if (validData.endEarly) {
        return;
      } else if (!validData.keepGoing) {
        continue;
      }
      break;
    }
  }

  const result = pos.createConstructionSite(STRUCTURE_EXTENSION);
  if (result === 0) {
    creatingStructureMessage(STRUCTURE_EXTENSION);
  }
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

    const validData = isValidPlacementPosition(room, pos, terrain);
    if (validData.endEarly) {
      return;
    } else if (!validData.keepGoing) {
      continue;
    }

    break;
  }
  const result = pos.createConstructionSite(STRUCTURE_CONTAINER);
  if (result === 0) {
    creatingStructureMessage(STRUCTURE_CONTAINER);
  }
}

function _planRoad(room: Room) {
  let structurePlanning = Memory.structurePlanning?.[room.name];
  if (!structurePlanning) {
    structurePlanning = Memory.structurePlanning[room.name] = structurePlanningFactory();
  }

  let roadPlan = structurePlanning.roads;

  if (roadPlan.coords.length === 0 || roadPlan.index >= roadPlan.coords.length) {
    roadPlan.coords = getRoadPlanCoords(room);
    roadPlan.index = 0;
    console.log(`Road data for structure planning was generated for ${room.name}.`);
  }
  if (roadPlan.coords.length === 0) {
    // no roads to place. roads are not guaranteed from the previous step.
    return;
  }
  const pos = getRehydratedRoomPosition(roadPlan.coords[roadPlan.index]);

  roadPlan.index++;

  if (!hasStructureOrSite(pos)) {
    const result = pos.createConstructionSite(STRUCTURE_ROAD);
    if (result === 0) {
      creatingStructureMessage(STRUCTURE_ROAD);
    }
  }
}

function _planTower(room: Room) {
  let structurePlanning = Memory.structurePlanning?.[room.name];
  if (!structurePlanning) {
    structurePlanning = Memory.structurePlanning[room.name] = structurePlanningFactory();
  }

  let terrain = room.getTerrain();

  let towerPlan = structurePlanning.towers;
  if (!towerPlan?.optimalPosition) {
    towerPlan.optimalPosition = findOptimalTowerPosition(room, terrain);
  }

  const _pos = spiralPath(getRehydratedRoomPosition(towerPlan.optimalPosition));
  let pos: RoomPosition | void;

  while (true) {
    pos = _pos.next().value;
    if (!pos) {
      return;
    }
    const numBlockedSquares = getNumBlockedSquares(pos, terrain, true);
    if (numBlockedSquares == undefined || numBlockedSquares > 0) {
      continue;
    } else {
      const validData = isValidPlacementPosition(room, pos, terrain);
      if (validData.endEarly) {
        return;
      } else if (!validData.keepGoing) {
        continue;
      }
      break;
    }
  }

  const result = pos.createConstructionSite(STRUCTURE_TOWER);
  if (result === 0) {
    creatingStructureMessage(STRUCTURE_TOWER);
  }
}

function creatingStructureMessage(structName: string): void {
  console.log(`Created a(n) ${structName}.`);
}

/**
 *
 * This should be the last criteria as this will destroy construction sites and roads preemptively
 */
function isValidPlacementPosition(
  room: Room,
  pos: RoomPosition,
  terrain?: RoomTerrain
): { keepGoing: boolean; endEarly: boolean } {
  terrain = !terrain ? room.getTerrain() : terrain;

  if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
    return { keepGoing: false, endEarly: false };
  }

  const constructioNSitesAtTile = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
  if (constructioNSitesAtTile.length > 0) {
    const walkable = constructioNSitesAtTile.filter(
      s => s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_RAMPART
    );
    if (constructioNSitesAtTile.length !== walkable.length) {
      return { keepGoing: false, endEarly: false };
    } else {
      let continueLoop = true;
      for (const w of walkable) {
        const result = w.remove();
        if (result !== 0) {
          continueLoop = false;
          continue;
        }
      }
      if (!continueLoop) {
        return { keepGoing: false, endEarly: false };
      }
    }
  }

  const structuresAtTile = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
  if (structuresAtTile.length > 0) {
    const walkable = structuresAtTile.filter(
      s => s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_RAMPART
    );
    if (structuresAtTile.length !== walkable.length) {
      return { keepGoing: false, endEarly: false };
    } else {
      let continueLoop = true;
      for (const w of walkable) {
        const result = w.destroy();
        if (result !== 0) {
          continueLoop = false;
          continue;
        }
      }
      if (!continueLoop) {
        return { keepGoing: false, endEarly: false };
      }
    }
  }
  return { keepGoing: true, endEarly: false };
}
