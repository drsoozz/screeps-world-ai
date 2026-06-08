import { RoleType } from "creeps/roleType";
import { TaskType } from "creeps/taskType";
import { ControllerLevel } from "./ControllerLevel";
import { DehydratedRoomPosition } from "./DehydratedRoomPosition";
import { EnvironmentType } from "utils/initializeEnvironment";
import { MilitaryType } from "creeps/roles/militaryType";

export {};

declare global {
  interface Memory {
    initialized: boolean;
    generatePixels: boolean;
    wasteCollection: number;
    roomData: Partial<Record<Room["name"], RoomData>>;
    towerData: TowerData;
    structurePlanning: Partial<Record<Room["name"], structurePlanningData>>;
    exploitationPlanning: Partial<Record<Room["name"], structurePlanningDataRoads>>;
    creepPlanning: Partial<Record<Room["name"], { counter: number }>>;
    environment: EnvironmentType;
  }

  interface CreepMemory {
    role: RoleType;
    task: TaskType | undefined;
    oscillationBreak: {
      lastRoom: Room["name"];
      stuckTicks: number;
    };
    parentRoom: Room["name"];
    parentSource: Id<Source>;
    controllerLevelAtBirth: ControllerLevel;
    numRenews: number;
    forcedRenew: boolean;
    waiting: number;
    taskTargets: TaskTargetData;
    explorationCandidates?: {
      rooms: Room["name"][];
      index: number;
    };
    militaryMemory?: {
      commander: Id<Creep>;
      military: MilitaryType;
    };
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
  [TaskType.Attack]: Structure | AnyCreep;
  [TaskType.Chart]: StructureController;
  [TaskType.Construct]: Structure | ConstructionSite;
  [TaskType.Deposit]: Structure;
  [TaskType.Harvest]: Source;
  [TaskType.Raid]: Creep; // commander
  [TaskType.Rally]: Creep; // commander
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
  controllerLevel: ControllerLevel | undefined; // undefined if there is no controller
  owner: Owner["username"] | undefined;
  reserver: ReservationDefinition["username"] | undefined;
  hasHostiles: {
    creeps: boolean;
    powerCreeps: boolean;
    structures: boolean;
    spawns: boolean;
    constructionSites: boolean;
  };
  exploiter: Id<Spawn>;
  timestamp: number;
};

export type TaskTargetData = {
  [T in keyof TaskTargetMap]?: {
    id: Id<TaskTargetMap[T]>;
    pos: DehydratedRoomPosition;
    timestamp: number;
  };
};

export type TowerData = {
  towers: {
    id: Id<StructureTower>;
    currentTarget: Id<Creep | PowerCreep> | undefined;
    timestamp: number;
  }[];
  timestamp: number;
};
