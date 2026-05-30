import { TASK_TARGET_AGE_LIMIT } from "consts";
import { RoleBase } from "creeps/roleBase";
import { TaskType } from "creeps/taskType";

export class Constructor extends RoleBase {
  constructor(creep: Creep) {
    super(creep);
  }

  _findTask(): void {
    switch (this.memory.task) {
      default:
      case TaskType.Construct: {
        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) != 0) {
          if (this.getAllSafeConstructionSites().length > 0) {
            this.memory.task = TaskType.Construct;
          } else if (this.getAllSafeRepairTargets().length > 0) {
            this.memory.task = TaskType.Repair;
          } else {
            this.memory.task = TaskType.Upgrade;
          }
        } else if (this.getAllSafeWithdrawTargets().length > 0) {
          this.memory.task = TaskType.Withdraw;
        } else {
          this.memory.task = TaskType.Harvest;
        }
        break;
      }
      case TaskType.Harvest:
      case TaskType.Withdraw: {
        if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
          if (this.getAllSafeConstructionSites().length > 0) {
            this.memory.task = TaskType.Construct;
          } else if (this.getAllSafeRepairTargets().length > 0) {
            this.memory.task = TaskType.Repair;
          } else {
            this.memory.task = TaskType.Upgrade;
          }
        }
        break;
      }
    }
  }
}
