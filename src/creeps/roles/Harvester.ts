import { RoleBase } from "creeps/roleBase";
import { TaskType } from "creeps/taskType";
import { isTaskTargetValid } from "utils/isTaskTargetValid";

export class Harvester extends RoleBase {
  constructor(creep: Creep) {
    super(creep);
  }

  _findTask(): void {
    switch (this.memory.task) {
      case TaskType.Harvest: {
        if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
          this.memory.task = TaskType.Harvest;
        } else if (
          isTaskTargetValid(this.taskTargets, TaskType.Deposit) ||
          this.getAllSafeDepositTargets().length > 0
        ) {
          this.memory.task = TaskType.Deposit;
        } else if (
          isTaskTargetValid(this.taskTargets, TaskType.Construct) ||
          this.getAllSafeConstructionSites().length > 0
        ) {
          this.memory.task = TaskType.Construct;
        } else if (isTaskTargetValid(this.taskTargets, TaskType.Repair) || this.getAllSafeRepairTargets().length > 0) {
          this.memory.task = TaskType.Repair;
        } else {
          this.memory.task = TaskType.Upgrade;
        }
        break;
      }
      default:
      case TaskType.Deposit: {
        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
          this.memory.task = TaskType.Harvest;
        } else if (
          isTaskTargetValid(this.taskTargets, TaskType.Deposit) ||
          this.getAllSafeDepositTargets().length > 0
        ) {
          this.memory.task = TaskType.Deposit;
        } else if (
          isTaskTargetValid(this.taskTargets, TaskType.Construct) ||
          this.getAllSafeConstructionSites().length > 0
        ) {
          this.memory.task = TaskType.Construct;
        } else if (isTaskTargetValid(this.taskTargets, TaskType.Repair) || this.getAllSafeRepairTargets().length > 0) {
          this.memory.task = TaskType.Repair;
        } else {
          this.memory.task = TaskType.Upgrade;
        }
        break;
      }
    }
  }
}
