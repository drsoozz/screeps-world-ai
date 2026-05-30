import {
  DEFAULT_LONG_JOURNEY_PATH,
  DEFAULT_PATH_OPACITY,
  DEFAULT_REPAIR_BOUNDS,
  DEFAULT_REUSE_PATH,
  LIFE_RENEW_BOUNDS,
  TASK_TARGET_AGE_LIMIT
} from "consts";
import { TaskType } from "./taskType";
import { RoleType } from "./roleType";
import { findSafeSources } from "utils/findSafeSources";
import { ControllerLevel, isValidControllerLevel } from "types/isValidControllerLevel";
import { findExplorationCandidates } from "utils/findExplorationCandidates";

export class TaskActions {
  creep: Creep;
  memory: CreepMemory;
  role: RoleType;
  task?: TaskType;
  constructor(creep: Creep) {
    this.creep = creep;
    this.memory = creep.memory;
    this.role = this.memory.role;
    this.task = this.memory.task;
  }

  chart(): void {
    const explorationCandidates = Memory.explorationCandidates;
    if (explorationCandidates.rooms.length === 0) {
      Memory.explorationCandidates = {
        rooms: findExplorationCandidates(Game.rooms[this.memory.parentRoom] ?? this.creep.room),
        index: 0
      };
    } else if (explorationCandidates.index >= explorationCandidates.rooms.length) {
      Memory.explorationCandidates = {
        rooms: findExplorationCandidates(Game.rooms[this.memory.parentRoom] ?? this.creep.room),
        index: 0
      };
      this.memory.waiting = 1000;
    }

    const targetRoom = Game.rooms[explorationCandidates.rooms[explorationCandidates.index]];
    if (!targetRoom) {
      return;
    }
    const currentRoom = Game.rooms[this.creep.room.name];

    let targetTimestamp = Memory.roomData[targetRoom.name]?.timestamp ?? 1;
    let currentTimestamp = Memory.roomData[currentRoom.name]?.timestamp ?? 1;

    const targetTimeSinceLastChart = Game.time - targetTimestamp;
    const currentTimeSinceLastChart = Game.time - currentTimestamp;

    if (currentTimeSinceLastChart > 100) {
      Memory.roomData[currentRoom.name] = {
        safeSources: findSafeSources(currentRoom).map(s => {
          return {
            id: s.id,
            pos: {
              x: s.pos.x,
              y: s.pos.y,
              roomName: s.pos.roomName
            }
          };
        }),
        controllerLevel: isValidControllerLevel(currentRoom.controller?.level)
          ? (currentRoom.controller?.level as ControllerLevel)
          : 0,
        owner: currentRoom.controller?.owner?.username,
        timestamp: Game.time
      };
    }

    if (targetTimeSinceLastChart < 1000) {
      explorationCandidates.index++;
    } else if (this.creep.room != targetRoom) {
      if (
        this.creep.moveTo(new RoomPosition(25, 25, targetRoom.name), {
          range: 23,
          swampCost: 1,
          plainCost: 1,
          reusePath: DEFAULT_LONG_JOURNEY_PATH,
          visualizePathStyle: { stroke: "#048243", opacity: DEFAULT_PATH_OPACITY }
        }) === ERR_NO_PATH
      ) {
        explorationCandidates.index++;
      }
    } else {
      Memory.roomData[currentRoom.name] = {
        safeSources: findSafeSources(targetRoom).map(s => {
          return {
            id: s.id,
            pos: {
              x: s.pos.x,
              y: s.pos.y,
              roomName: s.pos.roomName
            }
          };
        }),
        controllerLevel: isValidControllerLevel(targetRoom.controller?.level)
          ? (targetRoom.controller?.level as ControllerLevel)
          : 0,
        owner: targetRoom.controller?.owner?.username,
        timestamp: Game.time
      };
      this.creep.memory.forcedRenew = true; // always renew between charting targets
    }
  }

  construct(): void {
    // attempt to get ConstructionSite from taskTargets
    // this may fail due to no creeps/owned structures being in the same room as the construction site

    let finalTarget: ConstructionSite | undefined = undefined;
    let finalTargetData = this.memory.taskTargets[TaskType.Construct];

    if (!finalTargetData?.pos.x || !finalTargetData.pos.y || !finalTargetData.pos.roomName) {
      delete this.memory.taskTargets[TaskType.Construct];
    } else if (this.creep.room.name != finalTargetData.pos.roomName) {
      this.creep.moveTo(new RoomPosition(finalTargetData.pos.x, finalTargetData.pos.y, finalTargetData.pos.roomName), {
        range: 3,
        reusePath: DEFAULT_LONG_JOURNEY_PATH,
        visualizePathStyle: { stroke: "#FE5000", opacity: DEFAULT_PATH_OPACITY }
      });
      return;
    } else if (finalTargetData) {
      const cSite = Game.getObjectById(finalTargetData.id) ?? undefined;
      finalTarget = cSite instanceof ConstructionSite ? cSite : undefined;
    }

    if (!finalTarget) {
      let safeCSites = this.getAllSafeConstructionSites();
      if (safeCSites.length > 0) {
        this.memory.taskTargets[TaskType.Construct] = {
          id: safeCSites[0].id,
          pos: {
            x: safeCSites[0].pos.x,
            y: safeCSites[0].pos.y,
            roomName: safeCSites[0].pos.roomName
          },
          timestamp: Game.time
        };
        finalTarget = safeCSites[0];
      }
    }

    if (finalTarget) {
      if (this.creep.build(finalTarget) == ERR_NOT_IN_RANGE) {
        this.creep.moveTo(finalTarget, {
          range: 3,
          reusePath: DEFAULT_REUSE_PATH,
          visualizePathStyle: { stroke: "#FE5000", opacity: DEFAULT_PATH_OPACITY }
        });
      }
    }
  }

  deposit(): void {
    let finalTarget: HasStore | undefined = undefined;
    let taskTargetInfo = this.memory.taskTargets[TaskType.Construct];

    /**
     * check that the current task target is still a valid target for depositing energy
     */
    if (taskTargetInfo && Game.time - taskTargetInfo.timestamp < TASK_TARGET_AGE_LIMIT) {
      const taskTarget = Game.getObjectById(taskTargetInfo.id);
      if (hasStore(taskTarget) && taskTarget.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        finalTarget = taskTarget;
      }
    }

    /**
     * if finalTarget is undefined,
     * then a new target must be found (for any of the above reasons)
     *
     * FIND TARGET
     * target priority:
     * 1. spawn | structure
     * 2. container
     */
    if (finalTarget == undefined) {
      // check to make sure we actually have vision of the room before scanning
      const targetRoom = Game.rooms[this.memory.parentRoom];
      if (!targetRoom) {
        return;
      }
      const start = Game.getObjectById(this.memory.parentSource)?.pos ?? this.creep.pos;
      const freeSpawnsAndExtensions = Game.rooms[this.memory.parentRoom].find(FIND_MY_STRUCTURES, {
        filter: s => {
          return (
            (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        }
      }) as (StructureSpawn | StructureExtension)[];

      if (freeSpawnsAndExtensions.length > 0) {
        freeSpawnsAndExtensions.sort((a, b) => {
          return start.getRangeTo(a.pos) - start.getRangeTo(b.pos);
        });
        finalTarget = freeSpawnsAndExtensions[0];
        this.memory.taskTargets[TaskType.Deposit] = {
          id: finalTarget.id,
          pos: {
            x: finalTarget.pos.x,
            y: finalTarget.pos.y,
            roomName: finalTarget.room.name
          },
          timestamp: Game.time
        };
      } else {
        const freeContainers = Game.rooms[this.memory.parentRoom].find(FIND_STRUCTURES, {
          filter: s => {
            return s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        }) as StructureContainer[];
        if (freeContainers.length > 0) {
          freeContainers.sort((a, b) => {
            return start.getRangeTo(a.pos) - start.getRangeTo(b.pos);
          });
          finalTarget = freeContainers[0];
          this.memory.taskTargets[TaskType.Deposit] = {
            id: finalTarget.id,
            pos: {
              x: finalTarget.pos.x,
              y: finalTarget.pos.y,
              roomName: finalTarget.room.name
            },
            timestamp: Game.time
          };
        } else {
          // it's already undefined but this is redeclared for clarity
          finalTarget = undefined;
        }
      }
    }

    if (finalTarget == undefined) {
      delete this.memory.taskTargets[TaskType.Deposit];
      return;
    }

    if (this.creep.transfer(finalTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      if (this.creep.room.name != this.memory.parentRoom) {
        this.creep.moveTo(finalTarget, {
          range: 1,
          reusePath: DEFAULT_LONG_JOURNEY_PATH,
          visualizePathStyle: { stroke: "#ff1f1f", opacity: DEFAULT_PATH_OPACITY }
        });
      } else {
        this.creep.moveTo(finalTarget, {
          range: 1,
          reusePath: DEFAULT_REUSE_PATH,
          visualizePathStyle: { stroke: "#ff1f1f", opacity: DEFAULT_PATH_OPACITY }
        });
      }
    }
  }

  harvest(): void {
    const finalTargetData = this.memory.taskTargets[TaskType.Harvest];
    if (!finalTargetData?.pos.x || !finalTargetData.pos.y || !finalTargetData.pos.roomName) {
      return;
    }
    const finalTarget = Game.getObjectById(finalTargetData?.id ?? this.memory.parentSource);
    const finalTargetPos =
      finalTarget?.pos ?? new RoomPosition(finalTargetData.pos.x, finalTargetData.pos.y, finalTargetData.pos.roomName);

    if (this.creep.room.name != finalTargetPos.roomName) {
      this.creep.moveTo(finalTargetPos, {
        range: 1,
        reusePath: DEFAULT_LONG_JOURNEY_PATH,
        visualizePathStyle: { stroke: "#ffaa00", opacity: DEFAULT_PATH_OPACITY }
      });
    } else {
      if (finalTarget == null || this.creep.harvest(finalTarget) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(finalTarget ?? finalTargetPos, {
          range: 1,
          reusePath: DEFAULT_REUSE_PATH,
          visualizePathStyle: { stroke: "#ffaa00", opacity: DEFAULT_PATH_OPACITY }
        });
      }
    }
  }

  renew(): void {
    let finalTarget: StructureSpawn | undefined = undefined;
    let taskTargetInfo = this.memory.taskTargets[TaskType.Renew];

    if (taskTargetInfo) {
      finalTarget = Game.getObjectById(taskTargetInfo.id) ?? undefined;
    }

    if (!finalTarget) {
      // something catastrophic has happened
      return;
    }

    const targetRoom = finalTarget.room;

    const renewCost = this.findRenewCost();
    const energyStores = targetRoom.find(FIND_MY_STRUCTURES, {
      filter: s => {
        return s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN;
      }
    }) as (StructureSpawn | StructureExtension)[];
    let energyMax = 0;
    let energyAvailable = 0;

    for (const energyStore of energyStores) {
      energyMax += energyStore.store.getCapacity(RESOURCE_ENERGY) ?? 0;
      energyAvailable += energyStore.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
    }

    energyMax += this.creep.store.getCapacity(RESOURCE_ENERGY);
    energyAvailable += this.creep.store.getCapacity(RESOURCE_ENERGY);

    if (renewCost > energyMax) {
      console.log(`Not enough energy storage to renew this creep. ${this.creep.name} will now suicide.`);
      this.creep.suicide();
    } else if (renewCost > energyAvailable) {
      // withdraw
      if (this.creep.body.some(b => b.type === CARRY)) {
        const containers = targetRoom.find(FIND_STRUCTURES, {
          filter: s => {
            return s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) >= renewCost;
          }
        });
        if (containers.length > 0) {
          this.withdraw();
          return;
        }
        if (this.creep.body.some(b => b.type === WORK)) {
          this.harvest();
          return;
        }
      }
    } else {
      if (finalTarget.renewCreep(this.creep) == ERR_NOT_IN_RANGE) {
        if (this.creep.room.name != this.memory.parentRoom) {
          this.creep.moveTo(finalTarget, {
            range: 1,
            reusePath: DEFAULT_LONG_JOURNEY_PATH,
            visualizePathStyle: { stroke: "#ff3b9d", opacity: DEFAULT_PATH_OPACITY }
          });
        } else {
          this.creep.moveTo(finalTarget, {
            range: 1,
            reusePath: DEFAULT_REUSE_PATH,
            visualizePathStyle: { stroke: "#ff3b9d", opacity: DEFAULT_PATH_OPACITY }
          });
        }
      }
    }
  }

  repair(threshholds: { start: number; stop: number } = DEFAULT_REPAIR_BOUNDS): void {
    let finalTarget: Structure | undefined = undefined;
    let finalTargetData = this.memory.taskTargets[TaskType.Repair];

    if (!finalTargetData?.pos.x || !finalTargetData.pos.y || !finalTargetData.pos.roomName) {
      delete this.memory.taskTargets[TaskType.Repair];
    } else if (this.creep.room.name != finalTargetData.pos.roomName) {
      this.creep.moveTo(new RoomPosition(finalTargetData.pos.x, finalTargetData.pos.y, finalTargetData.pos.roomName), {
        range: 3,
        reusePath: DEFAULT_LONG_JOURNEY_PATH,
        visualizePathStyle: { stroke: "#FE5000", opacity: DEFAULT_PATH_OPACITY }
      });
    } else if (finalTargetData) {
      const _finalTarget = Game.getObjectById(finalTargetData.id) ?? undefined;
      if (!_finalTarget || _finalTarget.hits / _finalTarget.hitsMax > DEFAULT_REPAIR_BOUNDS.stop) {
        delete this.memory.taskTargets[TaskType.Repair];
      } else {
        finalTarget = _finalTarget;
      }
    }

    if (!finalTarget) {
      const potentialTargets = this.getAllSafeRepairTargets(threshholds);
      if (potentialTargets.length > 0) {
        potentialTargets.sort((a, b) => {
          return a.hits / a.hitsMax - b.hits / b.hitsMax;
        });
        this.memory.taskTargets[TaskType.Repair] = {
          id: potentialTargets[0].id,
          pos: {
            x: potentialTargets[0].pos.x,
            y: potentialTargets[0].pos.y,
            roomName: potentialTargets[0].pos.roomName
          },
          timestamp: Game.time
        };
        finalTarget = potentialTargets[0];
      }
    }

    if (finalTarget) {
      if (this.creep.repair(finalTarget) == ERR_NOT_IN_RANGE) {
        this.creep.moveTo(finalTarget, {
          range: 3,
          reusePath: DEFAULT_REUSE_PATH,
          visualizePathStyle: { stroke: "#00B300", opacity: DEFAULT_PATH_OPACITY }
        });
      }
    }
  }

  upgrade(): void {
    const finalTargetData = this.memory.taskTargets[TaskType.Upgrade];
    if (!finalTargetData?.pos.x || !finalTargetData.pos.y || !finalTargetData.pos.roomName) {
      return;
    }
    const finalTarget = Game.getObjectById(finalTargetData.id) ?? Game.rooms[this.creep.memory.parentRoom].controller;
    const finalTargetPos =
      finalTarget?.pos ?? new RoomPosition(finalTargetData.pos.x, finalTargetData.pos.y, finalTargetData.pos.roomName);

    if (this.creep.room.name != finalTargetPos.roomName) {
      this.creep.moveTo(finalTargetPos, {
        range: 3,
        reusePath: DEFAULT_LONG_JOURNEY_PATH,
        visualizePathStyle: { stroke: "#ffffff", opacity: DEFAULT_PATH_OPACITY }
      });
    } else {
      if (finalTarget == null || this.creep.upgradeController(finalTarget) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(finalTarget ?? finalTargetPos, {
          range: 3,
          reusePath: DEFAULT_REUSE_PATH,
          visualizePathStyle: { stroke: "#ffaa00", opacity: DEFAULT_PATH_OPACITY }
        });
      }
    }
  }

  wait(): void {
    this.memory.waiting--;
  }

  withdraw(): void {
    let finalTarget: HasStore | undefined = undefined;
    let taskTargetInfo = this.memory.taskTargets[TaskType.Withdraw];

    /**
     * check that the current task target is still a valid target for withdrawing energy
     */
    if (taskTargetInfo && Game.time - taskTargetInfo.timestamp < TASK_TARGET_AGE_LIMIT) {
      const taskTarget = Game.getObjectById(taskTargetInfo.id);
      if (hasStore(taskTarget) && taskTarget.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
        finalTarget = taskTarget;
      }
    }

    /**
     * if finalTarget is undefined,
     * then a new target must be found (for any of the above reasons)
     *
     * FIND TARGET
     * target priority:
     * 1. container
     * 2. nothing else as of now
     */

    if (finalTarget == undefined) {
      const targetRoom = Game.rooms[this.memory.parentRoom];
      if (!targetRoom) {
        return;
      }
      const start = Game.getObjectById(this.memory.parentSource)?.pos ?? this.creep.pos;
      const freeContainers = Game.rooms[this.memory.parentRoom].find(FIND_STRUCTURES, {
        filter: s => {
          return s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }
      }) as StructureContainer[];
      if (freeContainers.length > 0) {
        freeContainers.sort((a, b) => {
          return start.getRangeTo(a.pos) - start.getRangeTo(b.pos);
        });
        finalTarget = freeContainers[0];
        this.memory.taskTargets[TaskType.Withdraw] = {
          id: finalTarget.id,
          pos: {
            x: finalTarget.pos.x,
            y: finalTarget.pos.y,
            roomName: finalTarget.room.name
          },
          timestamp: Game.time
        };
      } else {
        // it's already undefined but this is redeclared for clarity
        finalTarget = undefined;
      }
    }

    if (finalTarget == undefined) {
      delete this.memory.taskTargets[TaskType.Withdraw];
      return;
    }

    if (this.creep.withdraw(finalTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      if (this.creep.room.name != this.memory.parentRoom) {
        this.creep.moveTo(finalTarget, {
          range: 1,
          reusePath: DEFAULT_LONG_JOURNEY_PATH,
          visualizePathStyle: { stroke: "#1f6dff", opacity: DEFAULT_PATH_OPACITY }
        });
      } else {
        this.creep.moveTo(finalTarget, {
          range: 1,
          reusePath: DEFAULT_REUSE_PATH,
          visualizePathStyle: { stroke: "#1f6dff", opacity: DEFAULT_PATH_OPACITY }
        });
      }
    }
  }

  findRenewCost(): number {
    return Math.ceil(
      _.sum(this.creep.body, bp => {
        return BODYPART_COST[bp.type];
      }) /
        2.5 /
        this.creep.body.length
    );
  }

  getAllSafeConstructionSites() {
    // always construct in current room, not home room
    // this is intended behavior AS OF THIS PUSH
    const csites = this.creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    const safeCSites = csites.filter(csite => {
      const hostilesNearby = csite.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
      return hostilesNearby.length === 0;
    });
    return safeCSites;
  }

  getAllSafeRepairTargets(threshholds: { start: number; stop: number } = DEFAULT_REPAIR_BOUNDS) {
    const structs = this.creep.room.find(FIND_STRUCTURES, {
      filter: s => {
        return s.hits / s.hitsMax < threshholds.start;
      }
    });
    return structs;
  }
}

export type HasStore = (AnyStructure | Creep) & { store: Store<ResourceConstant, false> };

function hasStore(target: any): target is HasStore {
  return target !== null && typeof target === "object" && "store" in target;
}
