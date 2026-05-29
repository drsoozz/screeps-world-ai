import { getRoleDist } from "creeps/roleDistribution";
import { RoleType } from "creeps/roleType";
import { NUM_RENEWS, ROLE_PRIORITY } from "consts";
import { ControllerLevel } from "types/isValidControllerLevel";
import { RoleBody, ScreepBody } from "creeps/roleBody";
import { isValidControllerLevel } from "types/isValidControllerLevel";

export function planNextCreep(room: Room): void {
  const cLevel = room.controller?.level;
  if (cLevel === 0 || !isValidControllerLevel(cLevel)) {
    return;
  }
  const creepsNeeded = getRoleDist(room, room.controller?.level);

  for (const spawn of room.find(FIND_MY_SPAWNS)) {
    const numCreepsNeeded = { ...creepsNeeded };
    const numCreepRolesPresent = Object.values(Game.creeps)
      .filter(c => {
        return c.memory.homeRoom === spawn.room.name;
      })
      .map(c => {
        return c.memory.role;
      });
    for (const role of numCreepRolesPresent) {
      numCreepsNeeded[role]--;
    }

    let emergency: boolean = false;
    if (numCreepsNeeded[RoleType.Harvester] >= 2) {
      emergency = true;
    }

    for (const role of ROLE_PRIORITY) {
      if (numCreepsNeeded[role] > 0) {
        const name = `Uranium-${role}-${Game.time}`;
        console.log(`Attempting to spawn creep of role "${role}".`);
        let body = _planCreepBody(spawn, cLevel, role, emergency);
        if (body === undefined) {
          return undefined;
        }

        const memory = _planCreepMemory(role, spawn, cLevel);
        const result = spawn.spawnCreep(body, name, { memory: memory });
        if (result === 0) {
          console.log(`  > ${name} was successfully spawned.`);
        } else {
          console.log(`  > An error occured while attempting to spawn ${name}: ${result}`);
        }
      }
    }
  }
}

function _planCreepBody(
  spawn: StructureSpawn,
  cLevel: ControllerLevel,
  role: RoleType,
  emergency: boolean
): ScreepBody | undefined {
  const bodyData = RoleBody[cLevel]?.[role];
  if (!bodyData) {
    return undefined;
  }
  const body = [...bodyData.setBody];

  // energy is in short-supply as there are few harvesters
  // push with no extra parts to be more affordable

  const activeEnergyStores = spawn.room.find(FIND_MY_STRUCTURES, {
    filter: s => {
      return (
        (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) &&
        s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
      );
    }
  }) as (StructureSpawn | StructureExtension)[];
  let energyMax = 0;
  let energyAvailable = 0;
  for (const activeEnergyStore of activeEnergyStores) {
    energyMax += activeEnergyStore.store.getCapacity() ?? 0;
    energyAvailable += activeEnergyStore.store.getUsedCapacity() ?? 0;
  }

  let energyCost = _.sum(body, bp => BODYPART_COST[bp]);
  if (energyCost > energyMax) {
    console.log(
      `  > Not enough energy storage to create this creep's basic body plan (${energyMax}/${energyCost}). BODY PLAN: ${body}`
    );
    return undefined;
  }
  if (emergency) {
    console.log(
      "  > There are too few harvester screeps, and an emergency was declared." +
        "This screep is intentionally made cheaper than normal."
    );
  } else {
    let fillBody = bodyData.fillBody ?? undefined;
    if (!fillBody) {
      return body;
    }
    fillBody = Array.isArray(fillBody) ? fillBody : [fillBody];

    let bi = 0;
    while (energyCost + BODYPART_COST[fillBody[bi]] <= energyMax) {
      body.push(fillBody[bi]);
      energyCost += BODYPART_COST[fillBody[bi]];
      bi = (bi + 1) % fillBody.length;
    }
  }

  if (energyCost > energyAvailable) {
    console.log(
      `  > Not enough energy to create this creep's current body plan (${energyAvailable}/${energyCost}). BODY PLAN: ` +
        body
    );
    return undefined;
  }
  return body;
}

function _planCreepMemory(role: RoleType, spawn: StructureSpawn, cLevel: ControllerLevel) {
  const creepMemory: CreepMemory = {
    role: role,
    task: undefined,
    homeRoom: spawn.room.name,
    controllerLevelAtBirth: cLevel,
    numRenews: NUM_RENEWS[cLevel]
  };

  switch (role) {
    case RoleType.Charter: {
      creepMemory.numRenews *= 2;
      break;
    }
    default: {
      break;
    }
  }

  return creepMemory;
}
