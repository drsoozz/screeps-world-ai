import { getRoleDist } from "creeps/roleDistribution";
import { RoleType } from "creeps/roleType";
import { CREEP_PLANNING_FAILURE_COOLDOWN, NUM_RENEWS, ROLE_PRIORITY } from "consts";
import { ControllerLevel } from "types/ControllerLevel";
import { RoleBody, ScreepBody } from "creeps/roleBody";
import { isControllerLevel } from "types/ControllerLevel";
import { findSafeSources } from "utils/findSafeSources";
import { TaskType } from "creeps/taskType";
import { TaskTargetData } from "types/memory";

export function planNextCreep(room: Room): void {
  let roomPlan = Memory.creepPlanning?.[room.name];
  if (!roomPlan) {
    roomPlan = Memory.creepPlanning[room.name] = { counter: 0 };
  } else if (roomPlan.counter > 0) {
    roomPlan.counter--;
    return;
  }

  let creepSpawnedSuccessfully = false;

  const cLevel = room.controller?.level;
  if (!isControllerLevel(cLevel) || cLevel === 0) {
    return setCounter(room, creepSpawnedSuccessfully);
  }
  const creepsNeeded = getRoleDist(room, room.controller?.level);
  for (const spawn of room.find(FIND_MY_SPAWNS)) {
    const numCreepsNeeded = { ...creepsNeeded };
    const numCreepRolesPresent = Object.values(Game.creeps)
      .filter(c => {
        return c.memory.parentRoom === spawn.room.name;
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
          // current highest priority creep cannot be spawned
          // so stop ENTIRE function here
          return setCounter(room, creepSpawnedSuccessfully);
        }

        const memory = _planCreepMemory(role, spawn, cLevel, emergency);
        const result = spawn.spawnCreep(body, name, { memory: memory });
        if (result === 0) {
          console.log(`  > ${name} was successfully spawned.`);
          creepSpawnedSuccessfully = true;
        } else {
          console.log(`  > An error occured while attempting to spawn ${name}: ${result}`);
        }
        break;
      }
    }
  }

  return setCounter(room, creepSpawnedSuccessfully);
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
  let fillBody = bodyData.fillBody ?? undefined;

  const activeEnergyStores = spawn.room.find(FIND_MY_STRUCTURES, {
    filter: s => {
      return s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN;
    }
  }) as (StructureSpawn | StructureExtension)[];
  let energyMax = 0;
  let energyAvailable = 0;
  for (const activeEnergyStore of activeEnergyStores) {
    energyMax += activeEnergyStore.store.getCapacity(RESOURCE_ENERGY) ?? 0;
    energyAvailable += activeEnergyStore.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
  }

  let energyCost = _.sum(body, bp => BODYPART_COST[bp]);
  if (energyCost > energyMax) {
    console.log(
      `  > Not enough energy storage to create this creep's basic body plan (${energyMax}/${energyCost}). BODY PLAN: ${body}`
    );
    return undefined;
  }
  // energy is in short-supply as there are few harvesters
  // therefore, don't add fillBody parts
  if (emergency) {
    console.log(
      "  > There are too few harvester screeps, and an emergency was declared. " +
        "This creep is intentionally made cheaper than normal."
    );
  } else if (fillBody) {
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

function _planCreepMemory(role: RoleType, spawn: StructureSpawn, cLevel: ControllerLevel, emergency: boolean) {
  // when this is an emergency creep it should be treated as temporary and should be given fewer renews so that it can be more quickly replaced
  let numRenews = emergency ? NUM_RENEWS[Math.floor(cLevel / 2) as ControllerLevel] : NUM_RENEWS[cLevel];
  const parentRoom = spawn.room.name; // name not Room object sorry
  const parentSourceId = _getParentSource(spawn.room, role);
  const parentSource = Game.getObjectById(parentSourceId); // i dont think this will ever be null
  const taskTargets: TaskTargetData = {};
  if (parentSource) {
    taskTargets[TaskType.Harvest] = {
      id: parentSourceId,
      pos: {
        x: parentSource.pos.x,
        y: parentSource.pos.y,
        roomName: parentSource.room.name
      },
      timestamp: Game.time
    };
  }
  if (parentRoom) {
    // if there is a spawn in the room, there is guaranteed to be a StructureController
    const parentController = spawn.room.controller as StructureController;
    taskTargets[TaskType.Upgrade] = {
      id: parentController.id,
      pos: {
        x: parentController.pos.x,
        y: parentController.pos.y,
        roomName: parentController.pos.roomName
      },
      timestamp: Game.time
    };
  }
  taskTargets[TaskType.Renew] = {
    id: spawn.id,
    pos: {
      x: spawn.pos.x,
      y: spawn.pos.y,
      roomName: spawn.pos.roomName
    },
    timestamp: Game.time
  };

  switch (role) {
    case RoleType.Harvester: {
      break;
    }
    case RoleType.Charter: {
      numRenews *= 2;
      break;
    }
    default: {
      break;
    }
  }

  const creepMemory: CreepMemory = {
    role: role,
    task: undefined,
    oscillationBreak: { lastRoom: spawn.room.name, stuckTicks: 0 },
    parentRoom: spawn.room.name,
    parentSource: parentSourceId,
    controllerLevelAtBirth: cLevel,
    numRenews: numRenews,
    forcedRenew: false,
    waiting: 0,
    taskTargets: taskTargets
  };

  return creepMemory;
}
function _getParentSource(room: Room, role?: RoleType): Id<Source> {
  const safeSources = findSafeSources(room).map(s => s.id);
  let roleCondition: boolean;
  switch (role) {
    default: {
      roleCondition = false;
      break;
    }
    case RoleType.Harvester: {
      roleCondition = true;
      break;
    }
  }

  const sourceCount: Record<Id<Source>, number> = {};
  for (const sourceId of safeSources) {
    sourceCount[sourceId] = 0;
  }
  for (const creep of Object.values(Game.creeps)) {
    if (roleCondition && creep.memory.role != role) {
      continue;
    }
    const parentSource = creep.memory.parentSource;
    sourceCount[parentSource] = (sourceCount[parentSource] ?? 0) + 1;
  }
  safeSources.sort((a, b) => {
    return sourceCount[a] - sourceCount[b];
  });

  return safeSources[0];
}

function setCounter(room: Room, creepSpawnedSuccessfully: boolean): void {
  let roomPlan = Memory.creepPlanning?.[room.name];
  if (!roomPlan) {
    roomPlan = Memory.creepPlanning[room.name] = { counter: 0 };
  }
  roomPlan.counter = creepSpawnedSuccessfully ? 0 : CREEP_PLANNING_FAILURE_COOLDOWN;

  if (creepSpawnedSuccessfully) {
    roomPlan.counter = 0;
  }
}
