import {
  CHART_TIMESTAMP_LIMIT,
  DEFAULT_COMBAT_PATH,
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
import {
  getCommanderPrioritySortWeight,
  getConstructPrioritySortWeight,
  getDepositPrioritySortWeight
} from "utils/getSortWeights";
import { object } from "lodash";
import { MilitaryType } from "./roles/MilitaryType";
import { MilitaryTypeToTaskMap } from "./military/MilitaryTypeToTaskMap";
import { getRaidPos } from "./military/getRaidPos";

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

  attack(): void {
    let finalTargetData = this.memory.taskTargets?.[TaskType.Attack];
    let finalTarget: Structure | AnyCreep | undefined;
    if (!finalTargetData?.pos.x || !finalTargetData?.pos.y || !finalTargetData?.pos.roomName) {
      delete this.memory.taskTargets[TaskType.Attack];
    } else if (finalTargetData) {
      if (finalTargetData.pos.roomName !== this.creep.room.name) {
        const result = this.executeLongMoveTo(finalTargetData.pos.roomName, "#9c0101");
        if (result === ERR_NO_PATH) {
          delete this.memory.taskTargets[TaskType.Attack];
        }
        return;
      } else {
        finalTarget = Game.getObjectById(finalTargetData.id) ?? undefined;
        if (!finalTarget) {
          delete this.memory.taskTargets[TaskType.Attack];
          return;
        } else {
          finalTargetData.pos = getDehydratedRoomPosition(finalTarget?.pos);
        }
      }
    }

    if (!finalTarget) {
      let attackTargets = this.getAllAttackTargets();
      if (attackTargets.length > 0) {
        this.memory.taskTargets[TaskType.Attack] = {
          id: attackTargets[0].id,
          pos: { x: attackTargets[0].pos.x, y: attackTargets[0].pos.y, roomName: attackTargets[0].pos.roomName },
          timestamp: Game.time
        };
        finalTarget = attackTargets[0];
      }
    }

    if (finalTarget) {
      if (this.creep.attack(finalTarget) == ERR_NOT_IN_RANGE) {
        const result = this.executeCombatMoveTo(finalTarget.pos, "#9c0101");
      }
    }
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
    if (explorationCandidates.rooms.length === 0) {
      return;
    }
    const targetRoomName = explorationCandidates.rooms[explorationCandidates.index];
    const currentRoom = this.creep.room;

    let targetTimestamp = Memory.roomData?.[targetRoomName]?.timestamp ?? 1;
    let currentTimestamp = Memory.roomData?.[currentRoom.name]?.timestamp ?? 1;

    const targetTimeSinceLastChart = Game.time - targetTimestamp;
    const currentTimeSinceLastChart = Game.time - currentTimestamp;
    if (currentTimeSinceLastChart > CHART_TIMESTAMP_LIMIT / 10) {
      const hasHostiles = {
        creeps: currentRoom.find(FIND_HOSTILE_CREEPS).length > 0,
        powerCreeps: currentRoom.find(FIND_HOSTILE_POWER_CREEPS).length > 0,
        structures: currentRoom.find(FIND_HOSTILE_STRUCTURES).length > 0,
        spawns: currentRoom.find(FIND_HOSTILE_SPAWNS).length > 0,
        constructionSites: currentRoom.find(FIND_HOSTILE_CONSTRUCTION_SITES).length > 0
      };
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
          : undefined,
        owner: currentRoom.controller?.owner?.username,
        reserver: currentRoom.controller?.reservation?.username,
        hasHostiles: hasHostiles,
        exploiter:
          this.memory.taskTargets[TaskType.Renew]?.id ?? Game.rooms[this.memory.parentRoom].find(FIND_MY_SPAWNS)[0].id,
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
      const hasHostiles = {
        creeps: targetRoom.find(FIND_HOSTILE_CREEPS).length > 0,
        powerCreeps: targetRoom.find(FIND_HOSTILE_POWER_CREEPS).length > 0,
        structures: targetRoom.find(FIND_HOSTILE_STRUCTURES).length > 0,
        spawns: targetRoom.find(FIND_HOSTILE_SPAWNS).length > 0,
        constructionSites: targetRoom.find(FIND_HOSTILE_CONSTRUCTION_SITES).length > 0
      };

      Memory.roomData[targetRoom.name] = {
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
          : undefined,
        owner: targetRoom.controller?.owner?.username,
        reserver: currentRoom.controller?.reservation?.username,
        hasHostiles: hasHostiles,
        exploiter:
          this.memory.taskTargets[TaskType.Renew]?.id ?? Game.rooms[this.memory.parentRoom].find(FIND_MY_SPAWNS)[0].id,
        timestamp: Game.time
      };
      this.creep.memory.forcedRenew = true; // always renew between charting targets
    }
  }

  command(): void {
    const soldiers = this.getAllNearbySoldiers();
    const military = this.memory.militaryMemory?.military ?? MilitaryType.DEFENSE;
    const task = MilitaryTypeToTaskMap[military];
    let finalTargetData;
    switch (task) {
      default:
      case TaskType.Attack: {
        const _finalTargets = this.getAllAttackTargets().sort((a, b) => {
          return this.creep.pos.getRangeTo(a.pos) - this.creep.pos.getRangeTo(b.pos);
        });
        if (_finalTargets.length === 0) {
          this.memory.waiting = 10;
          return; // dont do anything right now
        }
        const finalTarget = _finalTargets[0];
        finalTargetData = {
          id: finalTarget.id,
          pos: getDehydratedRoomPosition(finalTarget.pos),
          timestamp: Game.time
        };

        for (const soldier of soldiers) {
          soldier.memory.task = task;
          soldier.memory.taskTargets[TaskType.Attack] = finalTargetData;
        }

        break;
      }
      case TaskType.Raid: {
        const pos = getRaidPos(this.creep.room);
        if (!pos) {
          return;
        }
        finalTargetData = {
          id: this.creep.id, // id of commander
          pos: pos, // position of room for soldiers to travel to during Raid task
          timestamp: Game.time
        };

        for (const soldier of soldiers) {
          soldier.memory.task = task;
          soldier.memory.taskTargets[TaskType.Raid] = finalTargetData;
        }
        break;
      }
    }
    this.memory.task = undefined;
    this.memory.waiting = 25;
  }

  construct(): void {
    // attempt to get ConstructionSite from taskTargets
    // this may fail due to no creeps/owned structures being in the same room as the construction site

    let finalTarget: ConstructionSite | undefined = undefined;
    let finalTargetData = this.memory.taskTargets?.[TaskType.Construct];

    if (!finalTargetData?.pos.x || !finalTargetData?.pos.y || !finalTargetData?.pos.roomName) {
      delete this.memory.taskTargets[TaskType.Construct];
    } else if (finalTargetData) {
      if (finalTargetData.pos.roomName !== this.creep.room.name) {
        const result = this.executeLongMoveTo(finalTargetData.pos.roomName, "#FE5000");
        if (result === ERR_NO_PATH) {
          delete this.memory.taskTargets[TaskType.Construct];
        }
        return;
      } else {
        const cSite = Game.getObjectById(finalTargetData.id) ?? undefined;
        finalTarget = cSite instanceof ConstructionSite ? cSite : undefined;
      }
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
        const result = this.executeNormalMoveTo(finalTarget.pos, "#FE5000", 3);
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
      if (finalTargetData.pos.roomName !== this.creep.room.name) {
        const result = this.executeLongMoveTo(finalTargetData.pos.roomName, "#1fff3d");
        if (result === ERR_NO_PATH) {
          delete this.memory.taskTargets[TaskType.Deposit];
        }
        return;
      } else {
        const taskTarget = Game.getObjectById(finalTargetData.id);
        if (hasStore(taskTarget) && taskTarget.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
          finalTarget = taskTarget;
          if (!finalTarget) {
            delete this.memory.taskTargets[TaskType.Deposit];
          }
        }
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
    if (!finalTarget) {
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
        finalTargetData = this.memory.taskTargets[TaskType.Deposit] = {
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
          finalTargetData = this.memory.taskTargets[TaskType.Deposit] = {
            id: finalTarget.id,
            pos: getDehydratedRoomPosition(finalTarget.pos),
            timestamp: Game.time
          };
        } else {
          // it's already undefined but this is redeclared for clarity
          finalTarget = undefined;
        }
      }

      // if target is still undefined
      if (finalTarget === undefined) {
        this.executeLongMoveTo(this.memory.parentRoom, "#000000");
      }
    }

    if (finalTarget === undefined) {
      return;
    }

    if (this.creep.transfer(finalTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      this.executeNormalMoveTo(finalTarget.pos, "#1fff3d");
    }
  }

  harvest(): void {
    const finalTargetData = this.memory.taskTargets?.[TaskType.Harvest];
    if (!finalTargetData?.pos.x || !finalTargetData?.pos.y || !finalTargetData?.pos.roomName) {
      return;
    }
    const finalTarget = Game.getObjectById(finalTargetData?.id ?? this.memory.parentSource);
    const finalTargetPos = finalTarget?.pos ?? getRehydratedRoomPosition(finalTargetData.pos);

    if (finalTarget == null || this.creep.harvest(finalTarget) === ERR_NOT_IN_RANGE) {
      this.executeNormalMoveTo(finalTargetPos, "#ffaa00");
    }
  }

  raid(): void {
    let raidTarget = this.memory.taskTargets[TaskType.Raid];
    if (!raidTarget) {
      this.task = TaskType.Rally;
      return;
    }
    if (this.creep.room.name !== raidTarget.pos.roomName) {
      const result = this.executeLongMoveTo(raidTarget.pos.roomName, "#9c3f01");
      if (result === ERR_NO_PATH) {
        this.task = TaskType.Rally;
        return;
      }
    } else {
      this.task = TaskType.Attack;
    }
  }

  rally(): void {
    let militaryMemory = this.memory?.militaryMemory;
    if (!militaryMemory) {
      return; // this creep should not be rallying
    }
    if (!militaryMemory?.commander) {
      // Commander creeps do not currently have commanders implemented. they are supposed to do nothing for rally()
      // this is because _doTask() has them do their correct stuff.
      return;
    }
    let commander = Game.getObjectById(militaryMemory.commander);
    if (!commander) {
      if (this.memory.role !== RoleType.Commander) {
        // TODO
        // commander has died
        // function for finding new commander?
        return;
      } else {
        commander = this.creep;
      }
    }
    this.executeNormalMoveTo(commander.pos, "#3aa6e1");
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
        this.executeNormalMoveTo(finalTarget.pos, "#ff3b9d", 1);
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
    } else if (finalTargetData) {
      if (finalTargetData.pos.roomName !== this.creep.room.name) {
        const result = this.executeLongMoveTo(finalTargetData.pos.roomName, "#b7ff43");

        if (result === ERR_NO_PATH) {
          delete this.memory.taskTargets[TaskType.Construct];
        }
        return;
      } else {
        const _finalTarget = Game.getObjectById(finalTargetData.id) ?? undefined;
        if (!_finalTarget || _finalTarget.hits / _finalTarget.hitsMax > DEFAULT_REPAIR_BOUNDS.stop) {
          delete this.memory.taskTargets[TaskType.Repair];
        } else {
          finalTarget = _finalTarget;
        }
      }
    }

    if (!finalTarget) {
      const potentialTargets = this.getAllSafeRepairTargets(threshholds);
      if (potentialTargets.length > 0) {
        potentialTargets.sort((a, b) => {
          return a.hits / a.hitsMax - b.hits / b.hitsMax;
        });
        finalTarget = potentialTargets[0];
        finalTargetData = this.memory.taskTargets[TaskType.Repair] = {
          id: finalTarget.id,
          pos: getDehydratedRoomPosition(finalTarget.pos),
          timestamp: Game.time
        };
      }
    }

    if (finalTarget) {
      if (this.creep.repair(finalTarget) == ERR_NOT_IN_RANGE) {
        this.executeNormalMoveTo(finalTarget.pos, "#b7ff43", 3);
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

    if (finalTarget == null || this.creep.upgradeController(finalTarget) === ERR_NOT_IN_RANGE) {
      this.executeNormalMoveTo(finalTargetPos, "#ffffff", 3);
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
      if (taskTargetInfo.pos.roomName !== this.creep.room.name) {
        const result = this.executeLongMoveTo(taskTargetInfo.pos.roomName, "#ff1f1f");
        if (result === ERR_NO_PATH) {
          delete this.memory.taskTargets[TaskType.Construct];
        }
        return;
      } else {
        const taskTarget = Game.getObjectById(taskTargetInfo.id);
        if (
          hasStore(taskTarget) &&
          taskTarget.store.getUsedCapacity(RESOURCE_ENERGY) > (this.creep?.store?.getCapacity(RESOURCE_ENERGY) ?? 0)
        ) {
          finalTarget = taskTarget;
        }
        if (!finalTarget) {
          delete this.memory.taskTargets[TaskType.Withdraw];
        }
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

    if (!finalTarget) {
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
      // if target is still undefined
      if (finalTarget === undefined) {
        this.executeLongMoveTo(this.memory.parentRoom, "#000000");
      }
    }

    if (finalTarget == undefined) {
      return;
    }

    if (this.creep.withdraw(finalTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      this.executeNormalMoveTo(finalTarget.pos, "#ff1f1f");
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

  getAllAttackTargets(room: Room = this.creep.room) {
    let attackTargets = [
      ...room.find(FIND_HOSTILE_POWER_CREEPS),
      ...room.find(FIND_HOSTILE_CREEPS),
      ...room.find(FIND_HOSTILE_STRUCTURES),
      ...room.find(FIND_HOSTILE_SPAWNS)
    ];
    return attackTargets as (Structure | AnyCreep)[];
  }

  getAllSafeDepositTargets(room: Room = this.creep.room) {
    // should be updated for global stuff?
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
      if (csite.room?.name !== this.creep.room.name) {
        return true;
      }
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

  getAllNearbySoldiers() {
    const top = this.creep.pos.y + 1;
    const left = this.creep.pos.x - 1;
    const bottom = this.creep.pos.y - 1;
    const right = this.creep.pos.x + 1;
    const numSoldiers = this.creep.room
      .lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)
      .map(c => c.creep)
      .filter(c => {
        const isMine = c.owner.username === this.creep.owner.username;
        const isSoldier = c.memory.role === RoleType.Soldier;
        return isMine && isSoldier;
      });
    return numSoldiers;
  }

  isTaskTargetValid(task: TaskType, timeLimit: number = TASK_TARGET_AGE_LIMIT): boolean {
    const taskData = this.taskTargets?.[task];
    const tooOld = Game.time - (taskData?.timestamp ?? timeLimit) < timeLimit;
    return !!taskData && !tooOld;
  }
  executeLongMoveTo(targetRoom: Room["name"], stroke: string): number {
    return this.creep.moveTo(new RoomPosition(25, 25, targetRoom), {
      range: 23,
      reusePath: DEFAULT_LONG_JOURNEY_PATH,
      visualizePathStyle: { stroke: stroke, opacity: DEFAULT_PATH_OPACITY }
    });
  }
  executeNormalMoveTo(target: RoomPosition, stroke: string, range: number = 1) {
    return this.creep.moveTo(target, {
      range: this.creep.room.name !== target.roomName ? range + 3 : range,
      reusePath: this.creep.room.name !== target.roomName ? DEFAULT_LONG_JOURNEY_PATH : DEFAULT_REUSE_PATH,
      visualizePathStyle: { stroke: stroke, opacity: DEFAULT_PATH_OPACITY }
    });
  }
  executeCombatMoveTo(target: RoomPosition, stroke: string, range: number = 1) {
    return this.creep.moveTo(target, {
      range: range,
      reusePath: this.creep.room.name !== target.roomName ? DEFAULT_LONG_JOURNEY_PATH : DEFAULT_COMBAT_PATH,
      visualizePathStyle: { stroke: stroke, opacity: DEFAULT_PATH_OPACITY }
    });
  }
}

export type HasStore = (AnyStructure | Creep) & { store: Store<ResourceConstant, false> };

function hasStore(target: any): target is HasStore {
  return target !== null && typeof target === "object" && "store" in target;
}
