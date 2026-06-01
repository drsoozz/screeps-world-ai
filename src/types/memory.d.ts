import { RoleType } from "creeps/roleType";
import { TaskType } from "creeps/taskType";
import { ControllerLevel } from "./ControllerLevel";
import { DehydratedRoomPosition } from "./DehydratedRoomPosition";

export {};

declare global {
  interface Memory {
    initialized: boolean;
    generatePixels: boolean;
    wasteCollection: number;
    explorationCandidates: {
      rooms: Room["name"][];
      index: number;
    };
    roomData: Partial<Record<Room["name"], RoomData>>;
    structurePlanning: Partial<Record<Room["name"], structurePlanningData>>;
    creepPlanning: Partial<Record<Room["name"], { counter: number }>>;
  }

  interface CreepMemory {
    role: RoleType;
    task: TaskType | undefined;
    parentRoom: Room["name"];
    parentSource: Id<Source>;
    controllerLevelAtBirth: ControllerLevel;
    numRenews: number;
    forcedRenew: boolean;
    waiting: number;
    taskTargets: TaskTargetData;
  }
}

export type structurePlanningData = {
  roads: structurePlanningDataRoads;
  towers: structurePlanningDataTowers;
};

export type structurePlanningDataRoads = {
  coords: DehydratedRoomPosition[];
  index: number;
};

export type structurePlanningDataTowers = {
  optimalPosition?: DehydratedRoomPosition;
};

interface TaskTargetMap {
  [TaskType.Chart]: StructureController;
  [TaskType.Construct]: Structure | ConstructionSite;
  [TaskType.Deposit]: Structure;
  [TaskType.Harvest]: Source;
  [TaskType.Renew]: StructureSpawn;
  [TaskType.Repair]: Structure;
  [TaskType.Upgrade]: StructureController;
  [TaskType.Wait]: StructureSpawn;
  [TaskType.Withdraw]: Structure;
}

export type RoomData = {
  safeSources: {
    id: Id<Source>;
    pos: DehydratedRoomPosition;
  }[];
  controllerLevel: ControllerLevel;
  owner: Owner["username"] | undefined;
  timestamp: number;
};

export type TaskTargetData = {
  [T in keyof TaskTargetMap]?: {
    id: Id<TaskTargetMap[T]>;
    pos: DehydratedRoomPosition;
    timestamp: number;
  };
};
