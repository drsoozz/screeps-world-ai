import { RoleBase } from "creeps/roleBase";
import { TaskType } from "creeps/taskType";

export class Harvester extends RoleBase {
  constructor(creep: Creep) {
    super(creep);
  }

  _findTask(): void {
    switch (this.memory.task) {
      case TaskType.Harvest: {
        if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
          this.memory.task = TaskType.Harvest;
        } else if (this.getAllSafeDepositTargets().length > 0) {
          this.memory.task = TaskType.Deposit;
        } else if (this.getAllSafeConstructionSites().length > 0) {
          this.memory.task = TaskType.Construct;
        } else if (this.getAllSafeRepairTargets().length > 0) {
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
        } else if (this.getAllSafeDepositTargets().length > 0) {
          this.memory.task = TaskType.Deposit;
        } else if (this.getAllSafeConstructionSites().length > 0) {
          this.memory.task = TaskType.Construct;
        } else if (this.getAllSafeRepairTargets().length > 0) {
          this.memory.task = TaskType.Repair;
        } else {
          this.memory.task = TaskType.Upgrade;
        }
        break;
      }
    }
  }
}
