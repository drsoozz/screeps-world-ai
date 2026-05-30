import { RoleType } from "creeps/roleType";
import { TaskType } from "creeps/taskType";
import { ControllerLevel } from "./isValidControllerLevel";

export {};

declare global {
  interface Memory {
    initialized: boolean;
    generatePixels: boolean;
    wasteCollection: number;
  }

  interface CreepMemory {
    role: RoleType;
    task: TaskType | undefined;
    parentRoom: Room["name"];
    parentSource: Id<Source>;
    controllerLevelAtBirth: ControllerLevel;
    numRenews: number;
    waiting: number;
    taskTargets: TaskTargetData;
  }
}

interface TaskTargetMap {
  [TaskType.Construct]: Structure | ConstructionSite;
  [TaskType.Deposit]: Structure;
  [TaskType.Harvest]: Source;
  [TaskType.Renew]: StructureSpawn;
  [TaskType.Repair]: Structure;
  [TaskType.Upgrade]: StructureController;
  [TaskType.Wait]: StructureSpawn;
  [TaskType.Withdraw]: Structure;
}

export type TaskTargetData = {
  [T in keyof TaskTargetMap]?: {
    id: Id<TaskTargetMap[T]>;
    pos: {
      x: number;
      y: number;
      roomName: Room["name"];
    };
    timestamp: number;
  };
};
