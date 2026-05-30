import { RoleBase } from "creeps/roleBase";
import { TaskType } from "creeps/taskType";

export class Harvester extends RoleBase {
  constructor(creep: Creep) {
    super(creep);
  }

  _findTask(): void {
    switch (this.memory.task) {
      default:
      case TaskType.Harvest: {
        if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
          if (this.getDepositTargets().length > 1) {
            this.memory.task = TaskType.Deposit;
          } else {
            this.memory.task = TaskType.Construct;
          }
        } else {
          this.memory.task = TaskType.Harvest;
        }
        break;
      }
      case TaskType.Deposit: {
        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
          this.memory.task = TaskType.Harvest;
        } else if (this.getDepositTargets().length < 1) {
          this.memory.task = TaskType.Construct;
        } else {
          this.memory.task = TaskType.Deposit;
        }
        break;
      }
    }
  }
}
