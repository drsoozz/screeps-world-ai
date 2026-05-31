import { DEFAULT_REPAIR_BOUNDS, LIFE_RENEW_BOUNDS } from "consts";
import { TaskType } from "./taskType";
import { TaskActions } from "./TaskActions";

export class RoleBase {
  creep: Creep;
  memory: CreepMemory;
  taskActions: TaskActions;
  constructor(creep: Creep) {
    this.creep = creep;
    this.memory = creep.memory;
    this.taskActions = new TaskActions(creep);
  }

  run(): void {
    if (this.memory.task !== TaskType.Renew && this.memory.task !== TaskType.Wait) {
      this._findTask();
    }
    this._findGeneralTask();
    this._doTask();
    this._doGeneralTask();
  }

  _findTask(): void {
    throw new Error("_findTask() must be implemented by subclass");
  }

  /**
   *
   * These typically will rewrite the current task if a more important task comes up,
   * such as renewing or waiting
   */
  _findGeneralTask(): void {
    if (this.memory.task != TaskType.Renew) {
      const canRenew = this.memory.numRenews > 0;
      const shouldRenew = (this.creep.ticksToLive ?? 1500) <= LIFE_RENEW_BOUNDS.start;
      const forcedRenew = this.creep.memory.forcedRenew;
      if ((canRenew && shouldRenew) || forcedRenew) {
        this.memory.task = TaskType.Renew;
        this.memory.forcedRenew = false;
      } else if (this.memory.waiting > 0) {
        this.memory.task = TaskType.Wait;
      } else if (this.memory.waiting <= 0 && this.memory.task === TaskType.Wait) {
        this.memory.task = undefined;
      }
    } else {
      const doneRenewing = (this.creep.ticksToLive ?? 1500) >= LIFE_RENEW_BOUNDS.stop;
      if (doneRenewing) {
        this.memory.task = undefined;
      }
    }
  }

  /**
   * `_doTask()` is implemented by subclass when needed
   */
  _doTask(): void {}

  _doGeneralTask(): void {
    switch (this.memory.task) {
      case TaskType.Chart: {
        return this.taskActions.chart();
      }
      case TaskType.Construct: {
        return this.taskActions.construct();
      }
      case TaskType.Deposit: {
        return this.taskActions.deposit();
      }
      case TaskType.Harvest: {
        return this.taskActions.harvest();
      }
      case TaskType.Renew: {
        return this.taskActions.renew();
      }
      case TaskType.Repair: {
        return this.taskActions.repair();
      }
      case TaskType.Upgrade: {
        return this.taskActions.upgrade();
      }
      case TaskType.Wait: {
        return this.taskActions.wait();
      }
      case TaskType.Withdraw: {
        return this.taskActions.withdraw();
      }
      default: {
        return;
      }
    }
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
          return s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }
      })
      .filter(s => {
        const hostilesNearby = s.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
        return hostilesNearby.length === 0;
      });
    return safeDepositTargets as StructureContainer[];
  }

  getAllSafeConstructionSites() {
    return this.taskActions.getAllSafeConstructionSites();
  }

  getAllSafeRepairTargets(threshholds: { start: number; stop: number } = DEFAULT_REPAIR_BOUNDS) {
    return this.taskActions.getAllSafeRepairTargets(threshholds);
  }
}
