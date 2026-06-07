import {
  CHART_TIMESTAMP_LIMIT,
  DEFAULT_LONG_JOURNEY_PATH,
  DEFAULT_PATH_OPACITY,
  DEFAULT_REPAIR_BOUNDS,
  DEFAULT_REUSE_PATH,
  TASK_TARGET_AGE_LIMIT
} from "consts";
import { TaskType } from "./taskType";
import { RoleType } from "./roleType";
import { findSafeSources } from "utils/findSafeSources";
import { ControllerLevel, isControllerLevel } from "types/ControllerLevel";
import { findExplorationCandidates } from "utils/findExplorationCandidates";
import { getDehydratedRoomPosition, getRehydratedRoomPosition } from "types/DehydratedRoomPosition";
import { TaskTargetData } from "types/memory";
import { getConstructPrioritySortWeight, getDepositPrioritySortWeight } from "utils/getSortWeights";

export class TaskActions {
  creep: Creep;
  memory: CreepMemory;
  role: RoleType;
  task?: TaskType;
  taskTargets: TaskTargetData;

  constructor(creep: Creep) {
    this.creep = creep;
    this.memory = creep.memory;
    this.role = this.memory.role;
    this.task = this.memory.task;
    this.taskTargets = this.memory.taskTargets;
  }

  chart(): void {
    let explorationCandidates = this.memory?.explorationCandidates;
    if (!explorationCandidates) {
      explorationCandidates = this.memory.explorationCandidates = { rooms: [], index: 0 };
    }
    if (explorationCandidates.rooms.length === 0) {
      explorationCandidates.rooms = findExplorationCandidates(Game.rooms[this.memory.parentRoom] ?? this.creep.room);
      explorationCandidates.index = 0;
    } else if (explorationCandidates.index >= explorationCandidates.rooms.length) {
      explorationCandidates.rooms = findExplorationCandidates(Game.rooms[this.memory.parentRoom] ?? this.creep.room);
      explorationCandidates.index = 0;
      this.memory.waiting = 1000;
    }

    const targetRoomName = explorationCandidates.rooms[explorationCandidates.index];
    const currentRoom = this.creep.room;

    let targetTimestamp = Memory.roomData?.[targetRoomName]?.timestamp ?? 1;
    let currentTimestamp = Memory.roomData?.[currentRoom.name]?.timestamp ?? 1;

    const targetTimeSinceLastChart = Game.time - targetTimestamp;
    const currentTimeSinceLastChart = Game.time - currentTimestamp;

    if (currentTimeSinceLastChart > CHART_TIMESTAMP_LIMIT / 10) {
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
        controllerLevel: isControllerLevel(currentRoom.controller?.level)
          ? (currentRoom.controller?.level as ControllerLevel)
          : 0,
        owner: currentRoom.controller?.owner?.username,
        timestamp: Game.time
      };
    }

    if (targetTimeSinceLastChart < CHART_TIMESTAMP_LIMIT) {
      explorationCandidates.index++;
    } else if (this.creep.room.name != targetRoomName) {
      if (
        this.creep.moveTo(new RoomPosition(25, 25, targetRoomName), {
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
      const targetRoom = Game.rooms[targetRoomName];
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
        controllerLevel: isControllerLevel(targetRoom.controller?.level)
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
    let finalTargetData = this.memory.taskTargets?.[TaskType.Construct];

    if (!finalTargetData?.pos.x || !finalTargetData?.pos.y || !finalTargetData?.pos.roomName) {
      delete this.memory.taskTargets[TaskType.Construct];
    } else if (this.creep.room.name != finalTargetData.pos.roomName) {
      this.creep.moveTo(getRehydratedRoomPosition(finalTargetData.pos), {
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
      let safeCSites = this.getAllSafeConstructionSites().sort((a, b) => {
        return (
          this.creep.pos.getRangeTo(a.pos) * getConstructPrioritySortWeight(a) -
          this.creep.pos.getRangeTo(b.pos) * getConstructPrioritySortWeight(b)
        );
      });
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
    let finalTargetData = this.memory.taskTargets?.[TaskType.Deposit];

    /**
     * check that the current task target is still a valid target for depositing energy
     */
    if (finalTargetData && Game.time - finalTargetData.timestamp < TASK_TARGET_AGE_LIMIT) {
      const taskTarget = Game.getObjectById(finalTargetData.id);
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
      const freeDepositTargets = Game.rooms[this.memory.parentRoom].find(FIND_MY_STRUCTURES, {
        filter: s => {
          return (
            (s.structureType === STRUCTURE_TOWER ||
              s.structureType === STRUCTURE_SPAWN ||
              s.structureType === STRUCTURE_EXTENSION) &&
            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        }
      }) as (StructureSpawn | StructureExtension | StructureTower)[];

      if (freeDepositTargets.length > 0) {
        freeDepositTargets.sort((a, b) => {
          return (
            start.getRangeTo(a.pos) * getDepositPrioritySortWeight(a) -
            start.getRangeTo(b.pos) * getDepositPrioritySortWeight(b)
          );
        });

        finalTarget = freeDepositTargets[0];
        finalTargetData = {
          id: finalTarget.id,
          pos: getDehydratedRoomPosition(finalTarget.pos),
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
            // dont need to weight as it's JUST containers
            return start.getRangeTo(a.pos) - start.getRangeTo(b.pos);
          });
          finalTarget = freeContainers[0];
          finalTargetData = {
            id: finalTarget.id,
            pos: getDehydratedRoomPosition(finalTarget.pos),
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
          visualizePathStyle: { stroke: "#1fff3d", opacity: DEFAULT_PATH_OPACITY }
        });
      } else {
        this.creep.moveTo(finalTarget, {
          range: 1,
          reusePath: DEFAULT_REUSE_PATH,
          visualizePathStyle: { stroke: "#1fff3d", opacity: DEFAULT_PATH_OPACITY }
        });
      }
    }
  }

  harvest(): void {
    const finalTargetData = this.memory.taskTargets?.[TaskType.Harvest];
    if (!finalTargetData?.pos.x || !finalTargetData?.pos.y || !finalTargetData?.pos.roomName) {
      return;
    }
    const finalTarget = Game.getObjectById(finalTargetData?.id ?? this.memory.parentSource);
    const finalTargetPos = finalTarget?.pos ?? getRehydratedRoomPosition(finalTargetData.pos);

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

    if (renewCost > energyMax) {
      console.log(`Not enough energy storage to renew this creep. ${this.creep.name} will now suicide.`);
      this.creep.suicide();
    } else if (renewCost > energyAvailable || energyAvailable < 100) {
      // withdraw
      if (this.creep.body.some(b => b.type === CARRY)) {
        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
          this.deposit();
        } else if (this.isTaskTargetValid(TaskType.Withdraw) || this.getAllSafeWithdrawTargets().length > 0) {
          this.withdraw();
        } else if (this.creep.body.some(b => b.type === WORK)) {
          this.harvest();
        }
      }
    } else {
      const result = finalTarget.renewCreep(this.creep);
      if (result === ERR_NOT_IN_RANGE) {
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
      } else if (result === ERR_NOT_ENOUGH_ENERGY) {
        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
          this.deposit();
        }
      }
    }
  }

  repair(threshholds: { start: number; stop: number } = DEFAULT_REPAIR_BOUNDS): void {
    let finalTarget: Structure | undefined = undefined;
    let finalTargetData = this.memory.taskTargets?.[TaskType.Repair];

    if (!finalTargetData?.pos.x || !finalTargetData?.pos.y || !finalTargetData?.pos.roomName) {
      delete this.memory.taskTargets[TaskType.Repair];
    } else if (this.creep.room.name != finalTargetData.pos.roomName) {
      this.creep.moveTo(getRehydratedRoomPosition(finalTargetData.pos), {
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
        finalTarget = potentialTargets[0];
        finalTargetData = {
          id: finalTarget.id,
          pos: getDehydratedRoomPosition(finalTarget.pos),
          timestamp: Game.time
        };
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
      if (
        hasStore(taskTarget) &&
        taskTarget.store.getUsedCapacity(RESOURCE_ENERGY) > (this.creep?.store?.getCapacity(RESOURCE_ENERGY) ?? 0)
      ) {
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

  findRenewCost(): number {
    return Math.ceil(
      _.sum(this.creep.body, bp => {
        return BODYPART_COST[bp.type];
      }) /
        2.5 /
        this.creep.body.length
    );
  }

  getAllSafeDepositTargets(room: Room = this.creep.room) {
    let safeDepositTargets = room
      .find(FIND_STRUCTURES, {
        filter: s => {
          return (
            (s.structureType === STRUCTURE_CONTAINER ||
              s.structureType === STRUCTURE_SPAWN ||
              s.structureType === STRUCTURE_EXTENSION) &&
            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        }
      })
      .filter(s => {
        const hostilesNearby = s.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
        return hostilesNearby.length === 0;
      });
    return safeDepositTargets as (StructureSpawn | StructureExtension | StructureContainer)[];
  }

  getAllSafeWithdrawTargets(room: Room = this.creep.room) {
    let safeDepositTargets = room
      .find(FIND_STRUCTURES, {
        filter: s => {
          return (
            s.structureType === STRUCTURE_CONTAINER &&
            s.store.getUsedCapacity(RESOURCE_ENERGY) > (this.creep?.store?.getCapacity(RESOURCE_ENERGY) ?? 0)
          );
        }
      })
      .filter(s => {
        const hostilesNearby = s.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
        return hostilesNearby.length === 0;
      });
    return safeDepositTargets as StructureContainer[];
  }

  getAllSafeConstructionSites() {
    let csites = this.creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    if (csites.length === 0) {
      // finds ALL CONSTRUCTION SITES globally if none exist in the current room
      csites = Object.values(Game.constructionSites);
    }
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

  isTaskTargetValid(task: TaskType, timeLimit: number = TASK_TARGET_AGE_LIMIT): boolean {
    const taskData = this.taskTargets?.[task];
    const tooOld = Game.time - (taskData?.timestamp ?? timeLimit) < timeLimit;
    return !!taskData && !tooOld;
  }
}

export type HasStore = (AnyStructure | Creep) & { store: Store<ResourceConstant, false> };

function hasStore(target: any): target is HasStore {
  return target !== null && typeof target === "object" && "store" in target;
}
