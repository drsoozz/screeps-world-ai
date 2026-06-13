import { RoleBase } from "creeps/roleBase";
import { TaskType } from "creeps/taskType";

export class Soldier extends RoleBase {
  constructor(creep: Creep) {
    super(creep);
  }
  _findTask(): void {
    switch (this.memory.task) {
      case TaskType.Rally: {
        if (this.taskActions.getAllAttackTargets().length > 0) {
          this.memory.task = TaskType.Attack;
        }
        this.memory.task = TaskType.Rally;
        break;
      }
      case TaskType.Raid: {
        this.memory.task = TaskType.Raid;
        break;
      }
      case TaskType.Attack: {
        if (this.taskActions.getAllAttackTargets().length === 0) {
          this.memory.forcedRenew = true;
          this.memory.task = TaskType.Rally;
        }
        this.memory.task = TaskType.Attack;
      }
    }
  }
}
