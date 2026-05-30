import { RoleBase } from "creeps/roleBase";
import { TaskType } from "creeps/taskType";

export class Upgrader extends RoleBase {
  constructor(creep: Creep) {
    super(creep);
  }

  _findTask(): void {
    switch (this.memory.task) {
      case TaskType.Upgrade: {
        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
          this.memory.task = TaskType.Upgrade;
        } else if (this.getAllSafeWithdrawTargets().length > 0) {
          this.memory.task = TaskType.Withdraw;
        } else {
          this.memory.task = TaskType.Harvest;
        }
        break;
      }
      default:
      case TaskType.Withdraw: {
        if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
          this.memory.task = TaskType.Upgrade;
        } else if (this.getAllSafeWithdrawTargets().length > 0) {
          this.memory.task = TaskType.Withdraw;
        } else {
          this.memory.task = TaskType.Harvest;
        }
        break;
      }
    }
  }
}
