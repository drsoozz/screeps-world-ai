import { DEFAULT_REPAIR_BOUNDS, LIFE_RENEW_BOUNDS, TASK_TARGET_AGE_LIMIT } from "consts";
import { TaskType } from "./taskType";
import { TaskActions } from "./TaskActions";
import { TaskTargetData } from "types/memory";

export class RoleBase {
  creep: Creep;
  memory: CreepMemory;
  taskActions: TaskActions;
  taskTargets: TaskTargetData;

  constructor(creep: Creep) {
    this.creep = creep;
    this.memory = creep.memory;
    this.taskActions = new TaskActions(creep);
    this.taskTargets = this.taskActions.taskTargets;
  }

  run(): void {
    this._breakOscillationLoop();
    if (this.memory.task !== TaskType.Renew && this.memory.task !== TaskType.Wait) {
      this._findTask();
    }
    this._findGeneralTask();
    this._doTask();
    this._doGeneralTask();
  }

  _breakOscillationLoop() {
    if (!this.creep.memory.oscillationBreak) {
      this.creep.memory.oscillationBreak = { lastRoom: this.creep.room.name, stuckTicks: 0 };
    }

    if (this.creep.memory.oscillationBreak.lastRoom !== this.creep.room.name) {
      this.creep.memory.oscillationBreak.stuckTicks = (this.creep.memory.oscillationBreak.stuckTicks || 0) + 1;
    } else {
      this.creep.memory.oscillationBreak.stuckTicks = 0;
    }

    this.creep.memory.oscillationBreak.lastRoom = this.creep.room.name;

    if (this.creep.memory.oscillationBreak.stuckTicks > 3) {
      const roomCenter = new RoomPosition(25, 25, this.creep.room.name);

      // Take a single step toward the center to pull away from the border
      this.creep.moveTo(roomCenter, { range: 0 });
      return;
    }
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
        this.memory.numRenews--;
      } else if (this.memory.waiting > 0) {
        this.memory.task = TaskType.Wait;
      } else if (this.memory.waiting === 0 && this.memory.task === TaskType.Wait) {
        this.memory.task = undefined;
      } // if waiting is a negative value it is assumed to be a permanent wait until something forcibly changes it
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
      case TaskType.Attack: {
        return this.taskActions.attack();
      }
      case TaskType.Chart: {
        return this.taskActions.chart();
      }
      case TaskType.Command: {
        return this.taskActions.command();
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
      case TaskType.Rally: {
        return this.taskActions.rally();
      }
      case TaskType.Raid: {
        return this.taskActions.raid();
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

  getAllAttackTargets(room: Room = this.creep.room) {
    return this.taskActions.getAllAttackTargets(room);
  }

  getAllSafeDepositTargets(room: Room = this.creep.room) {
    return this.taskActions.getAllSafeDepositTargets(room);
  }

  getAllSafeWithdrawTargets(room: Room = this.creep.room) {
    return this.taskActions.getAllSafeWithdrawTargets(room);
  }

  getAllSafeConstructionSites() {
    return this.taskActions.getAllSafeConstructionSites();
  }

  getAllSafeRepairTargets(threshholds: { start: number; stop: number } = DEFAULT_REPAIR_BOUNDS) {
    return this.taskActions.getAllSafeRepairTargets(threshholds);
  }

  isTaskTargetValid(task: TaskType, timeLimit: number = TASK_TARGET_AGE_LIMIT) {
    return this.taskActions.isTaskTargetValid(task, timeLimit);
  }
}
