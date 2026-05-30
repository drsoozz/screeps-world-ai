import { RoleBase } from "creeps/roleBase";
import { TaskType } from "creeps/taskType";

export class Charter extends RoleBase {
  constructor(creep: Creep) {
    super(creep);
  }
  _findTask(): void {
    this.memory.task = TaskType.Chart;
  }
  
}
