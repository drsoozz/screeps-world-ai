import { spiralPath } from "utils/spiralPath";
import { BUILD_PRIORITY } from "./structures/BUILD_PRIORITY";
import { getNumBlockedSquares } from "utils/getNumBlockedSquares";

export function planNextStructure(room: Room): void {
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
        // TODO
        break;
      }
    }

    if (!needToBuild) {
      continue;
    }

    switch (struct) {
      case STRUCTURE_EXTENSION: {
        _planExtension(
          existingStructs.filter(s => {
            return s.structureType === STRUCTURE_SPAWN;
          })[0] as StructureSpawn | undefined
        );
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

function creatingStructureMessage(structName: string): void {
  console.log(`Created a(n) ${structName}.`);
}
